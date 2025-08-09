// createPatient.js
const { connectToDatabase } = require("./_mongodb");
const { verifyTokenFromHeaders } = require("./_auth");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method not allowed" };

  try {
    const user = verifyTokenFromHeaders(event.headers);
    const payload = JSON.parse(event.body || "{}");

    const record = {
      patientId: payload.patientId || "",
      name: payload.name || "",
      age: payload.age ?? null,
      ward: payload.ward || "",
      notes: payload.notes || "",
      priority: Number.isInteger(payload.priority) ? payload.priority : 0,
      createdBy: user.username || user.id || "unknown",
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
    const status =
      err.code === "NO_AUTH" || err.code === "INVALID_TOKEN" ? 401 : 500;
    return { statusCode: status, body: String(err.message) };
  }
};
