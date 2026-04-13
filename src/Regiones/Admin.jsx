import { useState } from "react";
import { db } from "../firebase";
import { ref, set, get } from "firebase/database";

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

  // 🚗 CREAR PLACA CON VALIDACIONES
  const crearPlaca = async () => {
    const placaUpper = placa.trim().toUpperCase();
    const supervisorLimpio = supervisor.trim();

    if (!supervisorLimpio || !placaUpper || !kmInicial || !kmServicio) {
      setError("Completa todos los campos");
      return;
    }

    const kmInicialNum = Number(kmInicial);
    const kmServicioNum = Number(kmServicio);

    // 🚫 VALIDACIÓN 1: km inicial no negativo
    if (kmInicialNum < 0) {
      setError("El km inicial no puede ser negativo");
      return;
    }

    // 🚫 VALIDACIÓN 2: servicio mayor que inicial
    if (kmServicioNum <= kmInicialNum) {
      setError("El km de servicio debe ser mayor al km inicial");
      return;
    }

    try {
      // 🔥 VALIDACIÓN CRÍTICA: EXISTE PLACA
      const placaRef = ref(db, `registros/${region}/${placaUpper}`);
      const snapshot = await get(placaRef);

      if (snapshot.exists()) {
        setError("La placa ya existe en esta región");
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

      // limpiar
      setSupervisor("");
      setPlaca("");
      setKmInicial("");
      setKmServicio("");
      setError("");

    } catch (err) {
      setError("Error al guardar en la base de datos");
    }
  };

  // 🔒 LOGIN
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

        {/* BOTÓN */}
        <button className="btn btn-success w-100" onClick={crearPlaca}>
          Crear Placa
        </button>
      </div>
    </div>
  );
}