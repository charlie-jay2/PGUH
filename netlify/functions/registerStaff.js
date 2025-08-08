// registerStaff.js
const { connectToDatabase } = require('./_mongodb');
const bcrypt = require('bcryptjs');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  try {
    const body = JSON.parse(event.body || '{}');
    const { username, password, role } = body;
    if (!username || !password) return { statusCode: 400, body: 'Username and password required' };

    const db = await connectToDatabase(process.env.MONGODB_URI, process.env.DB_NAME);
    const staffCol = db.collection('staff');

    const existing = await staffCol.findOne({ username });
    if (existing) return { statusCode: 400, body: 'Username already exists' };

    const hashed = await bcrypt.hash(password, 10);
    const res = await staffCol.insertOne({ username, password: hashed, role: role || 'staff', createdAt: new Date() });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, id: res.insertedId })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: String(err.message) };
  }
};
