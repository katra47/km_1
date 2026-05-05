import { useState } from "react";
import {
  verificarPassword,
  crearPlacaDB,
  descargarExcelDB,
  obtenerHistorialPlaca,
  eliminarPlacaDB,
  actualizarSupervisorDB
} from "./Admin";

export default function Admin() {

  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState("");

  // 🔥 ERRORES SEPARADOS
  const [errorGeneral, setErrorGeneral] = useState("");
  const [errorHistorial, setErrorHistorial] = useState("");

  const [region, setRegion] = useState("Cor");
  const [supervisor, setSupervisor] = useState("");
  const [placa, setPlaca] = useState("");
  const [kmInicial, setKmInicial] = useState("");
  const [kmServicio, setKmServicio] = useState("");

  const [buscar, setBuscar] = useState("");
  const [historial, setHistorial] = useState([]);

  const [placaEliminar, setPlacaEliminar] = useState("");
  const [nuevoSupervisor, setNuevoSupervisor] = useState("");

  // 🔐 LOGIN
  const login = () => {
    if (verificarPassword(pass)) {
      setAuth(true);
      setErrorGeneral("");
    } else {
      setErrorGeneral("Contraseña incorrecta");
    }
  };

  // 🚗 CREAR
  const crear = async () => {
    try {
      setErrorGeneral("");
      await crearPlacaDB({ region, supervisor, placa, kmInicial, kmServicio });

      alert("Creado correctamente");

      setSupervisor("");
      setPlaca("");
      setKmInicial("");
      setKmServicio("");

    } catch (e) {
      setErrorGeneral(e.message);
    }
  };

  // ✏️ CAMBIAR SUPERVISOR
  const cambiarSupervisor = async () => {
    try {
      setErrorGeneral("");

      await actualizarSupervisorDB({
        region,
        placa,
        nuevoSupervisor
      });

      alert("Supervisor actualizado");

      setPlaca("");
      setNuevoSupervisor("");

    } catch (e) {
      setErrorGeneral(e.message);
    }
  };

  // 🗑️ ELIMINAR
  const eliminar = async () => {
    const placaUpper = placaEliminar.trim().toUpperCase();

    if (!placaUpper) {
      setErrorGeneral("Ingrese una placa");
      return;
    }

    const confirmar = window.confirm(
      `¿Eliminar placa "${placaUpper}"?\nEsta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      setErrorGeneral("");

      await eliminarPlacaDB(placaUpper);

      alert("Eliminado correctamente");

      setPlacaEliminar("");
      setHistorial([]);

    } catch (e) {
      setErrorGeneral(e.message);
    }
  };

  // 🔍 HISTORIAL
  const verHistorial = async () => {
    try {
      setErrorHistorial(""); // limpiar antes
      const data = await obtenerHistorialPlaca(buscar);

      setHistorial(data);

    } catch (e) {
      setHistorial([]);
      setErrorHistorial(e.message); // 👈 SOLO aquí
    }
  };

  // 🔐 LOGIN UI
  if (!auth) {
    return (
      <div className="container vh-100 d-flex align-items-center justify-content-center">
        <div className="card shadow p-4" style={{ width: "350px" }}>
          <h4 className="text-center mb-3">🔒 Acceso Admin</h4>

          {errorGeneral && (
            <div className="alert alert-danger">{errorGeneral}</div>
          )}

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
      <div className="card p-4 mb-4 shadow">
        <h4 className="text-center mb-3">Panel Admin</h4>

        {errorGeneral && (
          <div className="alert alert-danger">{errorGeneral}</div>
        )}

        <div className="row g-2">
          <div className="col-md-2">
            <select
              className="form-select"
              value={region}
              onChange={e => setRegion(e.target.value)}
            >
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

        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-success w-100" onClick={crear}>
            Crear
          </button>

          <button className="btn btn-dark w-100" onClick={descargarExcelDB}>
            Excel
          </button>
        </div>
      </div>

      {/* ✏️ CAMBIAR SUPERVISOR */}
      <div className="card p-4 mb-4 border-warning">
        <h5 className="text-warning">Cambiar Supervisor</h5>

        <div className="row g-2">
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Placa"
              value={placa}
              onChange={e => setPlaca(e.target.value)}
            />
          </div>

          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="Nuevo Supervisor"
              value={nuevoSupervisor}
              onChange={e => setNuevoSupervisor(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <button
              className="btn btn-warning w-100"
              onClick={cambiarSupervisor}
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* 🗑️ ELIMINAR */}
      <div className="card p-4 mb-4 border-danger">
        <h5 className="text-danger">Eliminar placa</h5>

        <div className="input-group">
          <input
            className="form-control"
            placeholder="Placa"
            value={placaEliminar}
            onChange={e => setPlacaEliminar(e.target.value)}
          />

          <button className="btn btn-danger" onClick={eliminar}>
            Eliminar
          </button>
        </div>
      </div>

      {/* 🔍 HISTORIAL */}
      <div className="card p-4 shadow">
        <h5>Historial</h5>

        <div className="input-group mb-3">
          <input
            className="form-control"
            placeholder="Buscar placa"
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
          />

          <button className="btn btn-primary" onClick={verHistorial}>
            Buscar
          </button>
        </div>

        {/* 🔥 ERROR SOLO AQUÍ */}
        {errorHistorial && (
          <div className="alert alert-warning">
            {errorHistorial}
          </div>
        )}

        <table className="table table-bordered text-center">
          <thead className="table-dark">
            <tr>
              <th>Supervisor</th>
              <th>Brigada</th>
              <th>Km</th>
              <th>Servicio</th>
              <th>Restante</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>

          <tbody>
            {historial.map((h, i) => (
              <tr key={i}>
                <td>{h.supervisor}</td>
                <td>{h.editor || "-"}</td>
                <td>{h.kmInicial}</td>
                <td>{h.kmServicio}</td>
                <td>{h.restante}</td>
                <td>{h.estado}</td>
                <td>{new Date(h.fecha).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}