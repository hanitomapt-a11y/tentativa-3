require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

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

app.get("/collections", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, slug, description, image_url, sort_order
      FROM collections
      WHERE is_active = 1
      ORDER BY sort_order ASC, id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar coleções:", error);
    res.status(500).json({
      mensagem: "Erro ao listar coleções.",
      erro: error.message
    });
  }
});

app.get("/products", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        name,
        slug,
        short_description,
        description,
        price,
        sku,
        main_image,
        stock_qty,
        sort_order,
        collection_id
      FROM products
      WHERE is_active = 1
      ORDER BY sort_order ASC, id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    res.status(500).json({
      mensagem: "Erro ao listar produtos.",
      erro: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});
