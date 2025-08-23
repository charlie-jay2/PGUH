const { MongoClient } = require("mongodb");

const cached =
  global._mongo_cached || (global._mongo_cached = { client: null, db: null });

async function connectToDatabase(uri, dbName) {
  if (cached.db) return cached.db;
  if (!uri || !dbName) throw new Error("Missing DB config");
  const client = new MongoClient(uri);

  await client.connect();
  const db = client.db(dbName);
  cached.client = client;
  cached.db = db;
  return db;
}

module.exports = { connectToDatabase };
