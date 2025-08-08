// netlify/functions/getPatientById.js

const { connectToDatabase } = require("./_mongodb");
const { verifyTokenFromHeaders } = require("./_auth");
const { ObjectId } = require("mongodb");

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    verifyTokenFromHeaders(event.headers);

    const id = event.queryStringParameters && event.queryStringParameters.id;
    if (!id) {
      return { statusCode: 400, body: "Missing patient ID" };
    }

    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );
    const patientsCol = db.collection("patients");

    const patient = await patientsCol.findOne({ _id: new ObjectId(id) });
    if (!patient) {
      return { statusCode: 404, body: "Patient not found" };
    }

    // Optionally remove sensitive fields if any before returning
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patient),
    };
  } catch (err) {
    console.error(err);
    const status =
      err.code === "NO_AUTH" || err.code === "INVALID_TOKEN" ? 401 : 500;
    return { statusCode: status, body: String(err.message) };
  }
};
