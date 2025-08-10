const crypto = require("crypto");
const { MongoClient, ObjectId } = require("mongodb");
const sendEmail = require("./sendEmail").sendEmail; // your email function

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const baseUrl =
  process.env.BASE_URL ||
  "https://princegeorgesuniversityhospital.netlify.app/";

let client;

async function getDb() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);
    const { username } = data;

    if (!username) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Username is required" }),
      };
    }

    const db = await getDb();
    const users = db.collection("staff");
    const passwordResets = db.collection("passwordResets");

    // Find user by username (case-insensitive)
    const user = await users.findOne({
      username: { $regex: `^${username}$`, $options: "i" },
    });

    if (!user) {
      // For security, don't reveal user not found
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "If that username exists, a reset email has been sent.",
        }),
      };
    }

    // Generate reset token (64 hex chars)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Save token info in passwordResets collection
    // Upsert so multiple resets won't duplicate
    await passwordResets.updateOne(
      { username: user.username },
      {
        $set: {
          token: resetToken,
          username: user.username,
          email: user.email,
          expires: resetExpires,
        },
      },
      { upsert: true }
    );

    // Construct reset link with full URL
    const resetLink = `${baseUrl}reset.html?token=${resetToken}`;

    // Send reset email
    await sendEmail(user.email, user.username, resetLink, "reset-link");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "If that username exists, a reset email has been sent.",
      }),
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
