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

  // 🚦 SEMÁFORO (ACTUALIZADO)
  const getSemaforo = (restante) => {
    const r = Number(restante);

    // 🔴 ROJO: -∞ a 500
    if (r <= 500) return { color: "danger", texto: "URGENTE" };

    // 🟡 AMARILLO: 501 a 1000
    if (r <= 1000) return { color: "warning", texto: "PRÓXIMO" };

    // 🟢 VERDE: > 1000
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

  // 🔥 ACTUALIZAR PLACA
  const actualizarPlaca = () => {
    const placa = placaBuscar.trim().toUpperCase();
    const editorLimpio = editor.trim();
    const kmDiaNum = Number(kmDia);

    if (!placa || !editorLimpio || !kmDia) {
      setError("Todos los campos son obligatorios");
      return;
    }

    const existe = registros.find((r) => r.placa === placa);

    if (!existe) {
      setError("La placa no está registrada");
      return;
    }

    const kmActual = Number(existe.kmInicial);

    if (kmDiaNum < kmActual) {
      setError("El km no puede ser menor al actual");
      return;
    }

    const kmServicioFinal = nuevoServicio
      ? Number(nuevoServicio)
      : existe.kmServicio;

    if (kmServicioFinal < kmDiaNum) {
      setError("El km de servicio no puede ser menor al actual");
      return;
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

    const historialRef = ref(db, `historial/${placa}`);
    push(historialRef, data);

    setPlacaBuscar("");
    setEditor("");
    setKmDia("");
    setNuevoServicio("");
    setModo("");
    setError("");
  };

  return (
    <div className="container mt-5">

      <h2 className="text-center mb-4">Región {REGION}</h2>

      {/* BOTÓN */}
      <button
        className="btn btn-primary w-100 mb-4"
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
            className="card p-4 w-100"
            style={{ maxWidth: "400px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4>Actualizar Placa</h4>

            {error && <div className="alert alert-danger">{error}</div>}

            <input
              className="form-control mb-3"
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
              className="form-control mb-3"
              placeholder="Ingrese su Nombre"
              value={editor}
              onChange={(e) => setEditor(e.target.value)}
            />

            <input
              className="form-control mb-3"
              type="number"
              placeholder="Km del día"
              value={kmDia}
              onChange={(e) => setKmDia(e.target.value)}
            />

            <input
              className="form-control mb-3"
              type="number"
              placeholder="Nuevo Km Servicio (opcional)"
              value={nuevoServicio}
              onChange={(e) => setNuevoServicio(e.target.value)}
            />

            <button
              className="btn btn-primary w-100"
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
        className="form-control mb-3"
        placeholder="🔍 Buscar placa, supervisor o editor..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {/* TABLA */}
      <div className="table-responsive">
        <table className="table table-striped text-center">
          <thead>
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
            {registrosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="7">No se encontraron resultados</td>
              </tr>
            ) : (
              registrosFiltrados.map((r, i) => {
                const estado = getSemaforo(r.restante);

                return (
                  <tr key={i} className={`table-${estado.color}`}>
                    <td>{r.supervisor}</td>
                    <td>{r.placa}</td>
                    <td>{r.editor || "-"}</td>
                    <td>{r.kmInicial}</td>
                    <td>{r.kmServicio}</td>
                    <td>{r.restante}</td>
                    <td>
                      <span className={`badge bg-${estado.color}`}>
                        {estado.texto}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default RegistroRegion;
