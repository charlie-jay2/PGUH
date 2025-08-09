const { MongoClient, ObjectId } = require("mongodb");
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
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

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

    const body = JSON.parse(event.body || "{}");
    if (!body.id) {
      return { statusCode: 400, body: "Missing id" };
    }

    const db = await connectDB();

    const result = await db
      .collection("applications")
      .deleteOne({ _id: new ObjectId(body.id) });

    if (result.deletedCount === 0) {
      return { statusCode: 404, body: "Application not found" };
    }

    return { statusCode: 200, body: "Deleted" };
  } catch (error) {
    console.error("deleteResponse error:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
