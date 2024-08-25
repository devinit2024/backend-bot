
const RANGE_SESSION = 'Hoja1!B2'; // Cambia el nombre de la hoja y rango si es necesario
const RANGE_CREDENTIALS = 'Hoja1!A2:A15'; // Cambia el nombre de la hoja y rango si es necesario

// index.js
const app = require("./app");
const http = require("http");
const PORT = process.env.PORT || 3000;

// Create an HTTP server and listen to requests
const server = http.createServer(app);



// Importar las dependencias necesarias
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { google } = require("googleapis");
const fs = require("fs");
require('dotenv').config();


// Configurar cliente de Google Sheets
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json', // Reemplaza con la ruta a tus credenciales
  scopes: SCOPES,
});


// Cargar credenciales de Google

const credentialsJSON = process.env.CREDENTIALS

const { MessageMedia } = require("whatsapp-web.js");
const path = require("path");
// Intervalo para revisar la inactividad cada minuto
setInterval(checkInactivity, 60 * 1000);



const sheets = google.sheets({ version: "v4", auth });

// const ACCIONPAGE = "1_pN_s9UnCdrFzjaBiEcz6XH75-LVqqrmMOsRvySenXY"
const ACCIONPAGE = process.env.ACCIONSOCIAL
const TRANSITOPAGE = process.env.TRANSITO
const CASTRACIONPAGE = process.env.CASTRACION

const SPREADSHEET_ID = `${ACCIONPAGE}`; // ID del spreadsheet para Acción Social
const SPREADSHEET_ID_TWO = `${TRANSITOPAGE}`; // ID del spreadsheet para Tránsito
const SPREADSHEET_ID_THREE = `${CASTRACIONPAGE}`; // ID del spreadsheet para Castración
const SPREADSHEET_ID_SESSION = "1wxFov1VNHdcV56B0bPSpPt9zl55OdKWSjtBbl-yFCqk"; // ID del spreadsheet para Auth



const credentialsPath = path.join(__dirname, 'credentials.json');


// Leer y parsear el archivo de credenciales
const CREDENTIALS = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));


const inactivityTimeout = 5 * 60 * 1000; // 5 minutos en milisegundos
const lastActivity = {};


const SHEET_NAME_1 = "Hoja 1";
const SHEET_NAME_2 = "Hoja 1";
const SHEET_NAME_3 = "Hoja 1"; // Hoja para Castración
// const SHEET_NAME_4 = "Hoja 1"; // Hoja para Clientes activos
const ADVISOR_PHONE_NUMBER = "5493462529718"; // Número del asesor
const wwebVersion = "2.2412.54";



const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "client-one",
  }),
  puppeteer: {
    args: ["--no-sandbox"],
  },
  webVersionCache: {
    type: "remote",
    remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
  },
});

const conversationState = {};
let userName = "";
let selectedSheetId = SPREADSHEET_ID;
let selectedSheetName = SHEET_NAME_1;
let selectedCategory = "";
let animalName = "";
let selectedDay = "";

// Leer datos de Google Sheets
const readSheetData = async (sheetName) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: selectedSheetId,
      range: `${sheetName}!A1:G70`,
    });
    return response.data.values;
  } catch (error) {
    console.error("Error al leer datos de Google Sheets:", error);
    throw error;
  }
};

// Escribir datos en Google Sheets
const writeSheetData = async (sheetName, row, column, value) => {
  const range = `${sheetName}!${column}${row}`;

  const response = await sheets.spreadsheets.values.update({
    spreadsheetId: selectedSheetId,
    range: range,
    valueInputOption: "USER_ENTERED",
    resource: { values: [[value]] },
  });
  return response.status === 200;
};

// Obtener los turnos disponibles para un día específico
const getAvailableSlotsForDay = async (sheetName, day) => {
  const rows = await readSheetData(sheetName);

  let startRow, endRow;

  switch (day.toLowerCase()) {
    case "lunes":
      startRow = 3;
      endRow = 12;
      break;
    case "martes":
      startRow = 17;
      endRow = 26;
      break;
    case "miércoles":
      startRow = 31;
      endRow = 40;
      break;
    case "jueves":
      startRow = 45;
      endRow = 54;
      break;
    case "viernes":
      startRow = 58;
      endRow = 67;
      break;
    default:
      return ["Día no válido"];
  }

  return Array.from({ length: 10 }, (_, i) => {
    const rowIndex = startRow + i;
    const slot = rows[rowIndex - 1];

    if (slot) {
      const availability = slot[5] || "NO";
      return availability === "NO"
        ? `${i + 1}- ${getFormattedTime(i + 1)} - *No disponible*`
        : `${i + 1}- ${getFormattedTime(i + 1)} - *Disponible*`;
    } else {
      return `${i + 1}- ${getFormattedTime(i + 1)} - *No disponible*`;
    }
  });
};

// Asignar un turno a un usuario
const assignSlot = async (sheetName, day, slotNumber, userName, fecha) => {
  const rows = await readSheetData(sheetName);

  let startRow, endRow;

  switch (day.toLowerCase()) {
    case "lunes":
      startRow = 3;
      endRow = 12;
      break;
    case "martes":
      startRow = 17;
      endRow = 26;
      break;
    case "miércoles":
      startRow = 31;
      endRow = 40;
      break;
    case "jueves":
      startRow = 45;
      endRow = 54;
      break;
    case "viernes":
      startRow = 58;
      endRow = 67;
      break;
    default:
      return null;
  }

  const rowIndex = startRow + slotNumber - 1;
  const slot = rows[rowIndex - 1];

  if (slot && slot[5] === "SI") {
    await writeSheetData(sheetName, rowIndex, "F", "NO");
    await writeSheetData(sheetName, rowIndex, "E", userName);
    await writeSheetData(sheetName, rowIndex, "D", fecha);
    return slot;
  } else {
    return null;
  }
};

// Asignar un turno para la categoría "Castración"
const assignCastrationSlot = async (
  sheetName,
  animalName,
  animalGender,
  ownerPhoneNumber
) => {
  const rows = await readSheetData(sheetName);

  for (let i = 3; i <= 42; i++) {
    // Asegúrate que este rango cubre todas las filas con turnos en la hoja
    const availability = rows[i - 1][5]; // Columna F para la disponibilidad

    if (availability === "SI") {
      // Colocar los datos del animal y dueño en las columnas correspondientes
      await writeSheetData(sheetName, i, "B", i - 2); // Columna B para el número de turno
      await writeSheetData(sheetName, i, "C", animalGender); // Columna C para macho/hembra
      await writeSheetData(sheetName, i, "E", animalName); // Columna E para nombre de animal
      await writeSheetData(sheetName, i, "F", "NO"); // Marcar turno como no disponible
      await writeSheetData(sheetName, i, "G", ownerPhoneNumber); // Columna G para teléfono del dueño
      await writeSheetData(sheetName, i, "D", getFormattedTime(i - 2)); // Columna D para hora del turno

      return {
        slotNumber: i - 2,
        time: getFormattedTime(i - 2),
      };
    }
  }

  return null; // No hay turnos disponibles
};

// Formatear los días disponibles
const formatDays = async () => {
  const days = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES"];
  let daysWithNumbers = "";

  days.forEach((day, index) => {
    daysWithNumbers += `*${day}*\n`;
  });

  return daysWithNumbers.trim();
};

// Formatear el horario del turno
const getFormattedTime = (slotNumber) => {
  const times = {
    1: "07:00 hs",
    2: "07:30 hs",
    3: "08:00 hs",
    4: "08:30 hs",
    5: "09:00 hs",
    6: "09:30 hs",
    7: "10:00 hs",
    8: "10:30 hs",
    9: "11:00 hs",
    10: "11:30 hs",
    11: "14:00 hs",
    12: "14:30 hs",
    13: "15:00 hs",
    14: "15:30 hs",
    15: "16:00 hs",
    16: "16:30 hs",
    17: "17:00 hs",
    18: "17:30 hs",
    19: "18:00 hs",
    20: "18:30 hs",
    21: "19:00 hs",
    22: "19:30 hs",
    23: "20:00 hs",
    24: "20:30 hs",
    25: "21:00 hs",
    26: "21:30 hs",
    27: "22:00 hs",
    28: "22:30 hs",
    29: "23:00 hs",
    30: "23:30 hs",
    31: "00:00 hs",
    32: "00:30 hs",
    33: "01:00 hs",
    34: "01:30 hs",
    35: "02:00 hs",
    36: "02:30 hs",
    37: "03:00 hs",
    38: "03:30 hs",
    39: "04:00 hs",
    40: "04:30 hs",
  };
  return times[slotNumber] || "*No disponible*";
};

// Función para verificar inactividad
function checkInactivity() {
  const currentTime = Date.now();
  for (const chatId in lastActivity) {
    if (lastActivity.hasOwnProperty(chatId)) {
      const elapsedTime = currentTime - lastActivity[chatId];
      if (elapsedTime >= inactivityTimeout) {
        client.sendMessage(
          chatId,
          "Estuve esperando por tu mensaje, como no llegó te pido que vuelvas a enviar *iniciar bot* para reiniciar la conversación."
        );
        delete lastActivity[chatId]; // Eliminar el registro para evitar múltiples mensajes
      }
    }
  }
}


client.on("message", async (message) => {
  const chatId = message.from;
  const userMessage = message.body.trim().toLowerCase();

  // Actualizar la última actividad
  lastActivity[chatId] = Date.now();

  if (message.body.toLowerCase() === "iniciar bot") {
    const fechaHoraActual = new Date();
    const respuesta = `Bot iniciado. Fecha y hora actual: \n${fechaHoraActual.toLocaleString()}`;

    client.sendMessage(chatId, respuesta).then(async () => {
      // Cargar la imagen desde el sistema
      const media = MessageMedia.fromFilePath(path.join(__dirname, "./Images/bot.png"));

      // Enviar la imagen con el mensaje de bienvenida
      await client.sendMessage(chatId, media, {
        caption:
          "Bienvenido al bot de atención.\nPor favor ¿Cuál es tu nombre y apellido? *Son necesarios para el trámite*",
      });

      conversationState[chatId] = "ASK_NAME";
    });
  } else if (conversationState[chatId] === "ASK_NAME") {
    const media = MessageMedia.fromFilePath(path.join(__dirname, "./Images/bot.gif"));
    userName = message.body.trim();
    client.sendMessage(
      chatId,
      `Gracias ${userName}, antes de continuar, queríamos dejar claro que la comuna *_NUNCA_* pedirá datos personales como contraseñas, claves token o homebanking.`
    );
    client.sendMessage(chatId, media, {
      caption:
        "¿Para qué tema te gustaría solicitar un turno? Elige una opción:\n1. *Acción Social*\n2. *Tránsito*\n3. *Castración*\n4. *Contacta* *Asesor*\n5. *Salir*",
    });
    conversationState[chatId] = "ASK_CATEGORY";
  } else if (conversationState[chatId] === "ASK_CATEGORY") {
    const selectedOption = message.body.trim();

    switch (selectedOption) {
      case "1":
        selectedCategory = "Acción Social";
        selectedSheetId = SPREADSHEET_ID;
        selectedSheetName = SHEET_NAME_1;
        client.sendMessage(
          chatId,
          "Has seleccionado *Acción Social*. ¿Para qué día deseas el turno? Elige un día de la semana:\n1. Lunes\n2. Martes\n3. Miércoles\n4. Jueves\n5. Viernes"
        );
        conversationState[chatId] = "ASK_DAY";
        break;
      case "2":
        selectedCategory = "Tránsito";
        selectedSheetId = SPREADSHEET_ID_TWO;
        selectedSheetName = SHEET_NAME_2;
        client.sendMessage(
          chatId,
          "Has seleccionado *Tránsito*. ¿Para qué día deseas el turno? Elige un día de la semana:\n1. Lunes\n2. Martes\n3. Miércoles\n4. Jueves\n5. Viernes"
        );
        conversationState[chatId] = "ASK_DAY";
        break;
      case "3":
        selectedCategory = "Castración";
        selectedSheetId = SPREADSHEET_ID_THREE;
        selectedSheetName = SHEET_NAME_3;
        client.sendMessage(
          chatId,
          "Has seleccionado *Castración*. Por favor, indica el nombre de la mascota."
        );
        conversationState[chatId] = "ASK_ANIMAL_NAME";
        break;
      case "4":
        client.sendMessage(
          chatId,
          "Has seleccionado *Contacta Asesor*. Por favor, proporciona el número de teléfono al que deseas que te contacten."
        );
        conversationState[chatId] = "ASK_PHONE_FOR_ADVISOR";
        break;
      case "5":
        client.sendMessage(chatId, "Gracias por usar el bot. ¡Hasta luego!");
        conversationState[chatId] = null;
        break;
      default:
        client.sendMessage(
          chatId,
          "Por favor, elige una opción válida:\n1. Acción Social\n2. Tránsito\n3. Castración\n4. Contacta Asesor\n5. Salir"
        );
    }
  } else if (conversationState[chatId] === "ASK_DAY") {
    const selectedDayOption = parseInt(userMessage, 10);

    const daysOfWeek = {
      1: "Lunes",
      2: "Martes",
      3: "Miércoles",
      4: "Jueves",
      5: "Viernes",
    };

    selectedDay = daysOfWeek[selectedDayOption];
    if (!selectedDay) {
      client.sendMessage(
        chatId,
        "Día no válido. Por favor, elige un número del 1 al 5."
      );
      return;
    }

    // Guardar el día seleccionado en el estado de la conversación
    conversationState[chatId] = {
      step: "ASK_SLOT",
      selectedDayOption: selectedDayOption,
      selectedDay: selectedDay,
    };

    client.sendMessage(
      chatId,
      `Has seleccionado *${selectedDay}*. Los turnos disponibles para ese día son:\n\n${(
        await getAvailableSlotsForDay(selectedSheetName, selectedDay)
      ).join(
        "\n"
      )}\n\nEscribe el *NUMERO* del turno que deseas reservar o escribe 'salir', para terminar.`
    );
  } else if(conversationState[chatId] && conversationState[chatId].step === "ASK_SLOT") {
    const selectedSlotNumber = parseInt(userMessage, 10);

    if (userMessage === "salir") {
        client.sendMessage(
            chatId,
            "Has elegido salir. Vuelve a escribir iniciar bot."
        );
        return;
    }

    if (userMessage === "salir") {
      client.sendMessage(
        chatId,
        "Has elegido salir. Vuelve a escribir iniciar bot."
      );
      return;
    }

    if (
      isNaN(selectedSlotNumber) ||
      selectedSlotNumber < 1 ||
      selectedSlotNumber > 10
    ) {
      client.sendMessage(
        chatId,
        "Número de turno no válido. Por favor, elige un número entre 1 y 10."
      );
      return;
    }

    // Función para calcular las fechas de lunes a viernes de la próxima semana
    function obtenerFechaProximaSemana(diaSeleccionado) {
      const fechaActual = new Date();
      const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
      const fechas = [];

      // Calcular el primer día de la próxima semana (lunes)
      let diaDeLaSemanaActual = fechaActual.getDay(); // 0 es Domingo, 1 es Lunes, etc.
      if (diaDeLaSemanaActual === 0) {
        diaDeLaSemanaActual = 7; // Convertir domingo a 7
      }

      let diferenciaDias = 8 - diaDeLaSemanaActual; // Lunes de la próxima semana
      if (diferenciaDias < 0) {
        diferenciaDias += 7;
      }

      // Ajustar la fecha actual para obtener el lunes de la próxima semana
      fechaActual.setDate(fechaActual.getDate() + diferenciaDias);

      // Generar las fechas para Lunes a Viernes
      for (let i = 0; i < 5; i++) {
        const fecha = new Date(fechaActual);
        fecha.setDate(fecha.getDate() + i);
        fechas.push({
          dia: diasSemana[i],
          fecha: fecha.toLocaleDateString("es-ES"),
        });
      }

      console.log(JSON.stringify(fechas) + " estas son las fechas generadas");

      // Seleccionar la fecha correspondiente al día seleccionado
      return fechas[diaSeleccionado - 1].fecha;
    }

    // Obtener la fecha correspondiente al día seleccionado por el usuario
    const userSelectedDayOption = conversationState[chatId].selectedDayOption;
    const fechaProximaSemana = obtenerFechaProximaSemana(userSelectedDayOption);

    console.log(`Fecha seleccionada: ${fechaProximaSemana}`);

    // Lógica para asignar un turno
    const assignedSlot = await assignSlot(
      selectedSheetName,
      conversationState[chatId].selectedDay, // Día seleccionado por el usuario
      selectedSlotNumber,
      userName,
      fechaProximaSemana
    );

    if (assignedSlot) {
      client.sendMessage(
        chatId,
        `Turno reservado con éxito para _${selectedCategory}_, a las *${getFormattedTime(
          selectedSlotNumber
        )}*. ¡Te esperamos! el próximo *${
          conversationState[chatId].selectedDay
        }* (${fechaProximaSemana}).\nMuchas gracias, tene un excelente dia 🙌`
      );
    } 
    
    
    
    else {
      client.sendMessage(
        chatId,
        "Lo siento, el turno seleccionado ya no está disponible. Por favor, elige otro turno o escribe 'salir' para terminar."
      );

      const availableSlots = await getAvailableSlotsForDay(
        selectedSheetName,
        selectedDay
      );
      client.sendMessage(
        chatId,
        `Los turnos disponibles para *${selectedDay}* son:\n\n${availableSlots.join(
          "\n"
        )}\n\nEscribe el número del turno que deseas reservar o escribe 'salir' para terminar.`
      );
    }
  } else if (conversationState[chatId] === "ASK_ANIMAL_NAME") {
    animalName = message.body.trim();
    client.sendMessage(chatId, "¿Es un perro o un gato?");
    conversationState[chatId] = "ASK_ANIMAL_TYPE";
  } else if (conversationState[chatId] === "ASK_ANIMAL_TYPE") {
    const animalType = message.body.trim().toLowerCase();
    if (animalType !== "perro" && animalType !== "gato") {
      client.sendMessage(
        chatId,
        "Tipo de animal no válido. Por favor, escribe 'perro' o 'gato'."
      );
      return;
    }
    client.sendMessage(chatId, "¿Es macho o hembra?");
    conversationState[chatId] = "ASK_ANIMAL_GENDER";
  } else if (conversationState[chatId] === "ASK_ANIMAL_GENDER") {
    animalGender = message.body.trim().toLowerCase();
    if (animalGender !== "macho" && animalGender !== "hembra") {
      client.sendMessage(
        chatId,
        "Género de animal no válido. Por favor, escribe 'macho' o 'hembra'."
      );
      return;
    }
    client.sendMessage(
      chatId,
      "Por favor, proporciona el número de teléfono del dueño."
    );
    conversationState[chatId] = "ASK_PHONE_FOR_CATRATION";
  } else if (conversationState[chatId] === "ASK_PHONE_FOR_CATRATION") {
    const ownerPhoneNumber = message.body.trim();
    const fechaHoraActual = new Date().toLocaleString();
    const assignedSlot = await assignCastrationSlot(
      selectedSheetName,
      animalName,
      animalGender,
      ownerPhoneNumber,
      fechaHoraActual
    );

    if (assignedSlot) {
      client.sendMessage(
        chatId,
        `Turno reservado con éxito para la *Castración* de tu 😸 *${animalName}* 🐶.\nNúmero de turno: *${assignedSlot.slotNumber}*, Hora: *${assignedSlot.time}*.`
      );
      conversationState[chatId] = null;
    } else {
      client.sendMessage(
        chatId,
        "Lo siento, no hay turnos disponibles para la castración en este momento."
      );
    }
  } else if (conversationState[chatId] === "ASK_PHONE_FOR_ADVISOR") {
    const userPhoneNumber = message.body.trim();
    client.sendMessage(
      chatId,
      `Se ha enviado un mensaje al asesor. El se pondrá en contacto contigo lo antes posible. Desde ya muchas gracias`
    );

    client.sendMessage(
      ADVISOR_PHONE_NUMBER + "@c.us",
      `El número ${userPhoneNumber} quiere contactar con un asesor.`
    );
    conversationState[chatId] = null;
  } else if (message.body.toLowerCase().startsWith("limpiar castración")) {
    const command = message.body.trim();
    const sheetName = command.split(" ")[1];

    if (sheetName === "castración") {
      for (let i = 3; i <= 42; i++) {
        await writeSheetData(SHEET_NAME_2, i, "F", "SI"); // Resetear disponibilidad
        await writeSheetData(SHEET_NAME_2, i, "B", ""); // Limpiar columna B
        await writeSheetData(SHEET_NAME_2, i, "C", ""); // Limpiar columna C
        await writeSheetData(SHEET_NAME_2, i, "E", ""); // Limpiar columna E
        await writeSheetData(SHEET_NAME_2, i, "G", ""); // Limpiar columna G
      }
      client.sendMessage(
        chatId,
        "Todos los turnos para castración han sido limpiados y están disponibles nuevamente."
      );
    } else {
      client.sendMessage(
        chatId,
        "El comando 'limpiar' solo es válido para la hoja 'castración'."
      );
    }
  }
});

// Configuración del cliente de WhatsApp

client.on("qr", async (qr) => {
  console.log("Evento QR recibido");

  // Define la ruta para guardar el archivo en la carpeta 'public'
  const filePath = path.join(__dirname, "../public", "qr-code.txt");
  console.log("Ruta del archivo QR:", filePath);

  // Guarda el texto del QR en un archivo de texto
  fs.writeFile(filePath, qr, (err) => {
    if (err) {
      console.error("Error al guardar el QR code como texto:", err);
      return;
    }
    console.log("QR code guardado exitosamente como texto en", filePath);
  });

});

client.initialize();

// Evento cuando el cliente está listo
client.on("ready", () => {
  console.log("Cliente WhatsApp está listo! desde index.js");
});

// Manejo de errores generales
client.on("auth_failure", (msg) => {
  console.error("Fallo de autenticación:", msg);
});
// Manejo de errores generales
client.on("auth_failure", (msg) => {
  console.error("Fallo de autenticación:", msg);
});


server.listen(PORT, () => {
  console.log(`Server corriendo en el puerto: ${PORT}`);
}); 