// webhookSender.js
// Run with: node webhookSender.js

const readline = require("readline");
const axios = require("axios");

// 🔹 Replace with your actual Discord Webhook URL
const WEBHOOK_URL =
  "https://discord.com/api/webhooks/1410598769627762930/jvlWlCkMYLnVKrnM_dDyp5mzVXyJdN4uY5yiUDbkrQcXh3E2HW-f9YxN0-w9se5nDZMh";

// Default fallback image
const FALLBACK_IMAGE = "https://placehold.co/600x300.png";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function sendWebhook(postName, postLink, imageUrl) {
  try {
    console.log("\n🔎 Starting webhook process...");
    console.log("Raw Inputs:");
    console.log(" - Post Name:", postName);
    console.log(" - Post Link:", postLink);
    console.log(" - Image URL:", imageUrl);

    // Ensure link starts with http/https
    if (!/^https?:\/\//i.test(postLink)) {
      console.log("ℹ️ Post Link missing protocol, prepending https://");
      postLink = "https://" + postLink;
    }

    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      console.log("ℹ️ Image URL missing protocol, prepending https://");
      imageUrl = "https://" + imageUrl;
    }

    // If no image provided, fallback to default
    if (!imageUrl || imageUrl.trim() === "") {
      console.log("ℹ️ No image provided, using fallback:", FALLBACK_IMAGE);
      imageUrl = FALLBACK_IMAGE;
    }

    // Base embed object
    const embed = {
      title: postName,
      url: postLink,
      description:
        "**Newsroom Update**\n\nStay updated with the latest stories, updates, and insights from our Trust.",
      color: 0x1d5fad, // NHS blue styling
      footer: {
        text: "Hospital Trust Newsroom",
      },
      timestamp: new Date().toISOString(),
      image: { url: imageUrl }, // Always guaranteed now
    };

    const payload = {
      username: "https://pguh.uk/newsroom",
      embeds: [embed],
    };

    console.log("\n📦 Final Payload to be sent:");
    console.dir(payload, { depth: null });

    const res = await axios.post(WEBHOOK_URL, payload, {
      headers: { "Content-Type": "application/json" },
      validateStatus: () => true,
    });

    console.log("\n📡 Response from Discord:");
    console.log(" - Status:", res.status);
    console.log(" - Headers:", res.headers);
    console.log(" - Data:", res.data);

    if (res.status === 204) {
      console.log("✅ Webhook sent successfully!");
    } else {
      console.log("⚠️ Discord did not accept the payload. Check logs above.");
    }
  } catch (error) {
    if (error.response) {
      console.error("❌ Discord API Error:", error.response.data);
    } else {
      console.error("❌ General Error:", error.message);
    }
  } finally {
    rl.close();
  }
}

// Questions
rl.question("Enter Post Name: ", (postName) => {
  rl.question("Enter Post Link: ", (postLink) => {
    rl.question(
      "Enter Image URL (big picture under text, optional): ",
      (imageUrl) => {
        sendWebhook(postName, postLink, imageUrl.trim());
      }
    );
  });
});
