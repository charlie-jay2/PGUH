// netlify/functions/exportedData.js
import { blob } from "@netlify/blobs";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const formData = await event.formData();
    const file = formData.get("file"); // Blob
    const patientId = formData.get("patientId");
    const exportedAt = formData.get("exportedAt");

    if (!file) {
      return { statusCode: 400, body: "No file uploaded" };
    }

    const filename = `Patient_${patientId}_${Date.now()}.pdf`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Save to Netlify Blob storage
    const store = blob();
    await store.set(filename, buffer, {
      contentType: "application/pdf",
    });

    // Save metadata
    const metaKey = "exported_logs.json";
    let logs = [];
    try {
      const existing = await store.get(metaKey, { type: "json" });
      logs = existing || [];
    } catch (err) {
      logs = [];
    }

    logs.push({ filename, patientId, exportedAt });

    await store.set(metaKey, JSON.stringify(logs), {
      contentType: "application/json",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, filename }),
    };
  } catch (err) {
    return { statusCode: 500, body: "Server error: " + err.message };
  }
}
