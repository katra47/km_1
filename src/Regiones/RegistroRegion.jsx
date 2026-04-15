import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, set, onValue, push } from "firebase/database";

// 🔥 Normaliza regiones
const normalizarRegion = (region) => {
  const mapa = {
    cor: "Cor",
    nor: "Nor",
    pet: "Pet",
  };
  return mapa[region?.toLowerCase()] || region;
};

function RegistroRegion({ nombreRegion }) {
  const REGION = normalizarRegion(nombreRegion);

  const [registros, setRegistros] = useState([]);
  const [modo, setModo] = useState("");
  const [error, setError] = useState("");

  const [placaBuscar, setPlacaBuscar] = useState("");
  const [editor, setEditor] = useState("");
  const [kmDia, setKmDia] = useState("");
  const [nuevoServicio, setNuevoServicio] = useState("");

  const [busqueda, setBusqueda] = useState("");

  // 🚦 SEMÁFORO
  const getSemaforo = (restante) => {
    const r = Number(restante);

    if (r <= 500) return { color: "danger", texto: "URGENTE" };
    if (r <= 1000) return { color: "warning", texto: "PRÓXIMO" };
    return { color: "success", texto: "OK" };
  };

  const obtenerFecha = () => new Date().toISOString();

  // 🔄 TIEMPO REAL
  useEffect(() => {
    const referencia = ref(db, `registros/${REGION}`);

    const unsubscribe = onValue(referencia, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const lista = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setRegistros(lista);
      } else {
        setRegistros([]);
      }
    });

    return () => unsubscribe();
  }, [REGION]);

  // 🔍 BUSCAR PLACA
  const placaEncontrada = registros.find(
    (r) => r.placa === placaBuscar.trim().toUpperCase()
  );

  // 🔍 FILTRO BUSCADOR
  const registrosFiltrados = registros.filter((r) => {
    const text = busqueda.toLowerCase();

    return (
      r.placa?.toLowerCase().includes(text) ||
      r.supervisor?.toLowerCase().includes(text) ||
      r.editor?.toLowerCase().includes(text)
    );
  });

  // 🔥 ACTUALIZAR
  const actualizarPlaca = () => {
    const placa = placaBuscar.trim().toUpperCase();
    const editorLimpio = editor.trim();
    const kmDiaNum = Number(kmDia);

    if (!placa || !editorLimpio || !kmDia) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (isNaN(kmDiaNum) || kmDiaNum < 0) {
      setError("El km del día debe ser válido");
      return;
    }

    const existe = registros.find((r) => r.placa === placa);

    if (!existe) {
      setError("La placa no está registrada");
      return;
    }

    const kmActual = Number(existe.kmInicial);
    const kmServicioActual = Number(existe.kmServicio);

    if (kmDiaNum < kmActual) {
      setError("El km del día no puede ser menor al actual");
      return;
    }

    let kmServicioFinal = kmServicioActual;

    if (nuevoServicio) {
      const nuevoServicioNum = Number(nuevoServicio);

      if (isNaN(nuevoServicioNum) || nuevoServicioNum < 0) {
        setError("El km de servicio debe ser válido");
        return;
      }

      if (nuevoServicioNum < kmServicioActual) {
        setError("El km de servicio no puede ser menor al actual");
        return;
      }

      kmServicioFinal = nuevoServicioNum;
    }

    const restante = kmServicioFinal - kmDiaNum;

    const data = {
      supervisor: existe.supervisor,
      placa,
      editor: editorLimpio,
      kmInicial: kmDiaNum,
      kmServicio: kmServicioFinal,
      restante,
      fecha: obtenerFecha(),
    };

    set(ref(db, `registros/${REGION}/${placa}`), data);
    push(ref(db, `historial/${placa}`), data);

    setPlacaBuscar("");
    setEditor("");
    setKmDia("");
    setNuevoServicio("");
    setModo("");
    setError("");
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-lg p-4 rounded-4">

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold">Región {REGION}</h3>
          <span className="badge bg-dark px-3 py-2">Control de KM</span>
        </div>

        {/* BOTÓN */}
        <button
          className="btn btn-primary w-100 mb-4 rounded-3 fw-semibold shadow-sm"
          onClick={() => setModo("actualizar")}
        >
          Actualizar KM
        </button>

        {/* MODAL */}
        {modo && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center"
            onClick={() => setModo("")}
          >
            <div
              className="card p-4 rounded-4 shadow-lg"
              style={{ maxWidth: "400px", width: "100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="mb-3">Actualizar Placa</h4>

              {error && <div className="alert alert-danger">{error}</div>}

              <input
                className="form-control mb-3 rounded-3"
                placeholder="Placa"
                value={placaBuscar}
                onChange={(e) => setPlacaBuscar(e.target.value)}
              />

              {placaEncontrada && (
                <div className="alert alert-info">
                  Km actual: {placaEncontrada.kmInicial} <br />
                  Km servicio: {placaEncontrada.kmServicio}
                </div>
              )}

              <input
                className="form-control mb-3 rounded-3"
                placeholder="Ingrese su Nombre"
                value={editor}
                onChange={(e) => setEditor(e.target.value)}
              />

              <input
                className="form-control mb-3 rounded-3"
                type="number"
                placeholder="Km del día"
                value={kmDia}
                onChange={(e) => setKmDia(e.target.value)}
              />

              <input
                className="form-control mb-3 rounded-3"
                type="number"
                placeholder="Nuevo Km Servicio (opcional)"
                value={nuevoServicio}
                onChange={(e) => setNuevoServicio(e.target.value)}
              />

              <button
                className="btn btn-primary w-100 rounded-3 fw-semibold"
                onClick={actualizarPlaca}
                disabled={!placaEncontrada}
              >
                Actualizar
              </button>
            </div>
          </div>
        )}

        {/* BUSCADOR */}
        <input
          className="form-control mb-4 rounded-3 shadow-sm"
          placeholder="🔍 Buscar placa, supervisor o editor..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        {/* TABLA */}
        <div className="table-responsive">
          <table className="table table-hover align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th>Supervisor</th>
                <th>Placa</th>
                <th>Brigada</th>
                <th>Km Actual</th>
                <th>Km Servicio</th>
                <th>Restante</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {[...registrosFiltrados]
                .sort((a, b) => Number(a.restante) - Number(b.restante))
                .map((r, i) => {
                  const estado = getSemaforo(r.restante);

                  return (
                    <tr key={i}>
                      <td className="py-3">{r.supervisor}</td>
                      <td className="py-3 fw-semibold">{r.placa}</td>
                      <td className="py-3">{r.editor || "-"}</td>
                      <td className="py-3">{r.kmInicial}</td>
                      <td className="py-3">{r.kmServicio}</td>
                      <td className="py-3 fw-bold">{r.restante}</td>
                      <td className="py-3">
                        <span className={`badge bg-${estado.color} px-3 py-2`}>
                          {estado.texto}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default RegistroRegion;