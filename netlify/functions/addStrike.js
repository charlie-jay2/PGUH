const { connectToDatabase } = require("./_mongodb");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const { username, reason, comment } = payload;

    if (!username || !reason) {
      return { statusCode: 400, body: "Missing required fields" };
    }

    const db = await connectToDatabase();

    const strike = {
      username,
      reason,
      comment: comment || "",
      date: new Date(),
    };

    const result = await db.collection("strikes").insertOne(strike);

    return {
      statusCode: 201,
      body: JSON.stringify({ id: result.insertedId.toString(), ...strike }),
    };
  } catch (err) {
    console.error("Error in addStrike:", err);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
