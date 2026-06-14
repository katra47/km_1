import { db } from "../firebase";
import { ref, set, get, push, remove } from "firebase/database";
import * as XLSX from "xlsx";


// 🔐 PASSWORD
export const verificarPassword = (password) => {
  return password === "Stcomadmin26";
};

// 🚦 SEMÁFORO
export const getSemaforo = (restante) => {
  const r = Number(restante);
  if (r <= 500) return "URGENTE";
  if (r <= 1000) return "PRÓXIMO";
  return "OK";
};

// 🧠 GUARDAR HISTORIAL
export const guardarHistorial = async ({
  placa,
  supervisor,
  editor,
  kmInicial,
  kmServicio,
  restante
}) => {
  await push(ref(db, `historial/${placa}`), {
    supervisor,
    editor: editor || "SISTEMA",
    kmInicial,
    kmServicio,
    restante,
    fecha: new Date().toISOString(),
  });
};

// 🚗 CREAR
export const crearPlacaDB = async ({
  region,
  supervisor,
  placa,
  kmInicial,
  kmServicio
}) => {

  const placaUpper = placa.trim().toUpperCase();

  if (!supervisor || !placaUpper || kmInicial === "" || kmServicio === "") {
    throw new Error("Completa todos los campos");
  }

  const kmI = Number(kmInicial);
  const kmS = Number(kmServicio);

  if (kmI > kmS) throw new Error("Km inválidos");

  const refPlaca = ref(db, `registros/${region}/${placaUpper}`);
  const snap = await get(refPlaca);

  if (snap.exists()) throw new Error("La placa ya existe");

  const data = {
    supervisor,
    placa: placaUpper,
    kmInicial: kmI,
    kmServicio: kmS,
    restante: kmS - kmI,
    fecha: new Date().toISOString(),
  };

  await set(refPlaca, data);

  await guardarHistorial({
    placa: placaUpper,
    supervisor,
    editor: "creación",
    kmInicial: kmI,
    kmServicio: kmS,
    restante: kmS - kmI
  });
};

// 🔧 CORREGIR KILOMETRAJE ACTUAL DESDE ADMIN
export const corregirKilometrajeDB = async ({
  region,
  placa,
  kmInicial,
  kmServicio,
  motivo
}) => {
  const placaUpper = placa.trim().toUpperCase();

  if (!region || !placaUpper || kmInicial === "") {
    throw new Error("Ingrese región, placa y kilometraje actual");
  }

  const kmI = Number(kmInicial);

  if (isNaN(kmI) || kmI < 0) {
    throw new Error("El kilometraje actual debe ser válido");
  }

  const refPlaca = ref(db, `registros/${region}/${placaUpper}`);
  const snap = await get(refPlaca);

  if (!snap.exists()) {
    throw new Error("La placa no existe en esta región");
  }

  const dataActual = snap.val();

  let kmServicioFinal = Number(dataActual.kmServicio);

  if (kmServicio !== "") {
    const kmS = Number(kmServicio);

    if (isNaN(kmS) || kmS < 0) {
      throw new Error("El kilometraje de servicio debe ser válido");
    }

    kmServicioFinal = kmS;
  }

  const restante = kmServicioFinal - kmI;

  const dataNueva = {
    ...dataActual,
    kmInicial: kmI,
    kmServicio: kmServicioFinal,
    restante,
    fecha: new Date().toISOString(),
  };

  await set(refPlaca, dataNueva);

  await push(ref(db, `historial/${placaUpper}`), {
    supervisor: dataActual.supervisor,
    editor: "ADMIN - CORRECCIÓN",
    kmInicial: kmI,
    kmServicio: kmServicioFinal,
    restante,
    motivo: motivo || "Corrección administrativa",
    fecha: new Date().toISOString(),
  });
};


// ✏️ CAMBIAR SUPERVISOR (NUEVO)
export const actualizarSupervisorDB = async ({
  region,
  placa,
  nuevoSupervisor
}) => {

  const placaUpper = placa.trim().toUpperCase();

  if (!placaUpper || !nuevoSupervisor) {
    throw new Error("Datos incompletos");
  }

  const refPlaca = ref(db, `registros/${region}/${placaUpper}`);
  const snap = await get(refPlaca);

  if (!snap.exists()) {
    throw new Error("La placa no existe");
  }

  const dataActual = snap.val();

  await set(refPlaca, {
    ...dataActual,
    supervisor: nuevoSupervisor,
    fecha: new Date().toISOString(),
  });
};

// 📥 EXCEL
export const descargarExcelDB = async () => {
  const snap = await get(ref(db, "historial"));

  if (!snap.exists()) throw new Error("Sin datos");

  let datos = [];

  Object.entries(snap.val()).forEach(([placa, regs]) => {
    Object.values(regs).forEach((r) => {
      datos.push({
        Placa: placa,
        Supervisor: r.supervisor,
        Brigada: r.editor,
        Km: r.kmInicial,
        Servicio: r.kmServicio,
        Restante: r.restante,
        Estado: getSemaforo(r.restante),
        Fecha: r.fecha,
      });
    });
  });

  const hoja = XLSX.utils.json_to_sheet(datos);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Historial");
  XLSX.writeFile(libro, "historial.xlsx");
};

// 🔍 HISTORIAL
export const obtenerHistorialPlaca = async (placa) => {

  const placaUpper = placa.trim().toUpperCase();

  if (!placaUpper) throw new Error("Ingrese una placa");

  const snap = await get(ref(db, `historial/${placaUpper}`));

  if (!snap.exists()) throw new Error("Sin historial");

  const lista = Object.values(snap.val()).map(r => ({
    ...r,
    estado: getSemaforo(r.restante)
  }));

  // ordenar por fecha DESC
  lista.sort((a, b) =>
    new Date(b.fecha || 0) - new Date(a.fecha || 0)
  );

  return lista;
};



// 🗑️ ELIMINAR
export const eliminarPlacaDB = async (placa) => {

  const placaUpper = placa.trim().toUpperCase();

  if (!placaUpper) throw new Error("Placa inválida");

  await remove(ref(db, `historial/${placaUpper}`));

  const regsSnap = await get(ref(db, "registros"));

  if (regsSnap.exists()) {
    const regiones = regsSnap.val();

    for (const region in regiones) {
      if (regiones[region][placaUpper]) {
        await remove(ref(db, `registros/${region}/${placaUpper}`));
        break;
      }
    }
  }
};