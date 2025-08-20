// netlify/functions/addPatientRecord.js

const { connectToDatabase } = require("./_mongodb");
const { verifyTokenFromHeaders } = require("./_auth");
const { ObjectId } = require("mongodb");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const user = verifyTokenFromHeaders(event.headers); // returns user payload

    const data = JSON.parse(event.body || "{}");
    const { id } = data;

    if (!id) {
      return { statusCode: 400, body: "Missing patient ID" };
    }

    // Build clinical record with all fields, fallback to null
    const record = {
      triage: data.triage || null,
      primarySurvey: data.primarySurvey || null,
      news2Record: data.news2Record || null,

      // TRIAGE Section
      edLocation: data.edLocation || null,
      allergies: data.allergies || null,
      triageTime: data.triageTime || null,

      // CARE TEAM Section
      nurse: data.nurse || null,
      overseeingClinician: data.overseeingClinician || null,
      directClinician: data.directClinician || null,
      specialistClinician: data.specialistClinician || null,
      pharmacist: data.pharmacist || null,
      ccot: data.ccot || null,
      consultingSpeciality: data.consultingSpeciality || null,
      admittingSpeciality: data.admittingSpeciality || null,

      // LATEST OBSERVATIONS
      news2Score: data.news2Score || null,
      heartRate: data.heartRate || null,
      bloodPressure: data.bloodPressure || null,
      spO2: data.spO2 || null,
      respiratoryRate: data.respiratoryRate || null,
      temperature: data.temperature || null,
      avpu: data.avpu || null,
      gcs: data.gcs || null,

      // OTHER DETAILS
      presentingComplaint: data.presentingComplaint || null,
      historyPresentingComplaint: data.historyPresentingComplaint || null,
      pastMedicalHistory: data.pastMedicalHistory || null,
      currentMedications: data.currentMedications || null,
      differentialDiagnosis: data.differentialDiagnosis || null,

      // NEW FREE-TEXT FIELDS
      clinicianNotes: data.clinicianNotes || null,
      nursingNotes: data.nursingNotes || null,
      imagingOrders: data.imagingOrders || null,
      bloodworkOrders: data.bloodworkOrders || null,

      // DISCHARGE LOGS
      whoDischarged: data.whoDischarged || null,
      timeDischarge: data.timeDischarge || null,
      outcomePatient: data.outcomePatient || null,

      createdAt: new Date(),
      createdBy: user?.username || "staff",
    };

    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );
    const patientsCol = db.collection("patients");

    // Push record to medicalHistory AND update latestClinicalInfo field
    const updateResult = await patientsCol.updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { medicalHistory: record },
        $set: { latestClinicalInfo: record },
      }
    );

    if (updateResult.modifiedCount === 0) {
      return {
        statusCode: 404,
        body: "Patient not found or no update performed",
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error(err);
    const status =
      err.code === "NO_AUTH" || err.code === "INVALID_TOKEN" ? 401 : 500;
    return { statusCode: status, body: String(err.message) };
  }
};
