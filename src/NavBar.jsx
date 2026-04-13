// src/NavBar.jsx
import { useState } from "react";
import { NavLink } from "react-router-dom";

export default function NavBar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  const linkClass = ({ isActive }) =>
    "nav-link px-3 rounded " +
    (isActive ? "bg-primary text-white" : "text-light");

  return (
    <nav className="navbar navbar-dark bg-dark shadow-sm px-3">

      {/* Logo */}
      <span className="navbar-brand fw-bold">
        📊 STCOM
      </span>

      {/* Botón móvil */}
      <button
        className="btn btn-outline-light d-md-none"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>

      {/* Links */}
      <div
        className={`w-100 d-md-flex flex-md-row flex-column align-items-md-center justify-content-end gap-2 mt-2 mt-md-0 ${
          open ? "d-flex" : "d-none d-md-flex"
        }`}
      >

        <NavLink to="/" className={linkClass} onClick={closeMenu}>
          Inicio
        </NavLink>

        <NavLink to="/cor" className={linkClass} onClick={closeMenu}>
          Cor
        </NavLink>

        <NavLink to="/nor" className={linkClass} onClick={closeMenu}>
          Nor
        </NavLink>

        <NavLink to="/pet" className={linkClass} onClick={closeMenu}>
          Pet
        </NavLink>

      </div>
    </nav>
  );
}