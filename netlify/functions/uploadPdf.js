import { getStore } from "@netlify/blobs";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false, // don’t let Netlify auto-parse
  },
};

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const form = formidable({ multiples: false });

    const parsed = await new Promise((resolve, reject) => {
      form.parse(
        {
          headers: event.headers,
          // Netlify passes body as base64
          // formidable wants a stream:
          // we create a fake IncomingMessage
          // with body turned into Buffer
          on: (name, fn) => {}, // ignore
        },
        (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        }
      );
    });

    const file = Object.values(parsed.files)[0];
    if (!file) {
      return { statusCode: 400, body: "No file found" };
    }

    const fs = await import("fs/promises");
    const buffer = await fs.readFile(file.filepath);

    const key = `patient-${Date.now()}.pdf`;
    const store = getStore("patient-pdfs", { consistency: "strong" });
    await store.set(key, buffer, { type: "application/pdf" });

    return {
      statusCode: 200,
      body: JSON.stringify({ key }),
    };
  } catch (err) {
    return { statusCode: 500, body: "Upload failed: " + err.message };
  }
}
