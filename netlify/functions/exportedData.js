import { getStore } from "@netlify/blobs";

export default async function handler(event, context) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const { patientId, pdfBase64 } = JSON.parse(event.body || "{}");

    if (!patientId || !pdfBase64) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing patientId or PDF data" }),
      };
    }

    const store = getStore("discharge-logs"); // 🗂️ store name
    const fileName = `Patient(${patientId}).pdf`;

    // Save PDF as base64 string
    await store.set(fileName, pdfBase64);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "PDF saved", fileName }),
    };
  } catch (err) {
    console.error("Error saving PDF:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error: " + err.message }),
    };
  }
}
