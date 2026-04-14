import { useState } from "react";
import { db } from "../firebase";
import { ref, set, get, push } from "firebase/database";
import * as XLSX from "xlsx";

export default function Admin() {
  const [autorizado, setAutorizado] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [region, setRegion] = useState("Cor");
  const [supervisor, setSupervisor] = useState("");
  const [placa, setPlaca] = useState("");
  const [kmInicial, setKmInicial] = useState("");
  const [kmServicio, setKmServicio] = useState("");

  // 🔐 LOGIN
  const verificar = () => {
    if (password === "Stcomadmin26") {
      setAutorizado(true);
      setError("");
    } else {
      setError("Contraseña incorrecta");
    }
  };

  // 🚦 SEMÁFORO (para Excel)
  const getSemaforo = (restante) => {
    const r = Number(restante);

    if (r <= 500) return "URGENTE";
    if (r <= 1000) return "PRÓXIMO";
    return "OK";
  };

  // 🚗 CREAR PLACA
  const crearPlaca = async () => {
    const placaUpper = placa.trim().toUpperCase();
    const supervisorLimpio = supervisor.trim();

    if (!supervisorLimpio || !placaUpper || !kmInicial || !kmServicio) {
      setError("Completa todos los campos");
      return;
    }

    const kmInicialNum = Number(kmInicial);
    const kmServicioNum = Number(kmServicio);

    if (kmInicialNum < 0 || kmServicioNum < 0) {
      setError("Los kilómetros no pueden ser negativos");
      return;
    }

    if (kmServicioNum <= kmInicialNum) {
      setError("Km servicio debe ser mayor al inicial");
      return;
    }

    const placaRef = ref(db, `registros/${region}/${placaUpper}`);
    const snapshot = await get(placaRef);

    if (snapshot.exists()) {
      setError("La placa ya existe");
      return;
    }

    const data = {
      supervisor: supervisorLimpio,
      placa: placaUpper,
      kmInicial: kmInicialNum,
      kmServicio: kmServicioNum,
      restante: kmServicioNum - kmInicialNum,
      fecha: new Date().toISOString(),
    };

    await set(placaRef, data);

    setSupervisor("");
    setPlaca("");
    setKmInicial("");
    setKmServicio("");
    setError("");
  };

  // 📥 EXCEL (CORREGIDO: usa get, NO onValue)
  const descargarExcel = async () => {
    try {
      const historialRef = ref(db, "historial");
      const snapshot = await get(historialRef);

      if (!snapshot.exists()) {
        setError("No hay datos en historial");
        return;
      }

      const data = snapshot.val();
      let datos = [];

      Object.keys(data).forEach((placa) => {
        Object.values(data[placa]).forEach((r) => {
          datos.push({
            Placa: placa,
            Supervisor: r.supervisor || "-",
            Editor: r.editor || "-",
            Km_Actual: r.kmInicial || 0,
            Km_Servicio: r.kmServicio || 0,
            Restante: r.restante || 0,
            Estado: getSemaforo(r.restante),
            Fecha: r.fecha || "-",
          });
        });
      });

      const hoja = XLSX.utils.json_to_sheet(datos);
      const libro = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(libro, hoja, "Historial");

      XLSX.writeFile(libro, "historial_stcom.xlsx");
    } catch (err) {
      setError("Error al descargar Excel");
    }
  };

  // 🔒 LOGIN SCREEN
  if (!autorizado) {
    return (
      <div className="container mt-5 text-center">
        <div className="card p-4 shadow" style={{ maxWidth: "400px", margin: "auto" }}>
          <h4>🔒 Acceso Admin</h4>

          {error && <div className="alert alert-danger">{error}</div>}

          <input
            type="password"
            className="form-control mb-3"
            placeholder="Ingrese contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn btn-dark w-100" onClick={verificar}>
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  // 🧾 PANEL ADMIN
  return (
    <div className="container mt-5">
      <div className="card p-4 shadow">

        <h2 className="text-center mb-4">Panel Admin</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        {/* REGIÓN */}
        <select
          className="form-control mb-3"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="Cor">Cor</option>
          <option value="Nor">Nor</option>
          <option value="Pet">Pet</option>
        </select>

        {/* SUPERVISOR */}
        <input
          className="form-control mb-3"
          placeholder="Supervisor"
          value={supervisor}
          onChange={(e) => setSupervisor(e.target.value)}
        />

        {/* PLACA */}
        <input
          className="form-control mb-3"
          placeholder="Placa"
          value={placa}
          onChange={(e) => setPlaca(e.target.value)}
        />

        {/* KM */}
        <input
          className="form-control mb-3"
          type="number"
          min="0"
          placeholder="Km Inicial"
          value={kmInicial}
          onChange={(e) => setKmInicial(e.target.value)}
        />

        <input
          className="form-control mb-3"
          type="number"
          min="0"
          placeholder="Km Servicio"
          value={kmServicio}
          onChange={(e) => setKmServicio(e.target.value)}
        />

        {/* BOTONES */}
        <button className="btn btn-success w-100 mb-3" onClick={crearPlaca}>
          Crear Placa
        </button>

        <button className="btn btn-dark w-100" onClick={descargarExcel}>
          📥 Descargar Excel
        </button>

      </div>
    </div>
  );
}