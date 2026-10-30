// require("dotenv").config();


// const dns = require("dns");

// dns.setServers([
//   "8.8.8.8",
//   "1.1.1.1"
// ]);

// const express = require("express");
// const cors = require("cors");
// const multer = require("multer");
// const { MongoClient, GridFSBucket, ObjectId } = require("mongodb");

// const app = express();
// const PORT = process.env.PORT || 5000;
// const MONGO_URI = process.env.MONGO_URI;
// const MONGO_DB = process.env.MONGO_DB || "vendor_feasibility";

// if (!MONGO_URI) {
//   console.error("MONGO_URI is missing. Add it to backend/.env");
//   process.exit(1);
// }

// app.use(cors());
// app.use(express.json());

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 15 * 1024 * 1024
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype !== "application/pdf") {
//       return cb(new Error("Only PDF files are allowed."));
//     }
//     cb(null, true);
//   }
// });

// let mongoClient;
// let db;
// let pdfBucket;

// function safeFilePart(value) {
//   const cleaned = String(value || "customer")
//     .trim()
//     .replace(/[^a-zA-Z0-9_-]+/g, "_")
//     .replace(/^_+|_+$/g, "");

//   return cleaned || "customer";
// }

// function makePdfFileName(applicantName) {
//   return `${safeFilePart(applicantName)}_vendor-feasibility.pdf`;
// }

// async function connectMongo() {
//   mongoClient = new MongoClient(MONGO_URI);
//   await mongoClient.connect();

//   db = mongoClient.db(MONGO_DB);
//   pdfBucket = new GridFSBucket(db, {
//     bucketName: "vendorFeasibilityPdfs"
//   });

//   console.log(`MongoDB connected. Database: ${MONGO_DB}`);
// }

// // Save generated PDF + all entered values.
// app.post(
//   "/api/vendor-feasibility",
//   upload.single("pdf"),
//   async (req, res, next) => {
//     try {
//       if (!req.file) {
//         return res.status(400).json({ message: "PDF file is required." });
//       }

//       const applicantName = String(req.body.applicantName || "").trim();

//       if (!applicantName) {
//         return res.status(400).json({ message: "Applicant name is required." });
//       }

//       const filename = makePdfFileName(applicantName);

//       const metadata = {
//         applicantName,
//         reportDate: req.body.reportDate || "",
//         location: req.body.location || "",
//         entityType: req.body.entityType || "",
//         financialFeasibility: {
//           projectCost: req.body.projectCost || "",
//           mnreSubsidy: req.body.mnreSubsidy || "",
//           netProjectCost: req.body.netProjectCost || "",
//           bankLoan: req.body.bankLoan || "",
//           customerContribution: req.body.customerContribution || "",
//           expectedRoi: req.body.expectedRoi || ""
//         },
//         savedAt: new Date()
//       };

//       const uploadStream = pdfBucket.openUploadStream(filename, {
//         contentType: "application/pdf",
//         metadata
//       });

//       uploadStream.on("error", next);

//     uploadStream.on("finish", () => {
//   res.status(201).json({
//     success: true,
//     message: "PDF saved successfully.",
//     file: {
//       _id: uploadStream.id.toString(),
//       filename: filename
//     }
//   });
// });

//       uploadStream.end(req.file.buffer);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Fetch previous generated PDF records, newest first.
// app.get("/api/vendor-feasibility", async (req, res, next) => {
//   try {
//     const files = await pdfBucket
//       .find({})
//       .sort({ uploadDate: -1 })
//       .toArray();

//     const result = files.map((file) => ({
//       _id: file._id.toString(),
//       filename: file.filename,
//       uploadDate: file.uploadDate,
//       size: file.length,
//       applicantName: file.metadata?.applicantName || "",
//       reportDate: file.metadata?.reportDate || "",
//       location: file.metadata?.location || "",
//       entityType: file.metadata?.entityType || "",
//       financialFeasibility: file.metadata?.financialFeasibility || {}
//     }));

//     res.json(result);
//   } catch (error) {
//     next(error);
//   }
// });

// // Stream one saved PDF for inline preview or download.
// app.get("/api/vendor-feasibility/:id/pdf", async (req, res, next) => {
//   try {
//     if (!ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({ message: "Invalid PDF id." });
//     }

//     const id = new ObjectId(req.params.id);
//     const file = await pdfBucket.find({ _id: id }).next();

//     if (!file) {
//       return res.status(404).json({ message: "PDF not found." });
//     }

//     const disposition = req.query.download === "1" ? "attachment" : "inline";
//     const safeName = String(file.filename || "vendor-feasibility.pdf").replace(/"/g, "");

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Length", file.length);
//     res.setHeader(
//       "Content-Disposition",
//       `${disposition}; filename="${safeName}"`
//     );

//     const stream = pdfBucket.openDownloadStream(id);
//     stream.on("error", next);
//     stream.pipe(res);
//   } catch (error) {
//     next(error);
//   }
// });

// app.get("/api/health", (req, res) => {
//   res.json({ ok: true, database: MONGO_DB });
// });

// app.use((error, req, res, next) => {
//   console.error(error);

//   if (error instanceof multer.MulterError) {
//     return res.status(400).json({ message: error.message });
//   }

//   res.status(500).json({
//     message: error.message || "Internal server error."
//   });
// });

// connectMongo()
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log(`Vendor Feasibility API running on http://localhost:${PORT}`);
//     });
//   })
//   .catch((error) => {
//     console.error("MongoDB connection failed:", error);
//     process.exit(1);
//   });

// async function shutdown() {
//   try {
//     if (mongoClient) await mongoClient.close();
//   } finally {
//     process.exit(0);
//   }
// }

// process.on("SIGINT", shutdown);
// process.on("SIGTERM", shutdown);



require("dotenv").config();

const dns = require("dns");
// Preserve your existing DNS configuration. Remove if your environment manages DNS.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

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
  limits: { fileSize: 15 * 1024 * 1024 },
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
function metadataFromBody(body, previous = null) {
  const applicantName = String(body.applicantName || "").trim();
  if (!applicantName) throw Object.assign(new Error("Applicant name is required."), { status: 400 });
  const fields = ["reportDate", "location", "entityType", "projectCost", "mnreSubsidy", "netProjectCost", "bankLoan", "customerContribution", "expectedRoi"];
  for (const field of fields) {
    if (typeof body[field] !== "undefined" && typeof body[field] !== "string") {
      throw Object.assign(new Error(`Invalid ${field}.`), { status: 400 });
    }
    if (String(body[field] || "").length > 5000) {
      throw Object.assign(new Error(`${field} is too long.`), { status: 400 });
    }
  }
  return {
    applicantName,
    reportDate: body.reportDate || "",
    location: body.location || "",
    entityType: "Individual",
    financialFeasibility: {
      projectCost: body.projectCost || "",
      mnreSubsidy: body.mnreSubsidy || "",
      netProjectCost: body.netProjectCost || "",
      bankLoan: body.bankLoan || "",
      customerContribution: body.customerContribution || "",
      expectedRoi: body.expectedRoi || ""
    },
    savedAt: previous?.savedAt || new Date(),
    ...(previous ? { updatedAt: new Date(), replacesFileId: previous.replacesFileId || undefined } : {})
  };
}
function fileSummary(file) {
  return {
    _id: file._id.toString(),
    filename: file.filename,
    uploadDate: file.uploadDate,
    size: file.length,
    applicantName: file.metadata?.applicantName || "",
    reportDate: file.metadata?.reportDate || "",
    location: file.metadata?.location || "",
    entityType: file.metadata?.entityType || "",
    financialFeasibility: file.metadata?.financialFeasibility || {},
    updatedAt: file.metadata?.updatedAt || null
  };
}
async function uploadPdf(buffer, filename, metadata) {
  return new Promise((resolve, reject) => {
    const stream = pdfBucket.openUploadStream(filename, {
      metadata,
      contentType: "application/pdf"
    });
    stream.once("error", reject);
    stream.once("finish", () => resolve(stream.id));
    stream.end(buffer);
  });
}
function parseId(id) {
  if (!/^[a-fA-F0-9]{24}$/.test(id || "")) {
    throw Object.assign(new Error("Invalid PDF id."), { status: 400 });
  }
  return new ObjectId(id);
}

app.post("/api/vendor-feasibility", upload.single("pdf"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "PDF file is required." });
    const metadata = metadataFromBody(req.body);
    const filename = makePdfFileName(metadata.applicantName);
    const id = await uploadPdf(req.file.buffer, filename, metadata);
    res.status(201).json({ success: true, message: "PDF saved successfully.", file: { _id: id.toString(), filename } });
  } catch (error) { next(error); }
});

// Editing a saved PDF means regenerating it in the browser and replacing the
// corresponding GridFS file. GridFS files are immutable, so the replacement has
// a new ObjectId. We upload first so a failed upload preserves the old PDF.
app.put("/api/vendor-feasibility/:id", upload.single("pdf"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Updated PDF is required." });
    const oldId = parseId(req.params.id);
    const oldFile = await pdfBucket.find({ _id: oldId }).next();
    if (!oldFile) return res.status(404).json({ message: "Previous PDF not found." });

    const metadata = metadataFromBody(req.body, oldFile.metadata || {});
    metadata.replacesFileId = oldId.toString();
    const filename = makePdfFileName(metadata.applicantName);
    const newId = await uploadPdf(req.file.buffer, filename, metadata);

    try {
      await pdfBucket.delete(oldId);
    } catch (deleteError) {
      // A deletion failure must be surfaced instead of claiming the replacement
      // was clean. New PDF is preserved so data is not lost; administrator can reconcile.
      console.error("New file uploaded but old file deletion failed:", { oldId: oldId.toString(), newId: newId.toString(), error: deleteError });
      return res.status(500).json({
        message: "Updated PDF uploaded, but old version could not be removed. Contact administrator to reconcile duplicate records.",
        file: { _id: newId.toString(), filename }
      });
    }
    res.json({ success: true, message: "PDF updated successfully.", file: { _id: newId.toString(), filename } });
  } catch (error) { next(error); }
});

app.get("/api/vendor-feasibility", async (req, res, next) => {
  try {
    const files = await pdfBucket.find({}).sort({ uploadDate: -1 }).toArray();
    res.json(files.map(fileSummary));
  } catch (error) { next(error); }
});

app.get("/api/vendor-feasibility/:id/pdf", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const file = await pdfBucket.find({ _id: id }).next();
    if (!file) return res.status(404).json({ message: "PDF not found." });
    const disposition = req.query.download === "1" ? "attachment" : "inline";
    const safeName = String(file.filename || "vendor-feasibility.pdf").replace(/["\\\r\n]/g, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", file.length);
    res.setHeader("Content-Disposition", `${disposition}; filename="${safeName}"`);
    const stream = pdfBucket.openDownloadStream(id);
    stream.on("error", (error) => {
      if (res.headersSent) res.destroy(error);
      else next(error);
    });
    stream.pipe(res);
  } catch (error) { next(error); }
});

// Lightweight public endpoint for uptime monitors. A successful response
// confirms that this process and its MongoDB connection are responsive.
async function healthCheck(req, res) {
  try {
    await db.command({ ping: 1 });
    res.set("Cache-Control", "no-store");
    res.status(200).json({ ok: true, status: "healthy", database: "connected", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Health check failed:", error);
    res.set("Cache-Control", "no-store");
    res.status(503).json({ ok: false, status: "unhealthy", database: "unavailable" });
  }
}
app.get("/api/health", healthCheck);
app.get("/health", healthCheck);
app.use((error, req, res, next) => {
  console.error(error);
  if (error instanceof multer.MulterError) return res.status(400).json({ message: error.message });
  if (error.message === "Only PDF files are allowed.") return res.status(400).json({ message: error.message });
  res.status(error.status || 500).json({ message: error.status ? error.message : "Internal server error." });
});

async function connectMongo() {
  mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();
  db = mongoClient.db(MONGO_DB);
  pdfBucket = new GridFSBucket(db, { bucketName: "vendorFeasibilityPdfs" });
  console.log(`MongoDB connected. Database: ${MONGO_DB}`);
}
connectMongo().then(() => app.listen(PORT, () => console.log(`Vendor Feasibility API running on http://localhost:${PORT}`)))
  .catch((error) => { console.error("MongoDB connection failed:", error); process.exit(1); });
async function shutdown() {
  try { if (mongoClient) await mongoClient.close(); }
  finally { process.exit(0); }
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
