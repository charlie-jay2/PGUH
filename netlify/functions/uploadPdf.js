// netlify/functions/uploadPdf.js
const { connectToDatabase } = require("./_mongodb");
const { GridFSBucket } = require("mongodb");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Get raw PDF bytes
    const pdfBuffer = Buffer.from(event.body, "base64"); // Netlify passes body as base64 when binary
    const patientId = event.headers["x-patient-id"] || "Unknown";

    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );

    const bucket = new GridFSBucket(db, { bucketName: "pdfs" });

    // Upload stream into GridFS
    await new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(
        `Patient(${patientId}).pdf`,
        {
          metadata: { patientId, uploadedAt: new Date() },
        }
      );

      uploadStream.end(pdfBuffer, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "PDF uploaded to MongoDB",
      }),
    };
  } catch (err) {
    console.error("Upload error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
