import { getStore } from "@netlify/blobs";

export async function handler() {
  const store = getStore("patient-pdfs");
  const { blobs } = await store.list();

  return {
    statusCode: 200,
    body: JSON.stringify(blobs.map((b) => ({ key: b.key }))),
  };
}
