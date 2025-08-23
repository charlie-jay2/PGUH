const { connectToDatabase } = require("./_mongodb");
const { ObjectId } = require("mongodb");

exports.handler = async (event) => {
  try {
    const { db } = await connectToDatabase();
    const { username, text } = JSON.parse(event.body);

    const comment = { _id: new ObjectId(), text, date: new Date() };

    await db
      .collection("users")
      .updateOne({ username }, { $push: { comments: comment } });

    return { statusCode: 200, body: "Comment added" };
  } catch (err) {
    return { statusCode: 500, body: "Error: " + err.message };
  }
};
