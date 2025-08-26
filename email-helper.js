async function sendStaffEmail() {
  const email = prompt("Enter the recipient's email:");
  if (!email) {
    alert("❌ Cancelled — no email provided");
    return;
  }

  const username = prompt("Enter the username:");
  if (!username) {
    alert("❌ Cancelled — no username provided");
    return;
  }

  const confirmSuspend = confirm(
    `Do you want to send a "Suspended" email to ${email}?`
  );

  if (!confirmSuspend) {
    alert("❌ Cancelled — no email sent");
    return;
  }

  const res = await fetch("/.netlify/functions/sendEmail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: email,
      username,
      type: "suspended",
    }),
  });

  if (res.ok) {
    alert("✅ Suspended email sent successfully!");
  } else {
    const err = await res.text();
    alert("❌ Failed to send email: " + err);
  }
}
