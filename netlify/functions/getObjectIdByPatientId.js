// netlify/functions/getObjectIdByPatientId.js

const { connectToDatabase } = require("./_mongodb");
const { ObjectId } = require("mongodb");

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const patientId =
      event.queryStringParameters && event.queryStringParameters.patientId;
    if (!patientId) {
      return { statusCode: 400, body: "Missing patientId" };
    }

    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );
    const patientsCol = db.collection("patients");

    const patient = await patientsCol.findOne({ patientId: patientId });

    if (!patient) {
      return { statusCode: 404, body: "Patient not found" };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objectId: patient._id.toString() }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  }
};
