// netlify/functions/addPatientRecord.js

const { connectToDatabase } = require("./_mongodb");
const { ObjectId } = require("mongodb");
const fetch = require("node-fetch");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Parse request body
    const data = JSON.parse(event.body || "{}");
    const { id } = data;
    if (!id) {
      return { statusCode: 400, body: "Missing patient ID" };
    }

    // Build clinical record
    const record = {
      triage: data.triage || null,
      primarySurvey: data.primarySurvey || null,
      news2Record: data.news2Record || null,

      edLocation: data.edLocation || null,
      allergies: data.allergies || null,
      triageTime: data.triageTime || null,

      nurse: data.nurse || null,
      overseeingClinician: data.overseeingClinician || null,
      directClinician: data.directClinician || null,
      specialistClinician: data.specialistClinician || null,
      pharmacist: data.pharmacist || null,
      ccot: data.ccot || null,
      consultingSpeciality: data.consultingSpeciality || null,
      admittingSpeciality: data.admittingSpeciality || null,

      news2Score: data.news2Score || null,
      heartRate: data.heartRate || null,
      bloodPressure: data.bloodPressure || null,
      spO2: data.spO2 || null,
      respiratoryRate: data.respiratoryRate || null,
      temperature: data.temperature || null,
      avpu: data.avpu || null,
      gcs: data.gcs || null,

      presentingComplaint: data.presentingComplaint || null,
      historyPresentingComplaint: data.historyPresentingComplaint || null,
      pastMedicalHistory: data.pastMedicalHistory || null,
      currentMedications: data.currentMedications || null,
      differentialDiagnosis: data.differentialDiagnosis || null,

      whoDischarged: data.whoDischarged || null,
      timeDischarge: data.timeDischarge || null,
      outcomePatient: data.outcomePatient || null,

      createdAt: new Date(),
      createdBy: data.createdBy || "staff",
    };

    // Connect to MongoDB
    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );
    const patientsCol = db.collection("patients");

    // Push record and update latestClinicalInfo
    const updateResult = await patientsCol.updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { medicalHistory: record },
        $set: { latestClinicalInfo: record },
      }
    );

    if (updateResult.modifiedCount === 0) {
      return { statusCode: 404, body: "Patient not found" };
    }

    // Send log to Discord if webhook exists
    if (process.env.DISCORD_WEBHOOK_URL) {
      const message = {
        username: "Patient Logger",
        embeds: [
          {
            title: "📋 New Clinical Record Added",
            color: 0x1d5fad,
            fields: [
              { name: "Patient ID", value: id, inline: true },
              { name: "Created By", value: record.createdBy, inline: true },
              {
                name: "ED Location",
                value: record.edLocation || "N/A",
                inline: true,
              },
              {
                name: "Triage Time",
                value: record.triageTime || "N/A",
                inline: true,
              },
              {
                name: "NEWS2 Score",
                value: record.news2Score?.toString() || "N/A",
                inline: true,
              },
              {
                name: "Primary Complaint",
                value: record.presentingComplaint || "N/A",
              },
            ],
            footer: { text: `Created at ${record.createdAt.toISOString()}` },
          },
        ],
      };

      try {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message),
        });
      } catch (discordErr) {
        console.error("Discord webhook failed:", discordErr);
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("Error in addPatientRecord:", err);
    return { statusCode: 500, body: err.message };
  }
};
