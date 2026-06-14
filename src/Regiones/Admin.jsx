import { useState } from "react";
import {
  verificarPassword,
  crearPlacaDB,
  descargarExcelDB,
  obtenerHistorialPlaca,
  eliminarPlacaDB,
  actualizarSupervisorDB,
  corregirKilometrajeDB
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

  const [placaCorregir, setPlacaCorregir] = useState("");
  const [kmCorregido, setKmCorregido] = useState("");
  const [servicioCorregido, setServicioCorregido] = useState("");
  const [motivoCorreccion, setMotivoCorreccion] = useState("");

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

  // 🔧 CORREGIR KM DESDE ADMIN
const corregirKM = async () => {
  const placaUpper = placaCorregir.trim().toUpperCase();

  if (!placaUpper || kmCorregido === "") {
    setErrorGeneral("Ingrese placa y kilometraje corregido");
    return;
  }

  const confirmar = window.confirm(
    `¿Confirmar corrección administrativa?\n\nPlaca: ${placaUpper}\nNuevo KM actual: ${kmCorregido}\nKm servicio: ${
      servicioCorregido || "Sin cambios"
    }\n\nEsta acción quedará registrada en el historial.`
  );

  if (!confirmar) return;

  try {
    setErrorGeneral("");

    await corregirKilometrajeDB({
      region,
      placa: placaUpper,
      kmInicial: kmCorregido,
      kmServicio: servicioCorregido,
      motivo: motivoCorreccion,
    });

    alert("Kilometraje corregido correctamente");

    setPlacaCorregir("");
    setKmCorregido("");
    setServicioCorregido("");
    setMotivoCorreccion("");
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

        {/* 🔧 CORREGIR KILOMETRAJE */}
<div className="card p-4 mb-4 border-info">
  <h5 className="text-info">Corrección Administrativa de KM</h5>

  <p className="text-muted mb-3">
    Use esta opción solo cuando una brigada haya ingresado un kilometraje incorrecto.
    Esta corrección permite ingresar un KM menor al último registrado.
  </p>

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

    <div className="col-md-2">
      <input
        className="form-control"
        placeholder="Placa"
        value={placaCorregir}
        onChange={e => setPlacaCorregir(e.target.value)}
      />
    </div>

    <div className="col-md-2">
      <input
        type="number"
        className="form-control"
        placeholder="KM corregido"
        value={kmCorregido}
        onChange={e => setKmCorregido(e.target.value)}
      />
    </div>

    <div className="col-md-2">
      <input
        type="number"
        className="form-control"
        placeholder="Km Servicio opcional"
        value={servicioCorregido}
        onChange={e => setServicioCorregido(e.target.value)}
      />
    </div>

    <div className="col-md-3">
      <input
        className="form-control"
        placeholder="Motivo de corrección"
        value={motivoCorreccion}
        onChange={e => setMotivoCorreccion(e.target.value)}
      />
    </div>

    <div className="col-md-1">
      <button
        className="btn btn-info w-100"
        onClick={corregirKM}
      >
        Corregir
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