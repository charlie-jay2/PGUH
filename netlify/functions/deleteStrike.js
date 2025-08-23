const { connectToDatabase } = require("./_mongodb");
const { ObjectId } = require("mongodb");

exports.handler = async (event) => {
  try {
    const { db } = await connectToDatabase();
    const { username, strikeId } = JSON.parse(event.body);

    await db
      .collection("users")
      .updateOne(
        { username },
        { $pull: { strikes: { _id: new ObjectId(strikeId) } } }
      );

    return { statusCode: 200, body: "Strike removed" };
  } catch (err) {
    return { statusCode: 500, body: "Error: " + err.message };
  }
};
