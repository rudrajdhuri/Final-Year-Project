// const express = require("express");
// const { SerialPort } = require("serialport");
// const cors    = require("cors");

// const app = express();
// app.use(cors());
// app.use(express.json());

// const COM_PORT  = "COM4";  // HC-05 outgoing port
// const BAUD_RATE = 9600;

// let port      = null;
// let connected = false;

// function openPort() {
//   try {
//     port = new SerialPort({ path: COM_PORT, baudRate: BAUD_RATE });
//     port.on("open",  () => { connected = true;  console.log(`✅ HC-05 connected on ${COM_PORT}`); });
//     port.on("error", (err) => { connected = false; console.error("❌ Error:", err.message); });
//     port.on("close", () => { connected = false; console.log("🔌 Port closed"); });
//   } catch (err) {
//     connected = false;
//     console.error("❌ Failed to open port:", err.message);
//   }
// }

// openPort();

// app.get("/status", (req, res) => {
//   res.json({ connected, port: COM_PORT });
// });

// app.post("/move", (req, res) => {
//   const { command } = req.body;
//   if (!command) return res.status(400).json({ error: "No command" });
//   if (!connected || !port?.isOpen)
//     return res.status(503).json({ error: "Bluetooth not connected" });

//   port.write(command, (err) => {
//     if (err) return res.status(500).json({ error: err.message });
//     console.log(`→ ${command}`);
//     res.json({ success: true, command });
//   });
// });

// app.post("/reconnect", (req, res) => {
//   if (port?.isOpen) port.close();
//   setTimeout(() => { openPort(); }, 500);
//   setTimeout(() => res.json({ connected }), 1500);
// });

// app.listen(5001, () => {
//   console.log("🚀 Bluetooth bridge running → http://localhost:5001");
//   console.log(`📡 Opening ${COM_PORT} at ${BAUD_RATE} baud...`);
// });

const express = require("express");
const { SerialPort } = require("serialport");
const cors    = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const COM_PORT  = "COM4";
const BAUD_RATE = 9600;

let port      = null;
let connected = false;
let retryTimer = null;

function openPort() {
  // Clear any existing retry timer
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }

  // Close existing port if open
  if (port && port.isOpen) {
    try { port.close(); } catch {}
  }

  try {
    port = new SerialPort({ path: COM_PORT, baudRate: BAUD_RATE });

    port.on("open", () => {
      connected = true;
      console.log(`✅ HC-05 connected on ${COM_PORT}`);
    });

    port.on("error", (err) => {
      connected = false;
      console.error("❌ Error:", err.message);
      // Auto retry after 3 seconds
      retryTimer = setTimeout(openPort, 3000);
    });

    port.on("close", () => {
      connected = false;
      console.log("🔌 Port closed — retrying in 3s...");
      // Auto retry after 3 seconds
      retryTimer = setTimeout(openPort, 3000);
    });

  } catch (err) {
    connected = false;
    console.error("❌ Failed:", err.message, "— retrying in 3s...");
    retryTimer = setTimeout(openPort, 3000);
  }
}

// Start connecting
openPort();

// Status
app.get("/status", (req, res) => {
  res.json({ connected, port: COM_PORT });
});

// Send command
app.post("/move", (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: "No command" });
  if (!connected || !port?.isOpen)
    return res.status(503).json({ error: "Bluetooth not connected" });

  port.write(command, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    console.log(`→ ${command}`);
    res.json({ success: true, command });
  });
});

app.listen(5001, () => {
  console.log("🚀 Bluetooth bridge running → http://localhost:5001");
  console.log(`📡 Connecting to HC-05 on ${COM_PORT}...`);
  console.log("💡 Keep this terminal open while using Bot Control!");
});