// netlify/functions/addPatientRecord.js

const { connectToDatabase } = require("./_mongodb");
const { verifyTokenFromHeaders } = require("./_auth");
const { ObjectId } = require("mongodb");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    verifyTokenFromHeaders(event.headers);

    const data = JSON.parse(event.body || "{}");
    const { id, triage, primarySurvey, news2Record } = data;

    if (!id) {
      return { statusCode: 400, body: "Missing patient ID" };
    }

    if (!triage && !primarySurvey && !news2Record) {
      return { statusCode: 400, body: "No clinical info provided" };
    }

    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );
    const patientsCol = db.collection("patients");

    const record = {
      triage: triage || null,
      primarySurvey: primarySurvey || null,
      news2Record: news2Record || null,
      createdAt: new Date(),
      createdBy: "staff", // Optionally grab username from token payload
    };

    // Push new clinical record into an array field "medicalHistory"
    const updateResult = await patientsCol.updateOne(
      { _id: new ObjectId(id) },
      { $push: { medicalHistory: record } }
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
