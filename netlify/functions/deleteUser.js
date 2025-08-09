const { connectToDatabase } = require("./_mongodb");
const { verifyTokenFromHeaders } = require("./_auth");
const { sendEmail } = require("./sendEmail");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

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

    const { username, email } = JSON.parse(event.body || "{}");
    if (!username || !email) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing username or email" }),
      };
    }

    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );

    const result = await db.collection("staff").deleteOne({ username });
    if (result.deletedCount === 0) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: `User '${username}' not found` }),
      };
    }

    // Send email notification about deletion (no password needed here)
    await sendEmail(email, username, "", "deleted");

    return {
      statusCode: 200,
      body: `User '${username}' deleted and notification email sent.`,
    };
  } catch (err) {
    console.error("deleteUser error:", err);
    return {
      statusCode: 500,
      body: err.message || "Internal Server Error",
    };
  }
};
