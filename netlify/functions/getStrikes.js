const { connectToDatabase } = require("./_mongodb");

exports.handler = async (event) => {
  try {
    const { username } = event.queryStringParameters || {};
    if (!username) return { statusCode: 400, body: "Missing username" };

    const db = await connectToDatabase();

    const strikes = await db
      .collection("strikes")
      .find({ username })
      .sort({ date: -1 })
      .toArray();

    strikes.forEach((s) => (s._id = s._id.toString()));

    return {
      statusCode: 200,
      body: JSON.stringify(strikes),
    };
  } catch (err) {
    console.error("Error in getStrikes:", err);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
