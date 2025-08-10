const { connectToDatabase } = require("./_mongodb");
const { sendEmail } = require("./sendEmail");
const crypto = require("crypto");

exports.handler = async (event) => {
  try {
    const { username } = JSON.parse(event.body || "{}");
    if (!username) {
      return { statusCode: 400, body: "Username is required" };
    }

    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );

    // Find user by username
    const user = await db.collection("staff").findOne({ username });
    if (!user) {
      return { statusCode: 404, body: "No user found with that username" };
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiry

    // Store token and username for later verification
    await db.collection("passwordResets").insertOne({
      token,
      username,
      email: user.email,
      expires,
    });

    const resetLink = `${process.env.SITE_URL}/reset.html?token=${token}`;
    await sendEmail(user.email, user.username, resetLink, "reset-link");

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Password reset email sent" }),
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};
