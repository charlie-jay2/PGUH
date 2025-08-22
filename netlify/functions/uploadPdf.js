import { getStore } from "@netlify/blobs";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const boundary = event.headers["content-type"].split("boundary=")[1];
  const body = Buffer.from(event.body, "base64").toString();

  // crude parse for file
  const parts = body.split(boundary);
  const filePart = parts.find((p) => p.includes("application/pdf"));
  if (!filePart) return { statusCode: 400, body: "No PDF found" };

  const raw = filePart.split("\r\n\r\n")[1];
  const trimmed = raw.slice(0, raw.lastIndexOf("--") - 2);
  const buffer = Buffer.from(trimmed, "binary");

  const key = `patient-${Date.now()}.pdf`;

  const store = getStore("patient-pdfs", { consistency: "strong" });
  await store.set(key, buffer, { type: "application/pdf" });

  return {
    statusCode: 200,
    body: JSON.stringify({ key }),
  };
}
