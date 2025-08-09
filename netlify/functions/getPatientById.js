// netlify/functions/getPatientById.js

const { connectToDatabase } = require("./_mongodb");
const { ObjectId } = require("mongodb");

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Removed token verification

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

    // Determine latest clinical info for prefill
    let latestClinicalInfo = null;

    if (patient.latestClinicalInfo) {
      latestClinicalInfo = patient.latestClinicalInfo;
    } else if (
      Array.isArray(patient.clinicalRecords) &&
      patient.clinicalRecords.length > 0
    ) {
      latestClinicalInfo =
        patient.clinicalRecords[patient.clinicalRecords.length - 1];
    } else if (
      Array.isArray(patient.medicalHistory) &&
      patient.medicalHistory.length > 0
    ) {
      latestClinicalInfo =
        patient.medicalHistory[patient.medicalHistory.length - 1];
    }

    const responsePatient = {
      ...patient,
      latestClinicalInfo,
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(responsePatient),
    };
  } catch (err) {
    console.error(err);
    // Simplified error handling - no auth errors
    return { statusCode: 500, body: String(err.message) };
  }
};
