import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

import {
  getSemaforo,
  validarActualizacion,
  actualizarPlacaDB,
} from "./actualizacionDatos";

// 🔥 Normaliza regiones
const normalizarRegion = (region) => {
  const mapa = {
    cor: "Cor",
    nor: "Nor",
    pet: "Pet",
  };
  return mapa[region?.toLowerCase()] || region;
};

// 🕒 Formatear fecha
const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleString("es-GT");
};

function RegistroRegion({ nombreRegion }) {
  const REGION = normalizarRegion(nombreRegion);

  const [registros, setRegistros] = useState([]);
  const [modo, setModo] = useState("");
  const [error, setError] = useState("");
  const [confirmar, setConfirmar] = useState(false);

  const [placaBuscar, setPlacaBuscar] = useState("");
  const [editor, setEditor] = useState("");
  const [kmDia, setKmDia] = useState("");
  const [nuevoServicio, setNuevoServicio] = useState("");

  const [busqueda, setBusqueda] = useState("");

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

  // 🔥 PREPARAR ACTUALIZACIÓN
  const prepararActualizacion = () => {
    const placa = placaBuscar.trim().toUpperCase();
    const editorLimpio = editor.trim();

    const errorValidacion = validarActualizacion({
      placa,
      editor: editorLimpio,
      kmDia,
      existe: placaEncontrada,
      nuevoServicio,
    });

    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setError("");
    setConfirmar(true);
  };

  // 🔥 CONFIRMAR ACTUALIZACIÓN
  const confirmarActualizacion = () => {
    const placa = placaBuscar.trim().toUpperCase();
    const editorLimpio = editor.trim();

    actualizarPlacaDB({
      REGION,
      existe: placaEncontrada,
      placa,
      editor: editorLimpio,
      kmDia,
      nuevoServicio,
    });

    // limpiar
    setPlacaBuscar("");
    setEditor("");
    setKmDia("");
    setNuevoServicio("");
    setModo("");
    setConfirmar(false);
    setError("");
  };

  return (
    <div className="container-fluid p-4">
      <div>

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold">Región {REGION}</h3>
          <span className="badge bg-dark px-3 py-2">Control de KM</span>
        </div>

        {/* BOTÓN */}
        <button
          className="btn btn-primary w-100 mb-4"
          onClick={() => setModo("actualizar")}
        >
          Actualizar KM
        </button>

        {/* MODAL FORM */}
        {modo && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center"
            onClick={() => setModo("")}
          >
            <div
              className="card p-4"
              style={{ maxWidth: "400px", width: "100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="mb-3">Actualizar Placa</h4>

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
                onClick={prepararActualizacion}
                disabled={!placaEncontrada}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* MODAL CONFIRMACIÓN */}
        {confirmar && (
          <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center">
            <div className="card p-4" style={{ maxWidth: "400px", width: "100%" }}>
              <h5 className="text-danger">⚠️ Confirmar actualización</h5>

              <p><strong>Placa:</strong> {placaBuscar}</p>
              <p><strong>Editor:</strong> {editor}</p>
              <p><strong>Km actual ingresado:</strong> {kmDia}</p>

              {nuevoServicio ? (
                <>
                  <p className="text-warning">
                    <strong>⚠️ Nuevo Km de servicio:</strong> {nuevoServicio}
                  </p>

                  {placaEncontrada && (
                    <p className="text-warning">
                      <strong>Cambio:</strong> {placaEncontrada.kmServicio} → {nuevoServicio}
                    </p>
                  )}

                  <div className="alert alert-warning mt-2">
                    ⚠️ Estás modificando el Km de servicio. Verifica que sea correcto.
                  </div>
                </>
              ) : (
                <p className="text-muted">Km de servicio: sin cambios</p>
              )}

              <div className="d-flex gap-2 mt-3">
                <button
                  className="btn btn-secondary w-50"
                  onClick={() => setConfirmar(false)}
                >
                  Editar
                </button>

                <button
                  className="btn btn-danger w-50"
                  onClick={confirmarActualizacion}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BUSCADOR */}
        <input
          className="form-control mb-4"
          placeholder="🔍 Buscar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        {/* TABLA */}
        <div className="table-responsive">
          <table className="table table-hover text-center">
            <thead className="table-dark">
              <tr>
                <th>Supervisor</th>
                <th>Placa</th>
                <th>Brigada</th>
                <th>Km</th>
                <th>Servicio</th>
                <th>Restante</th>
                <th>Estado</th>
                <th>Actualización</th>
              </tr>
            </thead>

            <tbody>
              {[...registrosFiltrados]
                .sort((a, b) => Number(a.restante) - Number(b.restante))
                .map((r, i) => {
                  const estado = getSemaforo(r.restante);

                  return (
                    <tr key={i}>
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
                      <td>{formatearFecha(r.fecha)}</td>
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