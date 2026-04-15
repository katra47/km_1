import { useState } from "react";
import { NavLink } from "react-router-dom";

export default function NavBar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  const linkClass = ({ isActive }) =>
    "nav-link px-3 py-2 rounded-3 fw-semibold d-flex align-items-center gap-1 " +
    (isActive
      ? "bg-primary text-white shadow-sm"
      : "text-light");

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-dark shadow-sm px-3 py-2">

      {/* 🔥 LOGO + NOMBRE */}
      <NavLink
        to="/"
        className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-5"
      >
        
        STCOM
      </NavLink>

      {/* BOTÓN MOBILE */}
      <button
        className="navbar-toggler"
        type="button"
        onClick={() => setOpen(!open)}
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      {/* MENÚ */}
      <div className={`collapse navbar-collapse ${open ? "show" : ""}`}>
        <ul className="navbar-nav ms-auto gap-2">

          <li className="nav-item">
            <NavLink to="/" className={linkClass} onClick={closeMenu}>
              Inicio
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/cor" className={linkClass} onClick={closeMenu}>
              Cor
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/nor" className={linkClass} onClick={closeMenu}>
              Nor
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/pet" className={linkClass} onClick={closeMenu}>
              Pet
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/admin" className={linkClass} onClick={closeMenu}>
              ⚙️ Admin
            </NavLink>
          </li>

        </ul>
      </div>
    </nav>
  );
}