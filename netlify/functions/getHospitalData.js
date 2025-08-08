// getHospitalData.js
const { connectToDatabase } = require("./_mongodb");

exports.handler = async function (event) {
  if (event.httpMethod !== "GET")
    return { statusCode: 405, body: "Method not allowed" };
  try {
    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );
    const col = db.collection("hospital_metadata");

    const hospital = await col.findOne({ _id: "main" });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Allow public access from anywhere
      },
      body: JSON.stringify({ hospital }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: String(err.message) };
  }
};
