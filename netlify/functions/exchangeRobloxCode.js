// netlify/functions/exchangeRobloxCode.js
const fetch = require("node-fetch");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const code = body.code;
    const redirect_uri = body.redirect_uri;

    if (!code || !redirect_uri) {
      return { statusCode: 400, body: "Missing code or redirect_uri" };
    }

    const client_id = process.env.ROBLOX_CLIENT_ID;
    const client_secret = process.env.ROBLOX_CLIENT_SECRET;

    if (!client_id || !client_secret) {
      return {
        statusCode: 500,
        body: "Server not configured with Roblox credentials",
      };
    }

    // Step 1 — Exchange code for access token
    const tokenRes = await fetch("https://apis.roblox.com/oauth/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri,
        client_id,
        client_secret,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error("Token exchange failed:", tokenRes.status, text);
      return { statusCode: tokenRes.status, body: text };
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;

    if (!accessToken) {
      return { statusCode: 500, body: "No access token received" };
    }

    // Step 2 — Fetch user info from Roblox
    const userRes = await fetch("https://apis.roblox.com/oauth/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userRes.ok) {
      const text = await userRes.text();
      console.error("Userinfo failed:", userRes.status, text);
      return { statusCode: userRes.status, body: text };
    }

    const userJson = await userRes.json();

    // Step 3 — Return simplified user info + raw payload
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username:
          userJson.preferred_username ||
          userJson.username ||
          userJson.name ||
          null,
        id: userJson.sub || userJson.user_id || null,
        raw: userJson,
      }),
    };
  } catch (err) {
    console.error("exchangeRobloxCode error", err);
    return { statusCode: 500, body: "Server error: " + err.message };
  }
};
