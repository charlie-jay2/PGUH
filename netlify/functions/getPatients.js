// getPatients.js
const { connectToDatabase } = require("./_mongodb");

exports.handler = async function (event) {
  if (event.httpMethod !== "GET")
    return { statusCode: 405, body: "Method not allowed" };
  try {
    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );
    const col = db.collection("patients");

    // Fetch patients, priority field will be included if stored in DB
    const patients = await col
      .find({})
      .sort({ createdAt: -1 })
      .limit(1000)
      .toArray();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patients }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: String(err.message) };
  }
};
