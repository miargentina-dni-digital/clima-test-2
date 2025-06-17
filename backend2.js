fetch("https://corsproxy.io/?https://www.accuweather.com/es/ar/buenos-aires/7894/current-weather/7894")
  .then(response => response.text())
  .then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Obtener temperatura
    const tempDiv = doc.querySelector('.temp .display-temp');
    const temperatura = tempDiv ? tempDiv.textContent.trim() : 'No encontrada';

    // Buscar Sensación térmica en el primer formato (.current-weather-details.no-realfeel-phrase.odd)
    let sensacion = null;
    const detalles = doc.querySelectorAll('.current-weather-details.no-realfeel-phrase.odd');

    detalles.forEach(detalle => {
      const termica = detalle.firstElementChild;
      const hijos = termica.children;
      const termicaTexto = hijos[0] || null;
      const termicaDato = hijos[1] || null;

      const label = detalle.querySelector('.label');
      const value = detalle.querySelector('.value');
      if (termicaTexto && termicaTexto.textContent.includes('RealFeel®')) {
        sensacion = termicaDato ? termicaDato.textContent.trim() : null;
      }
    });

    // Obtenemos todos los contenedores de mitad de día (día y noche)
    const halfDayCards = doc.querySelectorAll('.half-day-card-content.card');

    // ----- 🌞 Día -----
    let lluviaDia = "No encontrada";
    if (halfDayCards.length >= 1) {
      const panelItemsDia = halfDayCards[0].querySelectorAll('.panel-item');
      const itemDia = panelItemsDia[6]; // índice 6 = 7mo .panel-item
      const valueDia = itemDia ? itemDia.querySelector('.value') : null;
      lluviaDia = valueDia ? valueDia.textContent.trim() : "No encontrada";
    }

    // ----- 🌙 Noche -----
    let lluviaNoche = "No encontrada";
    if (halfDayCards.length >= 2) {
      const panelItemsNoche = halfDayCards[1].querySelectorAll('.panel-item');
      const itemNoche = panelItemsNoche[3]; // índice 3 = 4to .panel-item
      const valueNoche = itemNoche ? itemNoche.querySelector('.value') : null;
      lluviaNoche = valueNoche ? valueNoche.textContent.trim() : "No encontrada";
    }

    console.log("hoy:");
    console.log("Temperatura:", temperatura);
    console.log("Sensación térmica:", sensacion);
    console.log("Probabilidad de lluvia (día):", lluviaDia);
    console.log("Probabilidad de lluvia (noche):", lluviaNoche);

    // Actualizar los datos en el DOM
    const Temp = document.querySelector('.tempMain');
    const STermica = document.querySelector('.termica');

    Temp.textContent = (temperatura.match(/\d+/) || ["00"])[0];
    STermica.textContent = `Térmica: ${sensacion || "No disponible"}C`;
  })
  .catch(error => {
    console.error("Error al obtener los datos:", error);
  });




// PRONÓSTICO HORARIO
const urls = [
  "https://corsproxy.io/?https://www.accuweather.com/es/ar/buenos-aires/7894/hourly-weather-forecast/7894",
  "https://corsproxy.io/?https://www.accuweather.com/es/ar/buenos-aires/7894/hourly-weather-forecast/7894?day=2"
];

const tabla = document.getElementById("hourlyTable");
const filaHoras = tabla.querySelector(".horas");
const filaTermica = tabla.querySelector(".termica-horas");
const filaProb = tabla.querySelector(".prob-horas");
const filaIconos = tabla.querySelector(".icons-horas");

// Limpiar contenido previo
filaHoras.innerHTML = "";
filaTermica.innerHTML = "";
filaProb.innerHTML = "";
filaIconos.innerHTML = "";

// Variable para contabilizar condiciones generales del día
let diasSoleados = 0;
let diasNubladosOLluviosos = 0;

Promise.all(urls.map(url => fetch(url).then(r => r.text())))
  .then(htmls => {
    const datos = [];

    htmls.forEach(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const hourlyCards = doc.querySelectorAll('.hourly-card-top');

      hourlyCards.forEach((card) => {
        const subcontenedores = card.querySelectorAll('.hourly-card-subcontaint');
        const horaDiv = subcontenedores[0]?.querySelector('.date div');
        const tempDiv = subcontenedores[0]?.querySelector('.temp.metric');
        const hora = horaDiv ? horaDiv.textContent.trim() : "--";
        const temperatura = tempDiv ? tempDiv.textContent.trim().replace("°", "").trim() : "--";

        const iconContainer = card.querySelector('.hourly-card-subcontaint-icon');
        const lluviaDiv = iconContainer?.querySelector('.precip');
        let probLluvia = lluviaDiv ? lluviaDiv.textContent.trim().replace(/\s+|%/g, '') : "0";
        probLluvia = parseInt(probLluvia) || 0;

        const iconTitle = iconContainer?.querySelector('.icon')?.getAttribute('title')?.toLowerCase() || "";

        // Para determinar el clima general
        if (iconTitle.includes("sol")) {
          diasSoleados++;
        } else if (iconTitle.includes("nube") || iconTitle.includes("lluvia") || iconTitle.includes("tormenta")) {
          diasNubladosOLluviosos++;
        }

        datos.push({
          hora,
          temperatura,
          probLluvia,
          iconTitle
        });
      });
    });

    // Definir el clima general del día
    const climaGeneral = diasSoleados > diasNubladosOLluviosos ? "sun" : "cloud";

    // Rellenar la tabla con los datos y lógica de íconos
    datos.forEach(dato => {
      // Determinar ícono
      let icono = climaGeneral;
      if (dato.probLluvia > 45) {
        if (dato.iconTitle.includes("tormenta")) {
          icono = "tormenta";
        } else if (dato.iconTitle.includes("mucha lluvia") || dato.iconTitle.includes("lluvia")) {
          icono = "heavy-rain";
        }
      }

      // Crear celdas
      const tdHora = document.createElement("td");
      tdHora.textContent = dato.hora;
      filaHoras.appendChild(tdHora);

      const tdIcono = document.createElement("td");
      const img = document.createElement("img");
      img.src = `icons/${icono}.png`;
      img.alt = icono;
      img.style.width = "24px";
      tdIcono.appendChild(img);
      filaIconos.appendChild(tdIcono);

      const tdTermica = document.createElement("td");
      tdTermica.textContent = dato.temperatura;
      filaTermica.appendChild(tdTermica);

      const tdLluvia = document.createElement("td");
      tdLluvia.textContent = dato.probLluvia + "%";
      filaProb.appendChild(tdLluvia);
    });

  })
  .catch(error => {
    console.error("Error al obtener el pronóstico horario:", error);
  });


 



// Actualizar los días de la semana en cada fila de la tabla
const dias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
const hoy = new Date().getDay(); // 0 (domingo) a 6 (sábado)
const filas = document.querySelectorAll('.weekTable1 .fila');

filas.forEach((fila, i) => {
  const diaTd = fila.querySelector('.dia');
  if (!diaTd) return;

  if (i === 0) {
    diaTd.textContent = 'HOY';
  } else {
    const diaIndex = (hoy + i) % 7;
    diaTd.textContent = dias[diaIndex];
  }
});


// Hora
      const now = new Date();
      const hora = now.getHours();
      document.querySelector('.ubicacion-hr').textContent = `BUENOS AIRES / ${hora}:00`;



// PRONÓSTICO SEMANAL TABLA 


const iconMap = {
  1: "Soleado",
  2: "Mayormente soleado",
  3: "Parcialmente soleado",
  4: "Parcialmente nublado",
  5: "Nubes y sol",
  6: "Mayormente nublado",
  7: "Nublado",
  8: "Niebla",
  11: "Neblina",
  12: "Lluvia ligera",
  13: "Lluvia intermitente",
  14: "Lluvia intensa",
  15: "Tormentas",
  16: "Tormentas severas",
  17: "Tormentas intensas",
  18: "Llovizna",
  19: "Lluvia y nieve",
  22: "Nieve",
  29: "Ventoso",
  33: "Despejado noche",
  38: "Nublado noche",
  39: "storm.png"
};

const iconToImgMap = {
  1: "sun.png",
  2: "sun.png",
  3: "cloudy-day.png",
  4: "cloudy-day.png",
  5: "cloudy-day.png",
  6: "cloud.png",
  7: "cloud.png",
  8: "mist.png",
  11: "mist.png",
  12: "light-rain.png",
  13: "light-rain.png",
  14: "heavy-rain.png",
  15: "storm.png",
  16: "storm.png",
  17: "storm.png",
  18: "light-rain.png",
  39: "storm.png"
};

fetch("https://corsproxy.io/?https://www.accuweather.com/es/ar/buenos-aires/7894/daily-weather-forecast/7894")
  .then(response => response.text())
  .then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const cards = Array.from(doc.querySelectorAll('.daily-forecast-card')).slice(0, 7);

    if (cards.length === 0) {
      console.log("No se encontraron pronósticos diarios.");
      return;
    }

    const datosSemana = [];

    cards.forEach(card => {
      const info = card.querySelector('.info');
      const dateContainer = info?.querySelector('.date');
      const diaSemana = dateContainer?.querySelector('.module-header.dow.date')?.textContent.trim() || "Día no encontrado";

      const tempMax = card.querySelector('.temp .high')?.textContent.trim().replace("°", "") || "-";
      const tempMin = card.querySelector('.temp .low')?.textContent.trim().replace("°", "") || "-";

      let lluvia = "0";
      const precipContainer = card.querySelector('.precip');
      if (precipContainer) {
        const nodes = Array.from(precipContainer.childNodes);
        const textNode = nodes.find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "");
        if (textNode) lluvia = textNode.textContent.trim().replace("%", "");
      }

      let iconCode = 1;
      const svg = info?.querySelector('svg.icon');
      if (svg) {
        const src = svg.getAttribute("data-src");
        const match = src?.match(/\/(\d+)\.svg/);
        if (match) {
          iconCode = parseInt(match[1]);
          console.log("Icon code detectado:", iconCode);
        }
      }

      const icon = iconToImgMap[iconCode] || "unknown.png";
      console.log(`Para iconCode ${iconCode}, uso imagen: ${icon}`);

      datosSemana.push({
        dia: diaSemana,
        icono: icon,
        prob: lluvia,
        min: tempMin,
        max: tempMax
      });
    });

    actualizarTablaSemana(datosSemana);
  })
  .catch(error => {
    console.error("Error al obtener los datos diarios:", error);
  });

function actualizarTablaSemana(datosSemana) {
  const filas = document.querySelectorAll('#weekTable1 .fila');
  if (filas.length === 0) {
    console.error("No se encontraron filas en #weekTable1");
    return;
  }

  datosSemana.forEach((dato, index) => {
    const fila = filas[index];
    if (!fila) return;

    const diaTd = fila.querySelector('.dia');
    const iconTd = fila.querySelector('.icon');
    const minTd = fila.querySelector('.min-temp');
    const maxTd = fila.querySelector('.max-temp');

    if (diaTd) diaTd.textContent = dato.dia.toUpperCase();

    if (iconTd) {
      iconTd.innerHTML = ''; // Limpiar contenido anterior

      const img = document.createElement('img');
      img.src = `icons/${dato.icono}`;
      img.alt = `icono ${dato.icono}`;

      const lluviaDiv = document.createElement('div');
      lluviaDiv.className = 'prob';
      lluviaDiv.textContent = dato.prob + '%';

      iconTd.appendChild(img);
      iconTd.appendChild(lluviaDiv);
    }

    if (minTd) minTd.textContent = (dato.min.match(/\d+/) || [""])[0];
    if (maxTd) maxTd.textContent = "/  " + (dato.max.match(/\d+/) || [""])[0];
  });
}














// tabla vieja


// PRONOSTICO DIARIO 


fetch("https://corsproxy.io/?https://www.accuweather.com/es/ar/buenos-aires/7894/daily-weather-forecast/7894")
  .then(response => response.text())
  .then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const cards = Array.from(doc.querySelectorAll('.daily-forecast-card')).slice(0, 7);

    if (cards.length === 0) {
      console.log("No se encontraron pronósticos diarios.");
      return;
    }

    const iconCodesSemana = []; // ✅ Array para ir acumulando los iconCode

    cards.forEach(card => {
      const info = card.querySelector('.info');
      const dateContainer = info?.querySelector('.date');
      const diaSemana = dateContainer?.querySelector('.module-header.dow.date')?.textContent.trim() || "Día no encontrado";
      const fecha = dateContainer?.querySelector('.module-header.sub.date')?.textContent.trim() || "Fecha no encontrada";

      const tempMax = card.querySelector('.temp .high')?.textContent.trim() || "Máx no encontrada";
      const tempMin = card.querySelector('.temp .low')?.textContent.trim() || "Mín no encontrada";

      let lluvia = "Lluvia no encontrada";
      const precipContainer = card.querySelector('.precip');
      if (precipContainer) {
        const nodes = Array.from(precipContainer.childNodes);
        const textNode = nodes.find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "");
        if (textNode) lluvia = textNode.textContent.trim();
      }

      let frase = "Clima desconocido";
      const svg = info?.querySelector('svg.icon');
      if (svg) {
        const src = svg.getAttribute("data-src");
        const match = src?.match(/\/(\d+)\.svg/);
        if (match) {
          const iconCode = parseInt(match[1]);
          frase = iconMap[iconCode] || `Clima código ${iconCode}`;
          iconCodesSemana.push(iconCode); 
        }
      }

      const Estado = document.querySelector('.estado');
      Estado.textContent = frase || "Estado no disponible";
    });

    function actualizarIconosSemana(iconCodes) {
      const contenedor = document.querySelector('#weekTable');
      if (!contenedor) {
        console.error("No se encontró #weekContainer");
        return;
      }

      const filaIconos = contenedor.querySelector('tr.icons');
      if (!filaIconos) {
        console.error("No se encontró la fila .icons dentro de #weekContainer");
        return;
      }

      const celdas = filaIconos.querySelectorAll('td');
      iconCodes.forEach((code, index) => {
        const imgSrc = iconToImgMap[code] || "unknown.png";
        const td = celdas[index];
        if (td) {
          const img = td.querySelector('img');
          if (img) {
            img.src = `icons/${imgSrc}`;
            img.alt = `icono ${imgSrc}`;
          }
        }
      });
    }

    actualizarIconosSemana(iconCodesSemana);
  })
  .catch(error => {
    console.error("Error al obtener los datos diarios:", error);
  });
