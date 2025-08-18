import { getStore } from "@netlify/blobs";

export default async function handler(event, context) {
  try {
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const store = getStore("discharge-logs");

    // List all files stored in this Blob store
    const list = await store.list();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: list.blobs || [] }),
    };
  } catch (err) {
    console.error("Error fetching logs:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error: " + err.message }),
    };
  }
}
