require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: [
    "https://guialar.net",
    "https://www.guialar.net",
    "http://guialar.net",
    "http://www.guialar.net"
  ],
  methods: ["GET", "POST"]
}));

app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({
    ok: true,
    mensagem: "API Guia Lar ativa."
  });
});

app.get("/api/orcamento/config", (req, res) => {
  res.json({
    ok: true,
    tipos: [
      { id: "cortinado", nome: "Cortinado" },
      { id: "estore", nome: "Estore" },
      { id: "estore_japones", nome: "Estore Japonês" }
    ],
    tiposCortina: [
      { id: "franzido", nome: "Franzido" }
    ],
    produtos: {}
  });
});

app.get("/api/collections/calhas/products", (req, res) => {
  res.json([
    {
      id: 1,
      name: "Calha Teste",
      short_description: "Teste",
      price: 10,
      main_image: "https://api.guialar.net/imagens/calhas/calha-slim-branca.jpg"
    }
  ]);
});

app.get("/api/collections/cortinados/products", (req, res) => {
  res.json([
    {
      id: 1,
      name: "Cortinado Teste",
      short_description: "Teste",
      price: 20,
      main_image: "https://api.guialar.net/imagens/produtos/cortinado-linho-natural.jpg"
    }
  ]);
});

app.get("/api/collections/estores/products", (req, res) => {
  res.json([
    {
      id: 1,
      name: "Estore Teste",
      short_description: "Teste",
      price: 30,
      main_image: "https://api.guialar.net/imagens/produtos/estore-screen-branco.jpg"
    }
  ]);
});

app.get("/api/collections/estore-japones/products", (req, res) => {
  res.json([
    {
      id: 1,
      name: "Estore Japonês Teste",
      short_description: "Teste",
      price: 40,
      main_image: "https://api.guialar.net/imagens/produtos/japones-perola.jpg"
    }
  ]);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});
