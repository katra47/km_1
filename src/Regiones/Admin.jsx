import { useState } from "react";
import {
  verificarPassword,
  crearPlacaDB,
  descargarExcelDB,
  obtenerHistorialPlaca,
  eliminarPlacaDB
} from "./Admin";

export default function Admin() {

  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const [region, setRegion] = useState("Cor");
  const [supervisor, setSupervisor] = useState("");
  const [placa, setPlaca] = useState("");
  const [kmInicial, setKmInicial] = useState("");
  const [kmServicio, setKmServicio] = useState("");

  const [buscar, setBuscar] = useState("");
  const [historial, setHistorial] = useState([]);

  const [placaEliminar, setPlacaEliminar] = useState("");

  // 🔐 LOGIN
  const login = () => {
    if (verificarPassword(pass)) {
      setAuth(true);
      setError("");
    } else {
      setError("Contraseña incorrecta");
    }
  };

  // 🚗 CREAR
  const crear = async () => {
    try {
      await crearPlacaDB({ region, supervisor, placa, kmInicial, kmServicio });
      alert("Creado correctamente");

      setSupervisor("");
      setPlaca("");
      setKmInicial("");
      setKmServicio("");

    } catch (e) {
      setError(e.message);
    }
  };

  // 🗑️ ELIMINAR
  const eliminar = async () => {
    const placaUpper = placaEliminar.trim().toUpperCase();

    if (!placaUpper) {
      setError("Ingrese una placa");
      return;
    }

    const confirmar = window.confirm(
      `¿Estás seguro que deseas eliminar toda la información de la placa "${placaUpper}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      await eliminarPlacaDB(placaUpper);
      alert(`La placa "${placaUpper}" fue eliminada correctamente`);

      setPlacaEliminar("");
      setHistorial([]);
    } catch (e) {
      setError(e.message);
    }
  };

  // 🔍 HISTORIAL
  const verHistorial = async () => {
    try {
      const data = await obtenerHistorialPlaca(buscar);
      setHistorial(data);
    } catch (e) {
      setError(e.message);
    }
  };

  // 🔐 LOGIN UI
  if (!auth) {
    return (
      <div className="container vh-100 d-flex align-items-center justify-content-center">
        <div className="card shadow-lg p-4" style={{ width: "350px" }}>
          <h4 className="text-center mb-3">🔒 Acceso Admin</h4>

          {error && <div className="alert alert-danger">{error}</div>}

          <input
            type="password"
            className="form-control mb-3"
            placeholder="Contraseña"
            onChange={e => setPass(e.target.value)}
          />

          <button className="btn btn-dark w-100" onClick={login}>
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">

      {/* 🧾 FORMULARIO */}
      <div className="card shadow-sm p-4 mb-4">
        <h4 className="mb-4 text-center">Panel Administrativo</h4>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3">
          <div className="col-md-2">
            <select className="form-select" value={region} onChange={e => setRegion(e.target.value)}>
              <option value="Cor">Cor</option>
              <option value="Nor">Nor</option>
              <option value="Pet">Pet</option>
            </select>
          </div>

          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Supervisor"
              value={supervisor}
              onChange={e => setSupervisor(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Placa"
              value={placa}
              onChange={e => setPlaca(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="Km Inicial"
              value={kmInicial}
              onChange={e => setKmInicial(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <input
              type="number"
              className="form-control"
              placeholder="Km Servicio"
              value={kmServicio}
              onChange={e => setKmServicio(e.target.value)}
            />
          </div>
        </div>

        <div className="d-flex gap-2 mt-4">
          <button className="btn btn-success w-100" onClick={crear}>
            Crear
          </button>

          <button className="btn btn-outline-dark w-100" onClick={descargarExcelDB}>
            Descargar Excel
          </button>
        </div>
      </div>

      {/* 🗑️ ELIMINAR */}
      <div className="card shadow-sm p-4 mb-4 border-danger">
        <h5 className="text-danger mb-3">Eliminar placa</h5>

        <div className="input-group">
          <input
            className="form-control"
            placeholder="Ingrese placa"
            value={placaEliminar}
            onChange={e => setPlacaEliminar(e.target.value)}
          />
          <button className="btn btn-danger" onClick={eliminar}>
            Eliminar
          </button>
        </div>

        <small className="text-danger mt-2">
          ⚠ Esta acción elimina todo el historial y no se puede deshacer
        </small>
      </div>

      {/* 🔍 HISTORIAL */}
      <div className="card shadow-sm p-4">
        <h5 className="mb-3">Buscar historial</h5>

        <div className="input-group mb-3">
          <input
            className="form-control"
            placeholder="Ingrese placa"
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
          />
          <button className="btn btn-primary" onClick={verHistorial}>
            Buscar
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-hover table-bordered align-middle">
            <thead className="table-dark text-center">
              <tr>
                <th>Supervisor</th>
                <th>Km</th>
                <th>Servicio</th>
                <th>Restante</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>

            <tbody className="text-center">
              {historial.map((h, i) => (
                <tr key={i}>
                  <td>{h.supervisor}</td>
                  <td>{h.kmInicial}</td>
                  <td>{h.kmServicio}</td>
                  <td>{h.restante}</td>
                  <td>
                    <span className={
                      h.estado === "URGENTE" ? "badge bg-danger" :
                      h.estado === "PRÓXIMO" ? "badge bg-warning text-dark" :
                      "badge bg-success"
                    }>
                      {h.estado}
                    </span>
                  </td>
                  <td>{new Date(h.fecha).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}