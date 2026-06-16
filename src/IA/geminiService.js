import { db } from "../firebase";
import { ref, get } from "firebase/database";

// ⚠️ AJUSTA ESTOS VALORES SEGÚN DATOS REALES DE LA EMPRESA
const RENDIMIENTOS_KM_GALON = {
  P: 35, // Carros
  M: 80, // Motos
};

const TIPO_VEHICULO = {
  P: "Carro",
  M: "Moto",
};

const normalizar = (texto) => {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleString("es-GT");
};

const getEstado = (restante) => {
  const r = Number(restante);

  if (r <= 500) return "URGENTE";
  if (r <= 1000) return "PRÓXIMO";
  return "OK";
};

const obtenerPrefijo = (placa) => {
  return String(placa || "").trim().toUpperCase().charAt(0);
};

const obtenerTipo = (placa) => {
  const prefijo = obtenerPrefijo(placa);
  return TIPO_VEHICULO[prefijo] || "Desconocido";
};

const obtenerRendimiento = (placa) => {
  const prefijo = obtenerPrefijo(placa);
  return RENDIMIENTOS_KM_GALON[prefijo] || null;
};

const extraerPlaca = (pregunta) => {
  const texto = pregunta
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const coincidencias = texto.match(/\b[A-Z]{1,3}[0-9]{2,5}[A-Z]{1,4}\b/g);

  return coincidencias ? coincidencias[0] : null;
};

const extraerPrefijo = (pregunta) => {
  const texto = pregunta
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const match = texto.match(
    /(?:EMPIEZAN|INICIAN|COMIENZAN)\s+(?:POR|CON)\s+([A-Z])/
  );

  if (match) return match[1];

  if (texto.includes("CARROS")) return "P";
  if (texto.includes("MOTOS")) return "M";

  return null;
};

const detectarRegion = (pregunta) => {
  const texto = normalizar(pregunta);

  if (/\bcor\b/.test(texto)) return "Cor";
  if (/\bnor\b/.test(texto) || /\bnori\b/.test(texto) || /\bnorte\b/.test(texto)) return "Nor";
  if (/\bpet\b/.test(texto) || /\bpeten\b/.test(texto)) return "Pet";

  return null;
};

const extraerRendimientoManual = (pregunta) => {
  const texto = normalizar(pregunta);

  const match = texto.match(
    /(\d+(\.\d+)?)\s*(km|kms|kilometros)?\s*por\s*(galon|galones)/
  );

  return match ? Number(match[1]) : null;
};

const crearFecha = (textoFecha, finalDelDia = false) => {
  const partes = textoFecha.split(/[/-]/).map(Number);

  if (partes.length !== 3) return null;

  const dia = partes[0];
  const mes = partes[1] - 1;
  let anio = partes[2];

  if (anio < 100) anio += 2000;

  const fecha = new Date(anio, mes, dia);

  if (finalDelDia) {
    fecha.setHours(23, 59, 59, 999);
  } else {
    fecha.setHours(0, 0, 0, 0);
  }

  return fecha;
};

const detectarPeriodo = (pregunta) => {
  const texto = normalizar(pregunta);
  const hoy = new Date();

  const fechas = pregunta.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g);

  if (fechas && fechas.length >= 2) {
    return {
      tipo: "rango",
      etiqueta: `del ${fechas[0]} al ${fechas[1]}`,
      inicio: crearFecha(fechas[0]),
      fin: crearFecha(fechas[1], true),
    };
  }

  if (texto.includes("hoy")) {
    const inicio = new Date(hoy);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(hoy);
    fin.setHours(23, 59, 59, 999);

    return {
      tipo: "hoy",
      etiqueta: "hoy",
      inicio,
      fin,
    };
  }

  if (texto.includes("ayer")) {
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - 1);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(hoy);
    fin.setDate(hoy.getDate() - 1);
    fin.setHours(23, 59, 59, 999);

    return {
      tipo: "ayer",
      etiqueta: "ayer",
      inicio,
      fin,
    };
  }

  if (texto.includes("ultimos 7") || texto.includes("ultimos siete")) {
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - 7);
    inicio.setHours(0, 0, 0, 0);

    return {
      tipo: "ultimos_7_dias",
      etiqueta: "últimos 7 días",
      inicio,
      fin: hoy,
    };
  }

  if (texto.includes("semana")) {
    const inicio = new Date(hoy);
    const dia = hoy.getDay();
    const diferencia = dia === 0 ? 6 : dia - 1;

    inicio.setDate(hoy.getDate() - diferencia);
    inicio.setHours(0, 0, 0, 0);

    return {
      tipo: "semana",
      etiqueta: "esta semana",
      inicio,
      fin: hoy,
    };
  }

  if (texto.includes("mes")) {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    inicio.setHours(0, 0, 0, 0);

    return {
      tipo: "mes",
      etiqueta: "este mes",
      inicio,
      fin: hoy,
    };
  }

  return {
    tipo: "todo",
    etiqueta: "todo el historial",
    inicio: null,
    fin: null,
  };
};

const filtrarPorPeriodo = (historial, periodo) => {
  return historial.filter((registro) => {
    if (!registro.fecha) return false;

    const fecha = new Date(registro.fecha);

    if (periodo.inicio && fecha < periodo.inicio) return false;
    if (periodo.fin && fecha > periodo.fin) return false;

    return true;
  });
};

const calcularKm = (registros) => {
  const ordenados = registros
    .filter((r) => r.kmInicial !== undefined && r.fecha)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  if (ordenados.length < 2) return null;

  const primero = ordenados[0];
  const ultimo = ordenados[ordenados.length - 1];

  const kmInicial = Number(primero.kmInicial);
  const kmFinal = Number(ultimo.kmInicial);
  const kmRecorridos = kmFinal - kmInicial;

  const fechaInicial = new Date(primero.fecha);
  const fechaFinal = new Date(ultimo.fecha);

  const dias = Math.max(
    1,
    Math.ceil((fechaFinal - fechaInicial) / (1000 * 60 * 60 * 24))
  );

  return {
    kmInicial,
    kmFinal,
    kmRecorridos,
    fechaInicial: primero.fecha,
    fechaFinal: ultimo.fecha,
    totalRegistros: ordenados.length,
    promedioKmDia: kmRecorridos / dias,
  };
};

const leerRegistros = async () => {
  const snap = await get(ref(db, "registros"));

  if (!snap.exists()) return [];

  const data = snap.val();
  const lista = [];

  Object.entries(data).forEach(([region, placas]) => {
    Object.entries(placas || {}).forEach(([id, item]) => {
      const kmInicial = Number(item.kmInicial || 0);
      const kmServicio = Number(item.kmServicio || 0);
      const restante = Number(
        item.restante !== undefined ? item.restante : kmServicio - kmInicial
      );

      lista.push({
        id,
        region,
        supervisor: item.supervisor || "-",
        placa: item.placa || id,
        editor: item.editor || "-",
        kmInicial,
        kmServicio,
        restante,
        estado: getEstado(restante),
        fecha: item.fecha || null,
      });
    });
  });

  return lista;
};

const leerHistorialPlaca = async (placa) => {
  const snap = await get(ref(db, `historial/${placa}`));

  if (!snap.exists()) return [];

  return Object.values(snap.val());
};

const leerTodoHistorial = async () => {
  const snap = await get(ref(db, "historial"));

  if (!snap.exists()) return {};

  return snap.val();
};

const formatearRegistros = (registros, max = 15) => {
  if (registros.length === 0) {
    return "No encontré registros con esos filtros.";
  }

  const texto = registros
    .slice(0, max)
    .map((r, i) => {
      return `${i + 1}. ${r.placa} | Región: ${r.region} | Supervisor: ${r.supervisor} | Brigada: ${r.editor} | Km: ${r.kmInicial} | Servicio: ${r.kmServicio} | Restante: ${r.restante} | Estado: ${r.estado} | Actualización: ${formatearFecha(r.fecha)}`;
    })
    .join("\n");

  const extra =
    registros.length > max
      ? `\n\nMostrando ${max} de ${registros.length} registros encontrados.`
      : "";

  return texto + extra;
};

const responderKmYCombustiblePlaca = async ({
  pregunta,
  placa,
  pideCombustible,
}) => {
  const periodo = detectarPeriodo(pregunta);
  const historial = await leerHistorialPlaca(placa);

  if (historial.length === 0) {
    return `No encontré historial registrado para la placa ${placa}.`;
  }

  const registrosPeriodo = filtrarPorPeriodo(historial, periodo);

  if (registrosPeriodo.length < 2) {
    return `La placa ${placa} tiene historial, pero no hay suficientes registros en ${periodo.etiqueta} para calcular km recorridos.`;
  }

  const calculo = calcularKm(registrosPeriodo);

  if (!calculo) {
    return `No fue posible calcular los kilómetros recorridos para la placa ${placa}.`;
  }

  const tipo = obtenerTipo(placa);
  const rendimientoManual = extraerRendimientoManual(pregunta);
  const rendimiento = rendimientoManual || obtenerRendimiento(placa);

  let respuesta = `
Placa: ${placa}
Tipo: ${tipo}
Periodo: ${periodo.etiqueta}

Km inicial: ${calculo.kmInicial}
Km final: ${calculo.kmFinal}
Km recorridos: ${calculo.kmRecorridos}
Promedio aproximado: ${calculo.promedioKmDia.toFixed(2)} km/día

Registros analizados: ${calculo.totalRegistros}
Desde: ${formatearFecha(calculo.fechaInicial)}
Hasta: ${formatearFecha(calculo.fechaFinal)}
`;

  if (pideCombustible) {
    if (!rendimiento) {
      respuesta += `

Combustible estimado:
No hay rendimiento configurado para esta placa. Puedes preguntar así:
¿Cuánto combustible usó ${placa} si rinde 45 km por galón?
`;
    } else {
      const galones = calculo.kmRecorridos / rendimiento;

      respuesta += `

Combustible estimado:
Rendimiento usado: ${rendimiento} km/galón${rendimientoManual ? " indicado por el usuario" : " por tipo de vehículo"}
Galones estimados: ${galones.toFixed(2)}
`;
    }
  }

  if (calculo.kmRecorridos < 0) {
    respuesta += `

Advertencia: el recorrido calculado es negativo. Puede existir una corrección administrativa o un dato ingresado con menor kilometraje.
`;
  }

  respuesta += `

Nota: esta consulta solo leyó Firebase. No modificó información.
`;

  return respuesta;
};

const responderGrupoKmCombustible = async ({
  pregunta,
  prefijo,
  region,
  pideCombustible,
}) => {
  const periodo = detectarPeriodo(pregunta);
  const registrosActuales = await leerRegistros();
  const historialGeneral = await leerTodoHistorial();

  let placas = Object.keys(historialGeneral);

  if (prefijo) {
    placas = placas.filter((placa) => placa.startsWith(prefijo));
  }

  if (region) {
    const placasRegion = registrosActuales
      .filter((r) => r.region === region)
      .map((r) => r.placa);

    placas = placas.filter((placa) => placasRegion.includes(placa));
  }

  const resultados = [];

  placas.forEach((placa) => {
    const registros = Object.values(historialGeneral[placa] || {});
    const registrosPeriodo = filtrarPorPeriodo(registros, periodo);
    const calculo = calcularKm(registrosPeriodo);

    if (!calculo) return;

    const rendimiento = obtenerRendimiento(placa);
    const galones = rendimiento ? calculo.kmRecorridos / rendimiento : null;

    resultados.push({
      placa,
      tipo: obtenerTipo(placa),
      kmRecorridos: calculo.kmRecorridos,
      rendimiento,
      galones,
      registros: calculo.totalRegistros,
    });
  });

  if (resultados.length === 0) {
    return "No encontré suficientes registros para calcular recorrido con esos filtros.";
  }

  resultados.sort((a, b) => b.kmRecorridos - a.kmRecorridos);

  const totalKm = resultados.reduce((sum, r) => sum + r.kmRecorridos, 0);
  const totalGalones = resultados.reduce(
    (sum, r) => sum + (r.galones || 0),
    0
  );

  const titulo = prefijo
    ? `placas que empiezan por ${prefijo}`
    : region
      ? `placas de región ${region}`
      : "placas consultadas";

  let respuesta = `
Resumen de ${titulo}
Periodo: ${periodo.etiqueta}

Placas con datos suficientes: ${resultados.length}
Km recorridos totales: ${totalKm}
`;

  if (pideCombustible) {
    respuesta += `Galones estimados totales: ${totalGalones.toFixed(2)}\n`;
  }

  respuesta += `

Detalle:
${resultados
  .slice(0, 15)
  .map((r, i) => {
    let linea = `${i + 1}. ${r.placa} | ${r.tipo} | Km: ${r.kmRecorridos}`;

    if (pideCombustible) {
      linea += r.galones !== null
        ? ` | Galones: ${r.galones.toFixed(2)} | Rendimiento: ${r.rendimiento} km/galón`
        : " | Sin rendimiento configurado";
    }

    return linea;
  })
  .join("\n")}
`;

  if (resultados.length > 15) {
    respuesta += `\nMostrando 15 de ${resultados.length} resultados.`;
  }

  respuesta += `

Nota: el combustible es una estimación según el prefijo de la placa:
P = carro, M = moto.
`;

  return respuesta;
};

const resumenPorRegion = (registros) => {
  const regiones = ["Cor", "Nor", "Pet"];

  return regiones
    .map((region) => {
      const total = registros.filter((r) => r.region === region).length;
      return `${region}: ${total} placas`;
    })
    .join("\n");
};

const resumenEstados = (registros) => {
  const urgentes = registros.filter((r) => r.estado === "URGENTE").length;
  const proximos = registros.filter((r) => r.estado === "PRÓXIMO").length;
  const ok = registros.filter((r) => r.estado === "OK").length;

  return `URGENTE: ${urgentes}\nPRÓXIMO: ${proximos}\nOK: ${ok}`;
};

const unicos = (lista) => {
  return [...new Set(lista.filter((x) => x && x !== "-"))];
};

export const preguntarGemini = async (pregunta) => {
  if (!pregunta.trim()) {
    throw new Error("Ingrese una pregunta");
  }

  const texto = normalizar(pregunta);
  const placa = extraerPlaca(pregunta);
  const prefijo = extraerPrefijo(pregunta);
  const region = detectarRegion(pregunta);

  const pideCombustible =
    texto.includes("combustible") ||
    texto.includes("gasolina") ||
    texto.includes("galon") ||
    texto.includes("galones") ||
    texto.includes("consumo");

  const pideRecorrido =
    texto.includes("recorrio") ||
    texto.includes("recorrido") ||
    texto.includes("recorrer") ||
    texto.includes("km") ||
    texto.includes("kilometraje");

  if (placa && (pideCombustible || pideRecorrido)) {
    return await responderKmYCombustiblePlaca({
      pregunta,
      placa,
      pideCombustible,
    });
  }

  if ((prefijo || region) && (pideCombustible || pideRecorrido)) {
    return await responderGrupoKmCombustible({
      pregunta,
      prefijo,
      region,
      pideCombustible,
    });
  }

  const registros = await leerRegistros();

  if (registros.length === 0) {
    return "No encontré registros en Firebase.";
  }

  const registrosBase = region
    ? registros.filter((r) => r.region === region)
    : registros;

  if (placa) {
    const registro = registros.find((r) => r.placa === placa);

    if (!registro) {
      return `No encontré la placa ${placa} en los registros actuales.`;
    }

    return `
Información de la placa ${placa}

Región: ${registro.region}
Tipo: ${obtenerTipo(placa)}
Supervisor: ${registro.supervisor}
Brigada / personal: ${registro.editor}
Km actual: ${registro.kmInicial}
Km servicio: ${registro.kmServicio}
Restante: ${registro.restante}
Estado: ${registro.estado}
Última actualización: ${formatearFecha(registro.fecha)}

Nota: esta consulta solo leyó Firebase. No modificó información.
`;
  }

  if (
    texto.includes("cuantas placas") ||
    texto.includes("cantidad de placas") ||
    texto.includes("total de placas") ||
    texto.includes("placas hay")
  ) {
    if (region) {
      return `En la región ${region} hay ${registrosBase.length} placas registradas.`;
    }

    return `
Total de placas registradas: ${registros.length}

${resumenPorRegion(registros)}
`;
  }

  if (texto.includes("region") || texto.includes("regiones")) {
    if (region) {
      return `
Región ${region}

Total de placas: ${registrosBase.length}

${formatearRegistros(registrosBase)}
`;
    }

    return `
Resumen por región:

${resumenPorRegion(registros)}
`;
  }

  if (texto.includes("supervisor") || texto.includes("supervisores")) {
    const supervisores = unicos(registrosBase.map((r) => r.supervisor));

    return `
Supervisores encontrados${region ? ` en región ${region}` : ""}:

${supervisores.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Total: ${supervisores.length}
`;
  }

  if (
    texto.includes("brigada") ||
    texto.includes("brigadas") ||
    texto.includes("personal") ||
    texto.includes("editor")
  ) {
    const personal = unicos(registrosBase.map((r) => r.editor));

    return `
Personal / brigadas encontradas${region ? ` en región ${region}` : ""}:

${personal.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Total: ${personal.length}
`;
  }

  if (
    texto.includes("estado") ||
    texto.includes("urgente") ||
    texto.includes("proximo") ||
    texto.includes("ok") ||
    texto.includes("restante")
  ) {
    let filtrados = registrosBase;

    if (texto.includes("urgente")) {
      filtrados = registrosBase.filter((r) => r.estado === "URGENTE");
    } else if (texto.includes("proximo")) {
      filtrados = registrosBase.filter((r) => r.estado === "PRÓXIMO");
    } else if (texto.includes("ok")) {
      filtrados = registrosBase.filter((r) => r.estado === "OK");
    }

    return `
Consulta de estado${region ? ` en región ${region}` : ""}

Resumen:
${resumenEstados(registrosBase)}

Registros encontrados:
${formatearRegistros(filtrados)}
`;
  }

  if (
    texto.includes("actualizacion") ||
    texto.includes("actualizaciones") ||
    texto.includes("fecha") ||
    texto.includes("reciente")
  ) {
    const ordenados = [...registrosBase].sort(
      (a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)
    );

    return `
Últimas actualizaciones${region ? ` en región ${region}` : ""}:

${formatearRegistros(ordenados.slice(0, 10))}
`;
  }

  return `
Puedo responder consultas sobre:

- Km recorrido por placa.
- Gasolina estimada por placa.
- Km o gasolina de placas que empiezan por P o M.
- Regiones: Cor, Nor, Pet.
- Supervisores.
- Brigadas o personal.
- Estado: URGENTE, PRÓXIMO, OK.
- Últimas actualizaciones.

Ejemplos:
¿Cuánta gasolina consumió la placa P762LFK este mes?
¿Cuántos km recorrió P762LFK del 01/06/2026 al 15/06/2026?
¿Cuánto combustible usaron las placas que empiezan por P?
¿Qué placas recorrieron más km este mes?
¿Cuántas placas hay en Cor?
¿Qué supervisores hay en Nor?
`;
};