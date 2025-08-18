// netlify/functions/getExportedData.js
import { blob } from "@netlify/blobs";

export async function handler() {
  try {
    const store = blob();
    const metaKey = "exported_logs.json";
    let logs = [];

    try {
      logs = await store.get(metaKey, { type: "json" });
    } catch (err) {
      logs = [];
    }

    return {
      statusCode: 200,
      body: JSON.stringify(logs),
    };
  } catch (err) {
    return { statusCode: 500, body: "Server error: " + err.message };
  }
}
