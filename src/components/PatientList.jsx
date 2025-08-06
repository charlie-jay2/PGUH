import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const hospitalId = "67f5356c-5e15-4139-8b95-b9b9d8fdbf16"; // Filter patients by hospital

  useEffect(() => {
    fetch("/api/patients") // You'll need to create this endpoint or fetch all and filter
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((p) => p.hospital_id === hospitalId);
        setPatients(filtered);
      });
  }, [hospitalId]);

  return (
    <div className="container">
      <h2>Patients</h2>
      {patients.length === 0 && <p>No patients found.</p>}
      <ul>
        {patients.map((p) => (
          <li key={p.id}>
            <Link to={`/patients/${p.id}`}>
              {p.name} — {p.discharged ? "Discharged" : "Admitted"}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
