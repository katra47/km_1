import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "./firebase";
import { ref, onValue } from "firebase/database";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [hora, setHora] = useState(new Date());
  const [alertas, setAlertas] = useState([]);

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

  // 🔥 ALERTAS EN TIEMPO REAL (FIX IMPORTANTE)
  useEffect(() => {
    const unsubscribes = [];

    regiones.forEach((region) => {
      const referencia = ref(db, `registros/${region}`);

      const unsubscribe = onValue(referencia, (snapshot) => {
        const data = snapshot.val();

        let todasRegiones = [];

        regiones.forEach((r) => {
          const refRegion = ref(db, `registros/${r}`);

          onValue(refRegion, (snap) => {
            const d = snap.val();

            if (d) {
              const lista = Object.values(d).map((item) => {
                const estado = getSemaforo(item.restante);

                return {
                  ...item,
                  region: r,
                  estado,
                };
              });

              todasRegiones = [...todasRegiones, ...lista];

              const filtradas = todasRegiones.filter(
                (x) =>
                  x.estado.color === "danger" ||
                  x.estado.color === "warning"
              );

              filtradas.sort(
                (a, b) => new Date(b.fecha) - new Date(a.fecha)
              );

              setAlertas([...filtradas]);
            }
          });
        });
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((u) => u && u());
    };
  }, []);

  // 📥 EXCEL HISTORIAL COMPLETO
  const descargarExcel = () => {
    const historialRef = ref(db, "historial");

    onValue(
      historialRef,
      (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        let datos = [];

        Object.keys(data).forEach((ut) => {
          const registrosUT = data[ut];

          Object.values(registrosUT).forEach((r) => {
            datos.push({
              UT: ut,
              Supervisor: r.supervisor,
              Km_Actual: r.kmInicial,
              Km_Servicio: r.kmServicio,
              Restante: r.restante,
              Estado: getSemaforo(r.restante).texto,
              Fecha: r.fecha,
            });
          });
        });

        datos.sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));

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

      {/* CARD PRINCIPAL */}
      <div className="card shadow-lg p-4">

        <h1 className="mb-3">📊 Registro de Km STCOM</h1>

        <p className="text-muted">
          Sistema de control de kilometraje en tiempo real
        </p>

        <h5 className="mb-3">🕒 {hora.toLocaleString()}</h5>

        {/* BOTONES REGIONES */}
        <div className="d-flex justify-content-center gap-3">
          <Link to="/cor"><button className="btn btn-primary px-4">COR</button></Link>
          <Link to="/nor"><button className="btn btn-success px-4">NOR</button></Link>
          <Link to="/pet"><button className="btn btn-warning px-4">PET</button></Link>
        </div>

        {/* EXCEL */}
        <div className="d-flex justify-content-center mt-4">
          <button
            className="btn btn-dark px-5 shadow"
            onClick={descargarExcel}
          >
            📥 Descargar Historial Excel
          </button>
        </div>

      </div>

      {/* ALERTAS */}
      <div className="mt-5">
        <h4>⚠️ Unidades en alerta</h4>

        {alertas.length === 0 ? (
          <p className="text-muted">Todo está en buen estado ✅</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover text-center">
              <thead className="table-dark">
                <tr>
                  <th>Región</th>
                  <th>UT</th>
                  <th>Supervisor</th>
                  <th>Km Actual</th>
                  <th>Km Servicio</th>
                  <th>Restante</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {alertas.map((r, i) => (
                  <tr key={i} className={`table-${r.estado.color}`}>
                    <td>{r.region}</td>
                    <td>{r.ut}</td>
                    <td>{r.supervisor}</td>
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