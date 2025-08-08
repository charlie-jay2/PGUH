require("dotenv").config();

const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

async function registerStaff(username, password, role = "admin") {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  if (!uri || !dbName) {
    console.error("Please set MONGODB_URI and DB_NAME environment variables");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const staffCol = db.collection("staff");

    const existing = await staffCol.findOne({ username });
    if (existing) {
      console.log(`User "${username}" already exists.`);
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    const res = await staffCol.insertOne({
      username,
      password: hashed,
      role,
      createdAt: new Date(),
    });

    console.log(`Staff user "${username}" created with id: ${res.insertedId}`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

// Defaults to admin/admin if no args given
const [, , username = "KBlair", password = "Catto"] = process.argv;

registerStaff(username, password);
