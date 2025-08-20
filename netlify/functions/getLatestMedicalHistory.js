// netlify/functions/getLatestMedicalHistory.js

const { connectToDatabase } = require("./_mongodb");
const { verifyTokenFromHeaders } = require("./_auth");
const { ObjectId } = require("mongodb");

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Verify JWT from headers
    const user = verifyTokenFromHeaders(event.headers);

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

    // Ensure all expected fields exist, even if null
    const response = {
      triage: latestRecord.triage || null,
      primarySurvey: latestRecord.primarySurvey || null,
      news2Record: latestRecord.news2Record || null,
      edLocation: latestRecord.edLocation || null,
      allergies: latestRecord.allergies || null,
      triageTime: latestRecord.triageTime || null,
      nurse: latestRecord.nurse || null,
      overseeingClinician: latestRecord.overseeingClinician || null,
      directClinician: latestRecord.directClinician || null,
      specialistClinician: latestRecord.specialistClinician || null,
      pharmacist: latestRecord.pharmacist || null,
      ccot: latestRecord.ccot || null,
      consultingSpeciality: latestRecord.consultingSpeciality || null,
      admittingSpeciality: latestRecord.admittingSpeciality || null,
      clinicianNotes: latestRecord.clinicianNotes || null,
      nursingNotes: latestRecord.nursingNotes || null,
      imagingOrders: latestRecord.imagingOrders || null,
      bloodworkOrders: latestRecord.bloodworkOrders || null,
      news2Score: latestRecord.news2Score || null,
      heartRate: latestRecord.heartRate || null,
      bloodPressure: latestRecord.bloodPressure || null,
      spO2: latestRecord.spO2 || null,
      respiratoryRate: latestRecord.respiratoryRate || null,
      temperature: latestRecord.temperature || null,
      avpu: latestRecord.avpu || null,
      gcs: latestRecord.gcs || null,
      presentingComplaint: latestRecord.presentingComplaint || null,
      historyPresentingComplaint:
        latestRecord.historyPresentingComplaint || null,
      pastMedicalHistory: latestRecord.pastMedicalHistory || null,
      currentMedications: latestRecord.currentMedications || null,
      differentialDiagnosis: latestRecord.differentialDiagnosis || null,
      whoDischarged: latestRecord.whoDischarged || null,
      timeDischarge: latestRecord.timeDischarge || null,
      outcomePatient: latestRecord.outcomePatient || null,
      createdAt: latestRecord.createdAt || null,
      createdBy: latestRecord.createdBy || null,
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error(err);
    const status =
      err.code === "NO_AUTH" || err.code === "INVALID_TOKEN" ? 401 : 500;
    return { statusCode: status, body: String(err.message) };
  }
};
