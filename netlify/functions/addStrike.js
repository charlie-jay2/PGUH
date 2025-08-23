const { connectToDatabase } = require("./_mongodb");
const { ObjectId } = require("mongodb");

exports.handler = async (event) => {
  try {
    const { db } = await connectToDatabase();
    const { username, reason } = JSON.parse(event.body);

    const strike = { _id: new ObjectId(), reason, date: new Date() };

    await db
      .collection("users")
      .updateOne({ username }, { $push: { strikes: strike } });

    return { statusCode: 200, body: "Strike added" };
  } catch (err) {
    return { statusCode: 500, body: "Error: " + err.message };
  }
};
