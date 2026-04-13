import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "./firebase";
import { ref, onValue } from "firebase/database";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [hora, setHora] = useState(new Date());
  const [alertas, setAlertas] = useState([]);
  const [regionActiva, setRegionActiva] = useState("TODAS");

  const regiones = ["Cor", "Nor", "Pet"];

  // ⏰ RELOJ
  useEffect(() => {
    const intervalo = setInterval(() => {
      setHora(new Date());
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  // 🚦 SEMÁFORO
  const getSemaforo = (restante) => {
    restante = Number(restante);

    if (restante <= 0) return { color: "dark", texto: "VENCIDO" };
    if (restante <= 1000) return { color: "danger", texto: "URGENTE" };
    if (restante <= 3000) return { color: "warning", texto: "PRÓXIMO" };
    return { color: "success", texto: "OK" };
  };

  // 🔥 ALERTAS (solo URGENTES)
  useEffect(() => {
    const unsubscribes = [];

    regiones.forEach((region) => {
      const referencia = ref(db, `registros/${region}`);

      const unsubscribe = onValue(referencia, (snapshot) => {
        const data = snapshot.val();

        if (!data) return;

        setAlertas((prev) => {
          let otras = prev.filter((x) => x.region !== region);

          const lista = Object.values(data).map((item) => {
            const estado = getSemaforo(item.restante);

            return {
              ...item,
              region,
              estado,
            };
          });

          const todas = [...otras, ...lista];

          return todas.filter((x) => x.estado.color === "danger");
        });
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((u) => u && u());
    };
  }, []);

  // 🔥 FILTRO POR REGIÓN
  const alertasFiltradas =
    regionActiva === "TODAS"
      ? alertas
      : alertas.filter((a) => a.region === regionActiva);

  // 🔢 CONTADORES
  const contarPorRegion = (region) =>
    alertas.filter((a) => a.region === region).length;

  // 📥 EXCEL
  const descargarExcel = () => {
    const historialRef = ref(db, "historial");

    onValue(
      historialRef,
      (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        let datos = [];

        Object.keys(data).forEach((placa) => {
          Object.values(data[placa]).forEach((r) => {
            datos.push({
              Placa: placa,
              Supervisor: r.supervisor,
              Editor: r.editor || "-",
              Km_Actual: r.kmInicial,
              Km_Servicio: r.kmServicio,
              Restante: r.restante,
              Estado: getSemaforo(r.restante).texto,
              Fecha: r.fecha,
            });
          });
        });

        const hoja = XLSX.utils.json_to_sheet(datos);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, "Historial");
        XLSX.writeFile(libro, "historial_completo_stcom.xlsx");
      },
      { onlyOnce: true }
    );
  };

  return (
    <div className="container text-center mt-5">

      {/* CARD */}
      <div className="card shadow-lg p-4">
        <h1>📊 Registro de Km STCOM</h1>
        <h5>🕒 {hora.toLocaleString()}</h5>

        <div className="d-flex justify-content-center gap-3 flex-wrap mt-3">
          <Link to="/cor"><button className="btn btn-primary">COR</button></Link>
          <Link to="/nor"><button className="btn btn-success">NOR</button></Link>
          <Link to="/pet"><button className="btn btn-warning">PET</button></Link>
        </div>

        <button
          className="btn btn-dark mt-4"
          onClick={descargarExcel}
        >
          📥 Excel
        </button>
      </div>

      {/* 🔥 BOTONES DE ALERTAS */}
      <div className="mt-5">

        <h4>🚨 Alertas por región</h4>

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
              {r} ({contarPorRegion(r)})
            </button>
          ))}

        </div>

        {/* TABLA */}
        {alertasFiltradas.length === 0 ? (
          <p className="text-muted mt-3">Sin alertas en esta región ✅</p>
        ) : (
          <div className="table-responsive mt-3">
            <table className="table table-bordered text-center">
              <thead className="table-dark">
                <tr>
                  <th>Región</th>
                  <th>Placa</th>
                  <th>Supervisor</th>
                  <th>Editor</th>
                  <th>Km Actual</th>
                  <th>Km Servicio</th>
                  <th>Restante</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {alertasFiltradas.map((r, i) => (
                  <tr key={i} className={`table-${r.estado.color}`}>
                    <td>{r.region}</td>
                    <td>{r.placa}</td>
                    <td>{r.supervisor}</td>
                    <td>{r.editor || "-"}</td>
                    <td>{r.kmInicial}</td>
                    <td>{r.kmServicio}</td>
                    <td>{r.restante}</td>
                    <td>
                      <span className={`badge bg-${r.estado.color}`}>
                        {r.estado.texto}
                      </span>
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