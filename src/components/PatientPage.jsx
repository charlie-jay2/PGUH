import React, { useState, useEffect } from "react";

export default function PatientPage({ patientId }) {
  const [patient, setPatient] = useState(null);
  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState("");

  useEffect(() => {
    fetch(`https://pguh.onrender.com/api/patients/${patientId}`)
      .then((res) => res.json())
      .then((data) => {
        setPatient(data.patient);
        setLogs(data.logs);
      });
  }, [patientId]);

  const addLog = () => {
    if (newLog.trim() === "") return alert("Log text required");

    fetch(`https://pguh.onrender.com/api/patients/${patientId}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ log_text: newLog }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLogs([data.data[0], ...logs]);
        setNewLog("");
      })
      .catch(() => alert("Failed to add log"));
  };

  if (!patient) return <div className="container">Loading patient info...</div>;

  return (
    <div className="container">
      <h2>Patient: {patient.name}</h2>
      <p>
        <strong>Age:</strong> {patient.age}
      </p>
      <p>
        <strong>Condition:</strong> {patient.condition}
      </p>
      <p>
        <strong>Admitted:</strong>{" "}
        {new Date(patient.admitted_at).toLocaleString()}
      </p>
      <p>
        <strong>Discharged:</strong> {patient.discharged ? "Yes" : "No"}
      </p>

      <h3>Logs</h3>
      <textarea
        rows={4}
        value={newLog}
        onChange={(e) => setNewLog(e.target.value)}
        placeholder="Add a log entry"
      />
      <button onClick={addLog}>Add Log</button>

      <ul>
        {logs.map((log) => (
          <li key={log.id}>
            [{new Date(log.log_time).toLocaleString()}] — {log.log_text}
          </li>
        ))}
      </ul>
    </div>
  );
}
