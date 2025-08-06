const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config(); // to load .env variables

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Get all hospitals
app.get("/api/hospitals/status", async (req, res) => {
  const { data, error } = await supabase.from("hospitals").select("*");
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Update hospital wait time
app.post("/api/hospitals/waittime", async (req, res) => {
  const { hospital_id, wait_time_minutes } = req.body;
  if (wait_time_minutes < 0)
    return res.status(400).json({ error: "Wait time must be >= 0" });

  const { data, error } = await supabase
    .from("hospitals")
    .update({
      wait_time_minutes,
    })
    .eq("id", hospital_id);

  if (error) return res.status(500).json({ error });
  res.json({ success: true, data });
});

// Get all patients
app.get("/api/patients", async (req, res) => {
  const { data, error } = await supabase.from("patients").select("*");
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Create (admit) patient
app.post("/api/patients/create", async (req, res) => {
  const { name, age, condition, hospital_id } = req.body;

  // Increment used beds, prevent overbooking (silent fail if no beds)
  await supabase.rpc("increment_beds", { hospital_id_input: hospital_id });

  const { data, error } = await supabase.from("patients").insert({
    name,
    age,
    condition,
    hospital_id,
    discharged: false,
    admitted_at: new Date(),
  });

  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Discharge patient
app.post("/api/patients/discharge", async (req, res) => {
  const { patient_id } = req.body;
  const { data, error } = await supabase
    .from("patients")
    .update({ discharged: true })
    .eq("id", patient_id);
  if (error) return res.status(500).json({ error });

  // Decrement used beds
  const patient = data[0];
  await supabase.rpc("decrement_beds", {
    hospital_id_input: patient.hospital_id,
  });

  res.json({ success: true });
});

// Get patient details + logs
app.get("/api/patients/:id", async (req, res) => {
  const patient_id = req.params.id;

  const { data: patient, error: pErr } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patient_id)
    .single();

  if (pErr) return res.status(404).json({ error: "Patient not found" });

  const { data: logs, error: lErr } = await supabase
    .from("patient_logs")
    .select("*")
    .eq("patient_id", patient_id)
    .order("log_time", { ascending: false });

  if (lErr) return res.status(500).json({ error: lErr });

  res.json({ patient, logs });
});

// Add patient log entry
app.post("/api/patients/:id/logs", async (req, res) => {
  const patient_id = req.params.id;
  const { log_text } = req.body;
  if (!log_text || log_text.trim() === "")
    return res.status(400).json({ error: "Log text required" });

  const { data, error } = await supabase.from("patient_logs").insert({
    patient_id,
    log_text,
  });

  if (error) return res.status(500).json({ error });

  res.json({ success: true, data });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
