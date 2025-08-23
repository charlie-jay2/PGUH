const { connectToDatabase } = require("./_mongodb");

exports.handler = async function () {
  try {
    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );

    const files = await db
      .collection("pdfs.files")
      .find({})
      .sort({ uploadDate: -1 })
      .toArray();

    return {
      statusCode: 200,
      body: JSON.stringify(
        files.map((f) => ({
          filename: f.filename,
          uploadDate: f.uploadDate,
          metadata: f.metadata || {},
        }))
      ),
    };
  } catch (err) {
    console.error("Error listing PDFs:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
