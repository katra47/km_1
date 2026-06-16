import { useState } from "react";
import { preguntarGemini } from "./geminiService";

export default function Ia() {
  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const consultarIA = async () => {
    try {
      setError("");
      setRespuesta("");
      setCargando(true);

      const texto = await preguntarGemini(pregunta);
      setRespuesta(texto);
    } catch (e) {
      console.error("ERROR IA:", e);
      setError(e.message || "Error al consultar la información");
    } finally {
      setCargando(false);
    }
  };

  const limpiar = () => {
    setPregunta("");
    setRespuesta("");
    setError("");
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="container">

        {/* ENCABEZADO */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <h2 className="fw-bold mb-1">🤖 Consulta Inteligente</h2>
                <p className="text-muted mb-0">
                  Consulta kilometraje, regiones, supervisores y consumo estimado.
                </p>
              </div>

              <span className="badge bg-success fs-6 px-3 py-2">
                Solo lectura
              </span>
            </div>
          </div>
        </div>

        {/* PANEL PRINCIPAL */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">

            <h5 className="fw-bold mb-3">Escribe tu consulta</h5>

            <textarea
              className="form-control mb-3"
              rows="5"
              placeholder="Ejemplo: ¿Cuánta gasolina consumió la placa ********* este mes?"
              value={pregunta}
              disabled={cargando}
              onChange={(e) => setPregunta(e.target.value)}
            />

            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-primary px-4 d-flex align-items-center gap-2"
                onClick={consultarIA}
                disabled={cargando || !pregunta.trim()}
              >
                {cargando && (
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                )}

                {cargando ? "Analizando..." : "Consultar"}
              </button>

              <button
                className="btn btn-outline-secondary"
                onClick={limpiar}
                disabled={cargando}
              >
                Limpiar
              </button>
            </div>

            {/* ANIMACIÓN DE CARGA */}
            {cargando && (
              <div className="alert alert-primary mt-4 mb-0">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                  >
                    <span className="visually-hidden">Cargando...</span>
                  </div>

                  <div>
                    <strong>Analizando información...</strong>
                    <div className="small text-muted">
                      Leyendo datos de Firebase y procesando la consulta.
                    </div>
                  </div>
                </div>

                <div className="progress">
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>
            )}

            {/* ERROR */}
            {error && !cargando && (
              <div className="alert alert-danger mt-4 mb-0">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* RESULTADO */}
            {respuesta && !cargando && (
              <div className="mt-4">
                <h6 className="fw-bold">Resultado</h6>

                <div
                  className="alert alert-info mb-0"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {respuesta}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}