import { getStore } from "@netlify/blobs";

export async function handler(event) {
  const key = event.queryStringParameters.key;
  if (!key) return { statusCode: 400, body: "Missing key" };

  const store = getStore("patient-pdfs");
  const blob = await store.get(key, { type: "arrayBuffer" });

  if (!blob) return { statusCode: 404, body: "Not found" };

  const buffer = Buffer.from(blob);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
    },
    body: buffer.toString("base64"),
    isBase64Encoded: true,
  };
}
