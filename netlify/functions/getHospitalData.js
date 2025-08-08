// getHospitalData.js
const { connectToDatabase } = require("./_mongodb");
const { verifyTokenFromHeaders } = require("./_auth");

exports.handler = async function (event) {
  if (event.httpMethod !== "GET")
    return { statusCode: 405, body: "Method not allowed" };
  try {
    // verify token (throws if invalid)
    verifyTokenFromHeaders(event.headers);

    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );
    const col = db.collection("hospital_metadata");

    const hospital = await col.findOne({ _id: "main" });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospital }),
    };
  } catch (err) {
    console.error(err);
    const status =
      err.code === "NO_AUTH" || err.code === "INVALID_TOKEN" ? 401 : 500;
    return { statusCode: status, body: String(err.message) };
  }
};
