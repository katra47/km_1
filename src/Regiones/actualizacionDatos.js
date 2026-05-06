import { db } from "../firebase";
import { ref, set, push } from "firebase/database";

//
// 🕒 Fecha actual en formato ISO
//
export const obtenerFecha = () => {
  return new Date().toISOString();
};

//
// 🚦 Semáforo según km restante
//
export const getSemaforo = (restante) => {
  const r = Number(restante);

  if (r <= 500) return { color: "danger", texto: "URGENTE" };
  if (r <= 1000) return { color: "warning", texto: "PRÓXIMO" };
  return { color: "success", texto: "OK" };
};

//
// 🔍 Validaciones antes de actualizar
//
export const validarActualizacion = ({
  placa,
  editor,
  kmDia,
  existe,
  nuevoServicio,
}) => {
  if (!placa || !editor || kmDia === "") {
    return "Todos los campos son obligatorios";
  }

  const kmDiaNum = Number(kmDia);

  if (isNaN(kmDiaNum) || kmDiaNum < 0) {
    return "El km del día debe ser válido";
  }

  if (!existe) {
    return "La placa no está registrada";
  }

  const kmActual = Number(existe.kmInicial);
  const kmServicioActual = Number(existe.kmServicio);

  if (kmDiaNum < kmActual) {
    return "El km del día no puede ser menor al actual";
  }

  // ⚠️ alerta de salto sospechoso
  if (kmDiaNum - kmActual > 2000) {
    return "⚠️ El km ingresado es demasiado alto, revisa";
  }

  if (nuevoServicio) {
    const nuevoServicioNum = Number(nuevoServicio);

    if (isNaN(nuevoServicioNum) || nuevoServicioNum < 0) {
      return "El km de servicio debe ser válido";
    }

    if (nuevoServicioNum < kmServicioActual) {
      return "El km de servicio no puede ser menor al actual";
    }
  }

  return null; // todo correcto
};

//
// 🔥 Función principal para actualizar en Firebase
//
export const actualizarPlacaDB = ({
  REGION,
  existe,
  placa,
  editor,
  kmDia,
  nuevoServicio,
}) => {
  const kmDiaNum = Number(kmDia);
  const kmServicioActual = Number(existe.kmServicio);

  let kmServicioFinal = kmServicioActual;

  if (nuevoServicio) {
    kmServicioFinal = Number(nuevoServicio);
  }

  const restante = kmServicioFinal - kmDiaNum;

  const data = {
    supervisor: existe.supervisor,
    placa,
    editor,
    kmInicial: kmDiaNum,
    kmServicio: kmServicioFinal,
    restante,
    fecha: obtenerFecha(),
  };

  // 📌 Guardar registro actual
  set(ref(db, `registros/${REGION}/${placa}`), data);

  // 📌 Guardar historial
  push(ref(db, `historial/${placa}`), data);

  return data;
};
