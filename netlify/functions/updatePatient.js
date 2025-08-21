// updatePatient.js
const { connectToDatabase } = require("./_mongodb");
const { ObjectId } = require("mongodb");
const { verifyTokenFromHeaders } = require("./_auth");
const fetch = require("node-fetch"); // netlify has node-fetch v2 available

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

    // Update database
    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );
    const col = db.collection("patients");
    await col.updateOne({ _id: new ObjectId(payload.id) }, { $set: update });

    // Send log to Discord
    if (process.env.DISCORD_WEBHOOK_URL) {
      const message = {
        username: "Patient Logger",
        embeds: [
          {
            title: "📝 Patient Record Updated",
            color: 0x1d5fad, // NHS blue-ish
            fields: [
              {
                name: "Patient ID",
                value: update.patientId || "N/A",
                inline: true,
              },
              { name: "Name", value: update.name || "N/A", inline: true },
              {
                name: "Age",
                value: update.age?.toString() || "N/A",
                inline: true,
              },
              { name: "Ward", value: update.ward || "N/A", inline: true },
              {
                name: "Priority",
                value: update.priority.toString(),
                inline: true,
              },
              { name: "Updated By", value: update.updatedBy, inline: true },
            ],
            footer: { text: `Updated at ${update.updatedAt}` },
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
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error(err);
    const status =
      err.code === "NO_AUTH" || err.code === "INVALID_TOKEN" ? 401 : 500;
    return { statusCode: status, body: String(err.message) };
  }
};
