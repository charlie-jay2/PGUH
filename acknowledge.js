// acknowledge.js
// Terms of Usage acknowledgement notice

// Update this date whenever TOU.html changes
const termsLastUpdated = "24 August 2025";

(function () {
  // Check if this version has been acknowledged
  const acknowledged = localStorage.getItem("termsAcknowledged");

  if (acknowledged !== termsLastUpdated) {
    // Create notice box
    const notice = document.createElement("div");
    notice.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1d5fad;
        color: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        font-size: 14px;
        max-width: 320px;
        z-index: 9999;
      ">
        <strong>Policy Update</strong><br>
        Our <a href="TOU.html" style="color: #ffdd57; text-decoration: underline;">Terms of Usage Policy</a> 
        has been updated. Please review the changes to ensure you continue to abide by them.<br><br>
        <button id="dismissNotice" style="
          background: #ffdd57;
          color: #003b6f;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        ">Okay</button>
      </div>
    `;

    document.body.appendChild(notice);

    // Store acknowledgement when dismissed
    document.getElementById("dismissNotice").addEventListener("click", () => {
      localStorage.setItem("termsAcknowledged", termsLastUpdated);
      notice.remove();
    });
  }
})();
