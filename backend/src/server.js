import express from "express";
import { WebSocketServer } from "ws";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Configuração de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Servir arquivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Upload de imagem
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });
  const url = `http://localhost:8080/uploads/${req.file.filename}`;
  res.json({ url });
});

// Criar servidor HTTP e WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Lista de conexões ativas
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);

  ws.on("message", (message) => {
    // Enviar para todos os clientes conectados
    for (const client of clients) {
      if (client.readyState === ws.OPEN) {
        client.send(message);
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
