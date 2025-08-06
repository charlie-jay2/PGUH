import React, { useState, useEffect } from "react";

export default function HospitalDashboard() {
  const hospitalId = "67f5356c-5e15-4139-8b95-b9b9d8fdbf16"; // Replace with your hospital UUID
  const [hospital, setHospital] = useState(null);
  const [waitTime, setWaitTime] = useState(0);

  useEffect(() => {
    fetch("/api/hospitals/status")
      .then((res) => res.json())
      .then((data) => {
        const hosp = data.find((h) => h.id === hospitalId);
        if (hosp) {
          setHospital(hosp);
          setWaitTime(hosp.wait_time_minutes);
        }
      });
  }, [hospitalId]);

  const saveWaitTime = () => {
    fetch("/api/hospitals/waittime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hospital_id: hospitalId,
        wait_time_minutes: waitTime,
      }),
    })
      .then((res) => res.json())
      .then(() => alert("Wait time updated!"))
      .catch(() => alert("Failed to update wait time"));
  };

  if (!hospital)
    return <div className="container">Loading hospital info...</div>;

  return (
    <div className="container">
      <h2>Hospital Dashboard</h2>
      <p>
        <strong>Name:</strong> {hospital.name}
      </p>
      <p>
        <strong>Location:</strong> {hospital.location}
      </p>
      <p>
        <strong>Total Beds:</strong> {hospital.total_beds}
      </p>
      <p>
        <strong>Beds Occupied:</strong> {hospital.used_beds}
      </p>
      <p>
        <strong>Staff Count:</strong> {hospital.staff_count}
      </p>

      <h3>Edit Current Wait Time (minutes)</h3>
      <input
        type="number"
        min={0}
        value={waitTime}
        onChange={(e) => setWaitTime(Number(e.target.value))}
      />
      <button onClick={saveWaitTime}>Save Wait Time</button>
    </div>
  );
}
