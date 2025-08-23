// netlify/functions/getPdf.js
const { connectToDatabase } = require("./_mongodb");
const { GridFSBucket } = require("mongodb");

exports.handler = async function (event) {
  try {
    const filename = event.queryStringParameters.filename;
    if (!filename) {
      return { statusCode: 400, body: "Missing filename" };
    }

    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );

    const bucket = new GridFSBucket(db, { bucketName: "pdfs" });

    const chunks = [];
    await new Promise((resolve, reject) => {
      bucket
        .openDownloadStreamByName(filename)
        .on("data", (chunk) => chunks.push(chunk))
        .on("error", reject)
        .on("end", resolve);
    });

    const buffer = Buffer.concat(chunks);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("Error getting PDF:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
