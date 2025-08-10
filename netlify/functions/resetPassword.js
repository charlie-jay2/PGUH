const { connectToDatabase } = require("./_mongodb");
const bcrypt = require("bcryptjs");

exports.handler = async (event) => {
  try {
    const { token, password } = JSON.parse(event.body || "{}");
    if (!token || !password) {
      return { statusCode: 400, body: "Missing token or password" };
    }

    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );

    const resetRecord = await db
      .collection("passwordResets")
      .findOne({ token });
    if (!resetRecord) {
      return { statusCode: 400, body: "Invalid or expired token" };
    }

    if (new Date() > new Date(resetRecord.expires)) {
      await db.collection("passwordResets").deleteOne({ token });
      return { statusCode: 400, body: "Token expired" };
    }

    const hash = await bcrypt.hash(password, 10);

    await db
      .collection("staff")
      .updateOne({ email: resetRecord.email }, { $set: { password: hash } });

    await db.collection("passwordResets").deleteOne({ token });

    return { statusCode: 200, body: "Password reset successfully" };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};
