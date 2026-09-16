require("dotenv").config();


const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "1.1.1.1"
]);

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { MongoClient, GridFSBucket, ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB = process.env.MONGO_DB || "vendor_feasibility";

if (!MONGO_URI) {
  console.error("MONGO_URI is missing. Add it to backend/.env");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed."));
    }
    cb(null, true);
  }
});

let mongoClient;
let db;
let pdfBucket;

function safeFilePart(value) {
  const cleaned = String(value || "customer")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return cleaned || "customer";
}

function makePdfFileName(applicantName) {
  return `${safeFilePart(applicantName)}_vendor-feasibility.pdf`;
}

async function connectMongo() {
  mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();

  db = mongoClient.db(MONGO_DB);
  pdfBucket = new GridFSBucket(db, {
    bucketName: "vendorFeasibilityPdfs"
  });

  console.log(`MongoDB connected. Database: ${MONGO_DB}`);
}

// Save generated PDF + all entered values.
app.post(
  "/api/vendor-feasibility",
  upload.single("pdf"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "PDF file is required." });
      }

      const applicantName = String(req.body.applicantName || "").trim();

      if (!applicantName) {
        return res.status(400).json({ message: "Applicant name is required." });
      }

      const filename = makePdfFileName(applicantName);

      const metadata = {
        applicantName,
        reportDate: req.body.reportDate || "",
        location: req.body.location || "",
        entityType: req.body.entityType || "",
        financialFeasibility: {
          projectCost: req.body.projectCost || "",
          mnreSubsidy: req.body.mnreSubsidy || "",
          netProjectCost: req.body.netProjectCost || "",
          bankLoan: req.body.bankLoan || "",
          customerContribution: req.body.customerContribution || "",
          expectedRoi: req.body.expectedRoi || ""
        },
        savedAt: new Date()
      };

      const uploadStream = pdfBucket.openUploadStream(filename, {
        contentType: "application/pdf",
        metadata
      });

      uploadStream.on("error", next);

    uploadStream.on("finish", () => {
  res.status(201).json({
    success: true,
    message: "PDF saved successfully.",
    file: {
      _id: uploadStream.id.toString(),
      filename: filename
    }
  });
});

      uploadStream.end(req.file.buffer);
    } catch (error) {
      next(error);
    }
  }
);

// Fetch previous generated PDF records, newest first.
app.get("/api/vendor-feasibility", async (req, res, next) => {
  try {
    const files = await pdfBucket
      .find({})
      .sort({ uploadDate: -1 })
      .toArray();

    const result = files.map((file) => ({
      _id: file._id.toString(),
      filename: file.filename,
      uploadDate: file.uploadDate,
      size: file.length,
      applicantName: file.metadata?.applicantName || "",
      reportDate: file.metadata?.reportDate || "",
      location: file.metadata?.location || "",
      entityType: file.metadata?.entityType || "",
      financialFeasibility: file.metadata?.financialFeasibility || {}
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Stream one saved PDF for inline preview or download.
app.get("/api/vendor-feasibility/:id/pdf", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid PDF id." });
    }

    const id = new ObjectId(req.params.id);
    const file = await pdfBucket.find({ _id: id }).next();

    if (!file) {
      return res.status(404).json({ message: "PDF not found." });
    }

    const disposition = req.query.download === "1" ? "attachment" : "inline";
    const safeName = String(file.filename || "vendor-feasibility.pdf").replace(/"/g, "");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", file.length);
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${safeName}"`
    );

    const stream = pdfBucket.openDownloadStream(id);
    stream.on("error", next);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, database: MONGO_DB });
});

app.use((error, req, res, next) => {
  console.error(error);

  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: error.message });
  }

  res.status(500).json({
    message: error.message || "Internal server error."
  });
});

connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Vendor Feasibility API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  });

async function shutdown() {
  try {
    if (mongoClient) await mongoClient.close();
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
