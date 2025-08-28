const { connectToDatabase } = require("./_mongodb");
const { verifyTokenFromHeaders } = require("./_auth");
const bcrypt = require("bcryptjs");

exports.handler = async (event) => {
  try {
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

    await db.collection("staff").insertOne({
      username,
      password: hash,
      role,
      email,
      suspended: false,
      createdAt: new Date(),
    });

    // 🔹 Call the sendEmail Netlify function
    const sendEmailRes = await fetch(
      `${
        process.env.URL || "http://localhost:8888"
      }/.netlify/functions/sendEmail`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          username,
          content: password,
          type: "account",
        }),
      }
    );

    if (!sendEmailRes.ok) {
      const errText = await sendEmailRes.text();
      console.error("Email error (createUser):", errText);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `User ${username} created (suspended=false) and email sent`,
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
