// createPatient.js
const { connectToDatabase } = require("./_mongodb");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method not allowed" };

  try {
    const payload = JSON.parse(event.body || "{}");

    const record = {
      robloxName: payload.robloxName || "", // NEW field
      dateOfBirth: payload.dateOfBirth || "", // NEW field (string ISO date)
      patientId: payload.patientId || "",
      nilByMouth: payload.nilByMouth || "", // NEW field ('Y' or 'N')
      presentingComplaint: payload.presentingComplaint || "", // NEW field
      name: payload.name || "", // Optional
      age: payload.age ?? null,
      ward: payload.ward || "",
      notes: payload.notes || "",
      priority: Number.isInteger(payload.priority) ? payload.priority : 0,
      createdBy: payload.createdBy || "unknown",
      createdAt: new Date().toISOString(),
    };

    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );
    const col = db.collection("patients");
    const res = await col.insertOne(record);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, id: res.insertedId }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: String(err.message) };
  }
};
