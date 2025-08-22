import { getStore } from "@netlify/blobs";

export const config = {
  api: {
    bodyParser: false, // allow raw binary body
  },
};

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    // Netlify passes raw body as base64 when bodyParser: false
    const buffer = Buffer.from(event.body, "base64");

    const key = `patient-${Date.now()}.pdf`;
    const store = getStore("patient-pdfs", { consistency: "strong" });
    await store.set(key, buffer, { type: "application/pdf" });

    return {
      statusCode: 200,
      body: JSON.stringify({ key }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: "Upload failed: " + err.message,
    };
  }
}
