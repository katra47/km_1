import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, set, onValue, push } from "firebase/database";

// 🔥 Normaliza las regiones permitidas
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

  const [supervisor, setSupervisor] = useState("");
  const [utNueva, setUtNueva] = useState("");
  const [kmInicialNuevo, setKmInicialNuevo] = useState("");
  const [kmServicioNuevo, setKmServicioNuevo] = useState("");

  const [utBuscar, setUtBuscar] = useState("");
  const [kmDia, setKmDia] = useState("");
  const [nuevoServicio, setNuevoServicio] = useState("");

  // 🚦 SEMÁFORO
  const getSemaforo = (restante) => {
    restante = Number(restante);
    if (restante <= 1000) return { color: "danger", texto: "URGENTE" };
    if (restante <= 3000) return { color: "warning", texto: "PRÓXIMO" };
    return { color: "success", texto: "OK" };
  };

  // 📅 FECHA
  const obtenerFecha = () => new Date().toISOString();

  // 🔄 TIEMPO REAL
  useEffect(() => {
    const referencia = ref(db, `registros/${REGION}`);

    onValue(referencia, (snapshot) => {
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
  }, [REGION]);

  // 🔍 BUSCAR UT
  const utEncontrada = registros.find(
    (r) => r.ut === utBuscar.toUpperCase()
  );

  // 🟢 NUEVA UT
  const agregarUT = () => {
    if (!supervisor || !utNueva || !kmInicialNuevo || !kmServicioNuevo) {
      setError("Todos los campos son obligatorios");
      return;
    }

    const ut = utNueva.toUpperCase();

    const existe = registros.find((r) => r.ut === ut);
    if (existe) {
      setError("La UT ya existe");
      return;
    }

    const data = {
      supervisor,
      ut,
      kmInicial: Number(kmInicialNuevo),
      kmServicio: Number(kmServicioNuevo),
      restante: Number(kmServicioNuevo) - Number(kmInicialNuevo),
      fecha: obtenerFecha(),
    };

    set(ref(db, `registros/${REGION}/${ut}`), data);

    setSupervisor("");
    setUtNueva("");
    setKmInicialNuevo("");
    setKmServicioNuevo("");
    setModo("");
    setError("");
  };

  // 🔵 ACTUALIZAR + HISTORIAL
  const actualizarUT = () => {
    if (!utBuscar || !kmDia) {
      setError("Ingrese UT y Km del día");
      return;
    }

    const ut = utBuscar.toUpperCase();

    const existe = registros.find((r) => r.ut === ut);
    if (!existe) {
      setError("La UT no está registrada");
      return;
    }

    const kmServicioFinal = nuevoServicio
      ? Number(nuevoServicio)
      : existe.kmServicio;

    const restante = kmServicioFinal - Number(kmDia);

    const data = {
      supervisor: existe.supervisor,
      ut,
      kmInicial: Number(kmDia),
      kmServicio: kmServicioFinal,
      restante,
      fecha: obtenerFecha(),
    };

    set(ref(db, `registros/${REGION}/${ut}`), data);

    const historialRef = ref(db, `historial/${ut}`);
    push(historialRef, data);

    setUtBuscar("");
    setKmDia("");
    setNuevoServicio("");
    setModo("");
    setError("");
  };

  return (
    <div className="container mt-5">

      <h2 className="text-center mb-4">Región {REGION}</h2>

      <div className="d-flex flex-column flex-md-row gap-2 mb-4">
        <button className="btn btn-primary w-100" onClick={() => setModo("actualizar")}>
          Actualizar UT
        </button>

        <button className="btn btn-success w-100" onClick={() => setModo("nuevo")}>
          Nueva UT
        </button>
      </div>

      {/* MODAL */}
      {modo && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center"
          onClick={() => setModo("")}>

          <div className="card p-4 w-100"
            style={{ maxWidth: "400px" }}
            onClick={(e) => e.stopPropagation()}>

            <h4>{modo === "nuevo" ? "Nueva UT" : "Actualizar UT"}</h4>

            {error && <div className="alert alert-danger">{error}</div>}

            {modo === "nuevo" && (
              <>
                <input className="form-control mb-3" placeholder="Supervisor"
                  value={supervisor} onChange={(e) => setSupervisor(e.target.value)} />

                <input className="form-control mb-3" placeholder="UT"
                  value={utNueva} onChange={(e) => setUtNueva(e.target.value)} />

                <input className="form-control mb-3" type="number" placeholder="Km Inicial"
                  value={kmInicialNuevo} onChange={(e) => setKmInicialNuevo(e.target.value)} />

                <input className="form-control mb-3" type="number" placeholder="Km Servicio"
                  value={kmServicioNuevo} onChange={(e) => setKmServicioNuevo(e.target.value)} />

                <button className="btn btn-success w-100" onClick={agregarUT}>
                  Guardar
                </button>
              </>
            )}

            {modo === "actualizar" && (
              <>
                <input className="form-control mb-3" placeholder="UT"
                  value={utBuscar} onChange={(e) => setUtBuscar(e.target.value)} />

                {utEncontrada && (
                  <div className="alert alert-info">
                    Km servicio: {utEncontrada.kmServicio}
                  </div>
                )}

                <input className="form-control mb-3" type="number" placeholder="Km del día"
                  value={kmDia} onChange={(e) => setKmDia(e.target.value)} />

                <input className="form-control mb-3" type="number"
                  placeholder="Nuevo Km Servicio"
                  value={nuevoServicio} onChange={(e) => setNuevoServicio(e.target.value)} />

                <button className="btn btn-primary w-100" onClick={actualizarUT}>
                  Actualizar
                </button>
              </>
            )}

          </div>
        </div>
      )}

      {/* TABLA */}
      <div className="table-responsive">
        <table className="table table-striped text-center">
          <thead>
            <tr>
              <th>Supervisor</th>
              <th>UT</th>
              <th>Km Actual</th>
              <th>Km Servicio</th>
              <th>Restante</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {registros.map((r, i) => {
              const estado = getSemaforo(r.restante);

              return (
                <tr key={i} className={`table-${estado.color}`}>
                  <td>{r.supervisor}</td>
                  <td>{r.ut}</td>
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
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default RegistroRegion;