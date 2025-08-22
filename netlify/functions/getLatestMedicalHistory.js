// netlify/functions/getLatestMedicalHistory.js

const { connectToDatabase } = require("./_mongodb");
const { ObjectId } = require("mongodb");

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
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

    const medicalHistory = patient.medicalHistory || [];
    const latestRecord = medicalHistory.length
      ? medicalHistory[medicalHistory.length - 1]
      : {};

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(latestRecord),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: String(err.message) };
  }
};
