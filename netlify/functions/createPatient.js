// createPatient.js
const { connectToDatabase } = require("./_mongodb");
const fetch = require("node-fetch");

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

    // Send log to Discord
    if (process.env.DISCORD_WEBHOOK_URL) {
      const message = {
        username: "Patient Logger",
        embeds: [
          {
            title: "🆕 New Patient Created",
            color: 0x1d5fad,
            fields: [
              {
                name: "Patient ID",
                value: record.patientId || "N/A",
                inline: true,
              },
              { name: "Name", value: record.name || "N/A", inline: true },
              {
                name: "Roblox Name",
                value: record.robloxName || "N/A",
                inline: true,
              },
              {
                name: "Age",
                value: record.age?.toString() || "N/A",
                inline: true,
              },
              { name: "Ward", value: record.ward || "N/A", inline: true },
              {
                name: "Priority",
                value: record.priority.toString(),
                inline: true,
              },
              {
                name: "Presenting Complaint",
                value: record.presentingComplaint || "N/A",
              },
              {
                name: "Nil By Mouth",
                value: record.nilByMouth || "N/A",
                inline: true,
              },
              { name: "Created By", value: record.createdBy, inline: true },
            ],
            footer: { text: `Created at ${record.createdAt}` },
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
      body: JSON.stringify({ ok: true, id: res.insertedId }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: String(err.message) };
  }
};
