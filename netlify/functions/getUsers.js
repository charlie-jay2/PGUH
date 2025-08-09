const { connectToDatabase } = require("./_mongodb");

exports.handler = async (event) => {
  try {
    const db = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.DB_NAME
    );

    const users = await db
      .collection("staff")
      .find({}, { projection: { password: 0 } })
      .toArray();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users }),
    };
  } catch (err) {
    console.error("getUsers error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || "Internal Server Error" }),
    };
  }
};
