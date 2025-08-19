const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

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
    const { token, username, password } = JSON.parse(event.body);

    if (!token || !username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Token, username, and password required",
        }),
      };
    }

    const db = await getDb();
    const users = db.collection("staff");
    const passwordResets = db.collection("passwordResets");

    // Lookup reset record
    const resetRecord = await passwordResets.findOne({ token });
    if (!resetRecord) {
      return { statusCode: 400, body: "Invalid or expired reset token." };
    }

    // Check expiry
    if (new Date() > new Date(resetRecord.expires)) {
      return { statusCode: 400, body: "Reset token has expired." };
    }

    // Make sure username matches the token owner
    if (resetRecord.username.toLowerCase() !== username.toLowerCase()) {
      return {
        statusCode: 400,
        body: "Username does not match reset request.",
      };
    }

    // Find the user
    const user = await users.findOne({
      username: { $regex: `^${username}$`, $options: "i" },
    });
    if (!user) {
      return { statusCode: 404, body: "User not found." };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await users.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    // Delete the reset record so it can’t be reused
    await passwordResets.deleteOne({ token });

    return {
      statusCode: 200,
      body: "Password has been reset successfully.",
    };
  } catch (error) {
    console.error("Complete reset error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
