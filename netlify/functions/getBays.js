const { MongoClient, ObjectId } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = process.env.DB_NAME;

exports.handler = async (event) => {
  const ward = event.queryStringParameters?.ward || "A&E";
  try {
    await client.connect();
    const db = client.db(dbName);
    const bays = await db.collection("bays").find({ ward }).toArray();
    return { statusCode: 200, body: JSON.stringify(bays) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Error fetching bays" };
  }
};
