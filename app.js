// app.js
const express = require("express");
const path = require("path");
const { google } = require("googleapis");

require('dotenv').config();

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json', // Reemplaza con la ruta a tus credenciales
  scopes: SCOPES,
});

const app = express();
const sheets = google.sheets({ version: "v4", auth });

const ACCIONPAGE = process.env.ACCIONSOCIAL
const TRANSITOPAGE = process.env.TRANSITO
const CASTRACIONPAGE = process.env.CASTRACION

const SPREADSHEET_ID = `${ACCIONPAGE}`; // ID del spreadsheet para Acción Social
const SPREADSHEET_ID_TWO = `${TRANSITOPAGE}`; // ID del spreadsheet para Tránsito
const SPREADSHEET_ID_THREE = `${CASTRACIONPAGE}`; // ID del spreadsheet para Castración
const SPREADSHEET_ID_SESSION = "1wxFov1VNHdcV56B0bPSpPt9zl55OdKWSjtBbl-yFCqk"; // ID del spreadsheet para Auth

// Middleware para servir archivos estáticos (tu frontend)
app.use(express.static("public"));

// Definir los endpoints aquí

// Endpoint para iniciar el bot
app.get("/api/bot-status", (req, res) => {
  res.json({ status: botIniciado });
});

app.get("/api/get-turnos-accion", async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Hoja 1!A1:G70`,
    });

    const rows = response.data.values;
    console.log("Respuesta de Google Sheets:", response.data);

    const turnos = {};
    let diaActual = "";

    rows.forEach((row) => {
      if (row[0] && row[0].trim() !== "") {
        diaActual = row[0].trim();
        turnos[diaActual] = [];
      }

      if (diaActual) {
        turnos[diaActual].push({
          turno: row[1] || "",
          horario: row[2] || "",
          fecha: row[3] || "",
          nombre: row[4] || "No asignado",
          disponible: row[5] || "No disponible",
        });
      }
    });

    // Verificar que cada día tenga exactamente 10 turnos
    Object.keys(turnos).forEach((dia) => {
      const existingTurnos = turnos[dia].length;
      for (let i = existingTurnos; i < 10; i++) {
        turnos[dia].push({
          turno: "",
          horario: "",
          fecha: "",
          nombre: "",
          disponible: "No disponible",
        });
      }
    });

    res.json(turnos);
  } catch (error) {
    console.error("Error al leer datos de Google Sheets:", error);
    res.status(500).send("Error al obtener los turnos");
  }
});


app.get("/api/get-turnos-transito", async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID_TWO,
      range: `Hoja 1!A1:G70`,
    });

    const rows = response.data.values;
    console.log("Respuesta de Google Sheets:", response.data);

    const turnos = {};
    let diaActual = "";

    rows.forEach((row) => {
      if (row[0] && row[0].trim() !== "") {
        diaActual = row[0].trim();
        turnos[diaActual] = [];
      }

      if (diaActual) {
        turnos[diaActual].push({
          turno: row[1] || "",
          horario: row[2] || "",
          fecha: row[3] || "",
          nombre: row[4] || "No asignado",
          disponible: row[5] || "No disponible",
        });
      }
    });

    Object.keys(turnos).forEach((dia) => {
      const existingTurnos = turnos[dia].length;
      for (let i = existingTurnos; i < 10; i++) {
        turnos[dia].push({
          turno: "",
          horario: "",
          fecha: "",
          nombre: "",
          disponible: "No disponible",
        });
      }
    });

    res.json(turnos);
  } catch (error) {
    console.error("Error al leer datos de Google Sheets:", error);
    res.status(500).send("Error al obtener los turnos");
  }
});

app.get("/api/get-turnos-castracion", async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID_THREE,
      range: `Hoja 1!A2:G68`,
    });

    const rows = response.data.values;
    console.log("Respuesta de Google Sheets:", response.data);

    const turnos = [];

    rows.forEach((row, index) => {
      if (index === 0) return; // Salta la primera fila si contiene encabezados

      turnos.push({
        dia: row[0] || "",
        turno: row[1] || "",
        hemMacho: row[2] || "",
        horario: row[3] || "",
        nombre: row[4] || "No asignado",
        disponible: row[5] || "No disponible",
        dueño: row[6] || "Sin registros",
      });
    });

    res.json(turnos);
  } catch (error) {
    console.error("Error al leer datos de Google Sheets:", error);
    res.status(500).send("Error al obtener los turnos");
  }
});

app.use(express.static(path.join(__dirname, "../public")));

// Export the app module
module.exports = app;
