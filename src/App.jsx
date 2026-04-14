import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "./firebase";
import { ref, onValue } from "firebase/database";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [hora, setHora] = useState(new Date());
  const [alertas, setAlertas] = useState([]);
  const [regionActiva, setRegionActiva] = useState("TODAS");

  const regiones = ["Cor", "Nor", "Pet"];

  // reloj
  useEffect(() => {
    const intervalo = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  // 🚦 SOLO ROJO
  const getSemaforo = (restante) => {
  const r = Number(restante);

  // Solo devuelve estado si está estrictamente menor a 500
  if (r < 500) return { color: "danger", texto: "URGENTE" };
  return null; // todo lo demás se ignora
};

  // 🔥 CARGA
  useEffect(() => {
    const listeners = [];

    regiones.forEach((region) => {
      const rRef = ref(db, `registros/${region}`);

      const unsub = onValue(rRef, (snapshot) => {
        const data = snapshot.val();

        const lista = data
          ? Object.values(data)
              .map((item) => {
                const estado = getSemaforo(item.restante);

                if (!estado) return null; // ❌ descarta no rojos

                return {
                  ...item,
                  region,
                  estado,
                };
              })
              .filter(Boolean) // limpia null
          : [];

        setAlertas((prev) => {
          const sinRegion = prev.filter((x) => x.region !== region);
          return [...sinRegion, ...lista];
        });
      });

      listeners.push(unsub);
    });

    return () => listeners.forEach((u) => u && u());
  }, []);

  // filtro por región (ya solo hay rojos)
  const alertasFiltradas =
    regionActiva === "TODAS"
      ? alertas
      : alertas.filter((a) => a.region === regionActiva);

  return (
    <div className="container text-center mt-5">

      <div className="card shadow-lg p-4">
        <h1>📊 Registro de Km STCOM</h1>
        <h5>🕒 {hora.toLocaleString()}</h5>

        <div className="d-flex justify-content-center gap-3 flex-wrap mt-3">
          <Link to="/cor"><button className="btn btn-primary">COR</button></Link>
          <Link to="/nor"><button className="btn btn-success">NOR</button></Link>
          <Link to="/pet"><button className="btn btn-warning">PET</button></Link>
        </div>
      </div>

      {/* ALERTAS */}
      <div className="mt-5">
        <h4>🚨 SOLO URGENTES (ROJO)</h4>

        <div className="d-flex justify-content-center gap-3 flex-wrap mt-3">

          <button
            className={`btn ${regionActiva === "TODAS" ? "btn-dark" : "btn-outline-dark"}`}
            onClick={() => setRegionActiva("TODAS")}
          >
            TODAS ({alertas.length})
          </button>

          {regiones.map((r) => (
            <button
              key={r}
              className={`btn ${
                regionActiva === r ? "btn-danger" : "btn-outline-danger"
              }`}
              onClick={() => setRegionActiva(r)}
            >
              {r} ({alertas.filter(a => a.region === r).length})
            </button>
          ))}

        </div>

        {alertasFiltradas.length === 0 ? (
          <p className="text-muted mt-3">
            No hay unidades en rojo 🔴
          </p>
        ) : (
          <div className="table-responsive mt-3">
            <table className="table table-bordered text-center">
              <thead className="table-dark">
                <tr>
                  <th>Región</th>
                  <th>Placa</th>
                  <th>Supervisor</th>
                  <th>Km Actual</th>
                  <th>Km Servicio</th>
                  <th>Restante</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {alertasFiltradas.map((r, i) => (
                  <tr key={i} className="table-danger">
                    <td>{r.region}</td>
                    <td>{r.placa}</td>
                    <td>{r.supervisor}</td>
                    <td>{r.kmInicial}</td>
                    <td>{r.kmServicio}</td>
                    <td>{r.restante}</td>
                    <td>
                      <span className="badge bg-danger">URGENTE</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;