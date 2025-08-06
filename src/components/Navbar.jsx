import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header>
      <nav>
        <Link to="/">Prince George University Hospital</Link>
        <Link to="/patients">Patients</Link>
      </nav>
    </header>
  );
}
