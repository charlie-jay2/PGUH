const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let client;

  try {
    const { staffName, role, shiftStart, shiftEnd } = JSON.parse(event.body);

    if (!staffName || !role || !shiftStart || !shiftEnd) {
      return {
        statusCode: 400,
        body: "Missing required fields",
      };
    }

    client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    const result = await db.collection("shifts").insertOne({
      staffName,
      role,
      shiftStart: new Date(shiftStart),
      shiftEnd: new Date(shiftEnd),
      createdAt: new Date(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ id: result.insertedId }),
    };
  } catch (err) {
    console.error("Error in createShift:", err);
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
