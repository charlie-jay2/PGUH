// updateHospitalData.js
const { connectToDatabase } = require('./_mongodb');
const { verifyTokenFromHeaders } = require('./_auth');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  try {
    const user = verifyTokenFromHeaders(event.headers);
    const payload = JSON.parse(event.body || '{}');

    const update = {
      waitTime: payload.waitTime ?? null,
      bedsAvailable: payload.bedsAvailable ?? null,
      totalBeds: payload.totalBeds ?? null,
      updatedAt: new Date().toISOString(),
      updatedBy: user.username || user.id || 'unknown'
    };

    const db = await connectToDatabase(process.env.MONGODB_URI, process.env.DB_NAME);
    const col = db.collection('hospital_metadata');

    await col.updateOne({ _id: 'main' }, { $set: update }, { upsert: true });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, updated: update })
    };
  } catch (err) {
    console.error(err);
    const status = err.code === 'NO_AUTH' || err.code === 'INVALID_TOKEN' ? 401 : 500;
    return { statusCode: status, body: String(err.message) };
  }
};
