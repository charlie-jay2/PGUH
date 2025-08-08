// getPatients.js
const { connectToDatabase } = require('./_mongodb');
const { verifyTokenFromHeaders } = require('./_auth');

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method not allowed' };
  try {
    verifyTokenFromHeaders(event.headers);

    const db = await connectToDatabase(process.env.MONGODB_URI, process.env.DB_NAME);
    const col = db.collection('patients');

    const patients = await col.find({}).sort({ createdAt: -1 }).limit(1000).toArray();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patients })
    };
  } catch (err) {
    console.error(err);
    const status = err.code === 'NO_AUTH' || err.code === 'INVALID_TOKEN' ? 401 : 500;
    return { statusCode: status, body: String(err.message) };
  }
};
