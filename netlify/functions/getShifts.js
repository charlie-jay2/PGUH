const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

exports.handler = async function (event, context) {
  let client;

  try {
    client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    const shifts = await db.collection("shifts").find({}).toArray();

    return {
      statusCode: 200,
      body: JSON.stringify({ shifts }),
    };
  } catch (err) {
    console.error("Error in getShifts:", err);
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
