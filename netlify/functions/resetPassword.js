const { connectToDatabase } = require("./_mongodb");
const { verifyTokenFromHeaders } = require("./_auth");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("./sendEmail");

exports.handler = async (event) => {
  try {
    const authUser = verifyTokenFromHeaders(event.headers);
    if (!authUser || authUser.role !== "admin") {
      return { statusCode: 403, body: "Forbidden" };
    }

    const { username, password, email } = JSON.parse(event.body || "{}");
    if (!username || !password || !email) {
      return { statusCode: 400, body: "Missing fields" };
    }

    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );
    const hash = await bcrypt.hash(password, 10);

    await db
      .collection("staff")
      .updateOne({ username }, { $set: { password: hash } });

    await sendEmail(email, username, password, "reset");

    return { statusCode: 200, body: `Password reset for ${username}` };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};
