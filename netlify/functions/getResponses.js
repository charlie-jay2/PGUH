const { MongoClient } = require("mongodb");
const jwt = require("jsonwebtoken");

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const secret = process.env.JWT_SECRET;

let client;

async function connectDB() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}

exports.handler = async function (event) {
  try {
    // Auth check
    const authHeader = event.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return { statusCode: 403, body: "Unauthorized" };
    }
    try {
      jwt.verify(token, secret);
    } catch {
      return { statusCode: 403, body: "Forbidden" };
    }

    const db = await connectDB();
    const applications = await db
      .collection("applications")
      .find({})
      .sort({ submittedAt: -1 })
      .toArray();

    return {
      statusCode: 200,
      body: JSON.stringify({ applications }),
    };
  } catch (error) {
    console.error("getResponses error:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
