import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HospitalDashboard from "./components/HospitalDashboard";
import PatientList from "./components/PatientList";
import PatientPage from "./components/PatientPage";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HospitalDashboard />} />
        <Route path="/patients" element={<PatientList />} />
        <Route path="/patients/:patientId" element={<PatientDetailWrapper />} />
      </Routes>
    </Router>
  );
}

// Wrapper to extract patientId param
import { useParams } from "react-router-dom";
function PatientDetailWrapper() {
  const { patientId } = useParams();
  return <PatientPage patientId={patientId} />;
}

export default App;
