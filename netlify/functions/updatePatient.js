// updatePatient.js
const { connectToDatabase } = require("./_mongodb");
const { ObjectId } = require("mongodb");
const { verifyTokenFromHeaders } = require("./_auth");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method not allowed" };
  try {
    const user = verifyTokenFromHeaders(event.headers);
    const payload = JSON.parse(event.body || "{}");
    if (!payload.id) return { statusCode: 400, body: "Missing id" };

    const update = {
      patientId: payload.patientId || "",
      name: payload.name || "",
      age: payload.age ?? null,
      ward: payload.ward || "",
      notes: payload.notes || "",
      priority: Number.isInteger(payload.priority) ? payload.priority : 0,
      updatedAt: new Date().toISOString(),
      updatedBy: user.username || user.id || "unknown",
    };

    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );
    const col = db.collection("patients");
    await col.updateOne({ _id: new ObjectId(payload.id) }, { $set: update });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error(err);
    const status =
      err.code === "NO_AUTH" || err.code === "INVALID_TOKEN" ? 401 : 500;
    return { statusCode: status, body: String(err.message) };
  }
};
