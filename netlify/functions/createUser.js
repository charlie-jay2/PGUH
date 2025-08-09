const { connectToDatabase } = require("./_mongodb");
const { verifyTokenFromHeaders } = require("./_auth");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("./sendEmail");

exports.handler = async (event) => {
  try {
    // Verify token & get user from headers
    let authUser;
    try {
      authUser = verifyTokenFromHeaders(event.headers);
    } catch (err) {
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Forbidden: " + err.message }),
      };
    }

    if (!authUser || authUser.role !== "admin") {
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Forbidden: insufficient permissions" }),
      };
    }

    const { username, password, role, email } = JSON.parse(event.body || "{}");
    if (!username || !password || !role || !email) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );

    // Check if user already exists
    const existing = await db.collection("staff").findOne({ username });
    if (existing) {
      return {
        statusCode: 409,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Username already exists" }),
      };
    }

    const hash = await bcrypt.hash(password, 10);

    await db
      .collection("staff")
      .insertOne({
        username,
        password: hash,
        role,
        email,
        createdAt: new Date(),
      });

    await sendEmail(email, username, password, "account");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `User ${username} created and email sent`,
      }),
    };
  } catch (err) {
    console.error("createUser error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || "Internal Server Error" }),
    };
  }
};
