const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let client;

  try {
    const { shiftId } = JSON.parse(event.body);

    if (!shiftId) {
      return { statusCode: 400, body: "Missing shiftId" };
    }

    client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    const result = await db.collection("shifts").deleteOne({
      _id: new ObjectId(shiftId),
    });

    if (result.deletedCount === 0) {
      return { statusCode: 404, body: "Shift not found" };
    }

    return { statusCode: 200, body: "Shift deleted" };
  } catch (err) {
    console.error("Error in deleteShift:", err);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  } finally {
    if (client) {
      await client.close();
    }
  }
};
