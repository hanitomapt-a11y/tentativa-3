require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const db = require("./db");

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

const API_URL = "https://api.guialar.net";

const CONFIG = {
  tipos: [
    {
      id: "cortinado",
      nome: "Cortinado",
      descricao: "Escolha o tecido, tipo de cortina, calha e serviços.",
      imagem: `${API_URL}/imagens/tipos/cortinado.jpg`
    },
    {
      id: "estore",
      nome: "Estore",
      descricao: "Escolha o produto e os serviços pretendidos.",
      imagem: `${API_URL}/imagens/tipos/estore.jpg`
    },
    {
      id: "estore_japones",
      nome: "Estore Japonês",
      descricao: "Escolha o produto e os serviços pretendidos.",
      imagem: `guialar.net/imagens/colecoes/estore_japones.jpg`
    }
  ],

  tiposCortina: [
    {
      id: "franzido",
      nome: "Franzido",
      descricao: "Modelo clássico e elegante.",
      fatorConsumo: 2.0,
      imagem: `${API_URL}/imagens/tipos-cortina/franzido.jpg`
    },
    {
      id: "ondas",
      nome: "Ondas",
      descricao: "Aspeto moderno e uniforme.",
      fatorConsumo: 2.2,
      imagem: `${API_URL}/imagens/tipos-cortina/ondas.jpg`
    },
    {
      id: "macho_juntos",
      nome: "Macho Juntos",
      descricao: "Dobras decorativas marcadas.",
      fatorConsumo: 2.3,
      imagem: `${API_URL}/imagens/tipos-cortina/macho-juntos.jpg`
    },
    {
      id: "pregas",
      nome: "Pregas",
      descricao: "Acabamento mais estruturado.",
      fatorConsumo: 2.1,
      imagem: `${API_URL}/imagens/tipos-cortina/pregas.jpg`
    }
  ]
};

const COLLECTION_ALIASES = {
  cortinado: ["cortinados", "cortinado", "cortinados-modernos"],
  estore: ["estores", "estore"],
  estore_japones: ["estore-japones", "estore_japones", "estores-japoneses"],
  calhas: ["calhas", "calha"]
};

function encontrarTipo(id) {
  return CONFIG.tipos.find((item) => item.id === id) || null;
}

function encontrarTipoCortina(id) {
  return CONFIG.tiposCortina.find((item) => item.id === id) || null;
}

function existeValor(v) {
  return v !== undefined && v !== null && v !== "";
}

function formatEuro(valor) {
  return Number(valor || 0).toFixed(2).replace(".", ",") + "€";
}

function formatQuantidade(valor) {
  if (typeof valor !== "number") return String(valor || "");
  return Number.isInteger(valor)
    ? String(valor)
    : valor.toFixed(2).replace(".", ",");
}

function normalizarSlug(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function getCollectionAliases(slug) {
  return COLLECTION_ALIASES[slug] || [slug];
}

async function getCollectionsByAlias(alias) {
  const aliases = getCollectionAliases(alias);

  const [rows] = await db.query(
    `
    SELECT id, name, slug, description, image_url, is_active, sort_order
    FROM collections
    WHERE is_active = 1
      AND (
        slug IN (?)
        OR REPLACE(LOWER(slug), "_", "-") IN (?)
        OR REPLACE(LOWER(name), " ", "-") IN (?)
      )
    ORDER BY sort_order ASC, id ASC
    `,
    [aliases, aliases, aliases]
  );

  return rows;
}

async function getProductsByCollectionAlias(alias) {
  const collections = await getCollectionsByAlias(alias);

  if (!collections.length) {
    return [];
  }

  const collectionIds = collections.map((item) => item.id);

  const [rows] = await db.query(
    `
    SELECT
      p.id,
      p.collection_id,
      p.name,
      p.slug,
      p.short_description,
      p.description,
      p.price,
      p.stock_qty,
      p.main_image,
      p.is_active,
      p.sort_order,
      c.name AS collection_name,
      c.slug AS collection_slug
    FROM products p
    INNER JOIN collections c ON c.id = p.collection_id
    WHERE p.is_active = 1
      AND p.collection_id IN (?)
    ORDER BY p.sort_order ASC, p.id ASC
    `,
    [collectionIds]
  );

  return rows.map((item) => ({
    id: String(item.id),
    nome: item.name,
    descricao: item.short_description || item.description || "",
    preco: Number(item.price || 0),
    precoM2: Number(item.price || 0),
    precoMl: Number(item.price || 0),
    imagem: item.main_image || "",
    collectionId: item.collection_id,
    collectionSlug: item.collection_slug
  }));
}

async function getProductById(id) {
  const [rows] = await db.query(
    `
    SELECT
      p.id,
      p.collection_id,
      p.name,
      p.slug,
      p.short_description,
      p.description,
      p.price,
      p.stock_qty,
      p.main_image,
      p.is_active,
      p.sort_order,
      c.name AS collection_name,
      c.slug AS collection_slug
    FROM products p
    INNER JOIN collections c ON c.id = p.collection_id
    WHERE p.id = ?
      AND p.is_active = 1
    LIMIT 1
    `,
    [id]
  );

  if (!rows.length) return null;

  const item = rows[0];

  return {
    id: String(item.id),
    nome: item.name,
    descricao: item.short_description || item.description || "",
    preco: Number(item.price || 0),
    precoM2: Number(item.price || 0),
    precoMl: Number(item.price || 0),
    imagem: item.main_image || "",
    collectionId: item.collection_id,
    collectionSlug: item.collection_slug
  };
}

function produtoPertenceAoTipo(produto, tipo) {
  if (!produto) return false;

  const slug = normalizarSlug(produto.collectionSlug || "");
  const aliases = getCollectionAliases(tipo).map(normalizarSlug);

  return aliases.includes(slug);
}

async function validarPayload(body) {
  const {
    tipo,
    produtoId,
    tipoCortinaId,
    larguraCm,
    alturaCm,
    verificacaoMedidas,
    calhaId,
    fixacaoCalha,
    instalacao,
    cliente
  } = body;

  if (!existeValor(tipo)) return "Falta o tipo.";
  if (!existeValor(produtoId)) return "Falta o produto.";
  if (!existeValor(larguraCm)) return "Falta a largura.";
  if (!existeValor(alturaCm)) return "Falta a altura.";
  if (!existeValor(verificacaoMedidas)) return "Falta a opção de verificação de medidas.";
  if (!existeValor(instalacao)) return "Falta a opção de instalação.";
  if (!cliente || typeof cliente !== "object") return "Faltam os dados do cliente.";

  if (!existeValor(cliente.nome)) return "Falta o nome.";
  if (!existeValor(cliente.numero)) return "Falta o número de telefone.";
  if (!existeValor(cliente.email)) return "Falta o email.";
  if (!existeValor(cliente.rua)) return "Falta a rua.";
  if (!existeValor(cliente.cidade)) return "Falta a cidade.";
  if (!existeValor(cliente.podeContactar)) return "Falta a opção de contacto.";

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email);
  if (!emailValido) return "Email inválido.";

  if (!encontrarTipo(tipo)) return "Tipo inválido.";

  if (Number(larguraCm) <= 0) return "Largura inválida.";
  if (Number(alturaCm) <= 0) return "Altura inválida.";

  const produto = await getProductById(produtoId);
  if (!produto) return "Produto inválido.";
  if (!produtoPertenceAoTipo(produto, tipo)) return "O produto escolhido não pertence ao tipo selecionado.";

  if (tipo === "cortinado") {
    if (!existeValor(tipoCortinaId)) return "Falta o tipo de cortina.";
    if (!existeValor(calhaId)) return "Falta a calha.";
    if (!existeValor(fixacaoCalha)) return "Falta a fixação da calha.";
    if (!encontrarTipoCortina(tipoCortinaId)) return "Tipo de cortina inválido.";

    const calha = await getProductById(calhaId);
    if (!calha) return "Calha inválida.";
    if (!produtoPertenceAoTipo(calha, "calhas")) return "A calha escolhida não pertence à coleção de calhas.";
  }

  return null;
}

function calcularQuantidadeGanchos(tamanhoCalhaM) {
  let quantidade = tamanhoCalhaM / 0.065;
  quantidade = Math.floor(quantidade);

  if (quantidade % 2 !== 0) {
    quantidade += 1;
  }

  return quantidade;
}

function calcularValorConfecao(quantidadeTecido) {
  if (quantidadeTecido <= 5) return 60;
  if (quantidadeTecido <= 7) return 70;
  if (quantidadeTecido <= 8) return 80;
  if (quantidadeTecido <= 9) return 90;
  return quantidadeTecido * 10;
}

function calcularValorColocacao(tamanhoCalhaM) {
  if (tamanhoCalhaM <= 1.5) return 15;
  if (tamanhoCalhaM <= 4.0) return 20;
  return 25;
}

async function calcularOrcamento(payload) {
  const tipo = encontrarTipo(payload.tipo);
  const produto = await getProductById(payload.produtoId);
  const tipoCortina = payload.tipoCortinaId ? encontrarTipoCortina(payload.tipoCortinaId) : null;
  const calha = payload.calhaId ? await getProductById(payload.calhaId) : null;

  const larguraM = Number(payload.larguraCm) / 100;
  const alturaM = Number(payload.alturaCm) / 100;
  const area = larguraM * alturaM;

  const linhas = [];
  let total = 0;

  if (payload.tipo === "cortinado") {
    const tamanhoCalhaM = larguraM;
    const tamanhoCalhaCm = Number(payload.larguraCm);

    let valorUnitarioCalha = (Number(calha.precoMl) * tamanhoCalhaM) + 6;
    if (tamanhoCalhaM > 4) {
      valorUnitarioCalha += 7;
    }
    valorUnitarioCalha = valorUnitarioCalha * 1.23;

    linhas.push({
      divisao: "Sala",
      qt: 1,
      descricao: `${calha.nome} c/${tamanhoCalhaCm}cm`,
      unitario: valorUnitarioCalha,
      total: valorUnitarioCalha
    });

    const quantidadeGanchos = calcularQuantidadeGanchos(tamanhoCalhaM);
    const valorUnitarioGanchos = 0.10;
    const valorTotalGanchos = quantidadeGanchos * valorUnitarioGanchos;

    linhas.push({
      divisao: "",
      qt: quantidadeGanchos,
      descricao: "Ganchos Plus",
      unitario: valorUnitarioGanchos,
      total: valorTotalGanchos
    });

    const quantidadeTecido = (tamanhoCalhaM * 2.5) + 0.30;
    const valorUnitarioTecido = Number(produto.precoM2);
    const valorTotalTecido = quantidadeTecido * valorUnitarioTecido;

    linhas.push({
      divisao: "",
      qt: quantidadeTecido,
      descricao: produto.nome,
      unitario: valorUnitarioTecido,
      total: valorTotalTecido
    });

    const quantidadeFitaOnda = quantidadeTecido;
    const valorUnitarioFitaOnda = 1.5;
    const valorTotalFitaOnda = quantidadeFitaOnda * valorUnitarioFitaOnda;

    linhas.push({
      divisao: "",
      qt: quantidadeFitaOnda,
      descricao: "Fita Onda",
      unitario: valorUnitarioFitaOnda,
      total: valorTotalFitaOnda
    });

    const valorUnitarioConfecao = calcularValorConfecao(quantidadeTecido);

    linhas.push({
      divisao: "",
      qt: 1,
      descricao: "Confeção",
      unitario: valorUnitarioConfecao,
      total: valorUnitarioConfecao
    });

    if (payload.instalacao === "sim") {
      const valorUnitarioColocacao = calcularValorColocacao(tamanhoCalhaM);

      linhas.push({
        divisao: "",
        qt: 1,
        descricao: "Colocação e Montagem",
        unitario: valorUnitarioColocacao,
        total: valorUnitarioColocacao
      });
    }

    total = linhas.reduce((acc, linha) => acc + Number(linha.total || 0), 0);

    return {
      tipo,
      produto,
      tipoCortina,
      calha,
      total,
      area,
      larguraM,
      alturaM,
      linhas,
      divisao: "Sala"
    };
  }

  const subtotalProduto = area * Number(produto.precoM2);
  total += subtotalProduto;

  linhas.push({
    divisao: "Sala",
    qt: area,
    descricao: `${tipo.nome} "${produto.nome}"`,
    unitario: Number(produto.precoM2),
    total: subtotalProduto
  });

  return {
    tipo,
    produto,
    tipoCortina,
    calha,
    total,
    area,
    larguraM,
    alturaM,
    linhas,
    divisao: "Sala"
  };
}

function gerarPdfOrcamento(payload, calc) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: "A4"
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const cliente = payload.cliente;
    const hoje = new Date().toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 100;
    const centerX = 50;
    const secondPageBlockWidth = 420;
    const secondPageLeft = (pageWidth - secondPageBlockWidth) / 2;

    function drawCell(x, y, w, h, text, opts = {}) {
      const {
        size = 9,
        align = "center",
        bold = false,
        fill = null,
        padding = 4
      } = opts;

      if (fill) {
        doc.save();
        doc.rect(x, y, w, h).fill(fill);
        doc.restore();
      }

      doc.rect(x, y, w, h).stroke();

      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(size)
        .text(text || "", x + padding, y + padding, {
          width: w - padding * 2,
          height: h - padding * 2,
          align
        });
    }

    function drawText(x, y, text, opts = {}) {
      const {
        size = 10,
        align = "left",
        width = 500,
        bold = false
      } = opts;

      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(size)
        .text(text, x, y, { width, align });
    }

    drawText(centerX, 30, "GUIA LAR – Loja de Decoração", {
      size: 13,
      align: "center",
      width: contentWidth
    });

    drawText(70, 62, "Exmo. Sr.(a)", { size: 10 });
    drawText(70, 86, `${cliente.nome} / ${cliente.numero}`, {
      size: 10,
      bold: true
    });

    drawText(225, 112, "Orçamento:", {
      size: 11,
      bold: true,
      width: 120
    });
    doc.moveTo(225, 126).lineTo(300, 126).stroke();

    drawText(70, 144, "Exmo. Sr.(a)", { size: 10 });
    drawText(350, 144, hoje, {
      size: 10,
      bold: true,
      width: 150,
      align: "right"
    });

    drawText(
      70,
      172,
      "Conforme o solicitado por V. Exas. Apresentamos-lhe o nosso orçamento referente ao fornecimento e colocação dos seguintes materiais:",
      { size: 10, width: 430 }
    );

    const xDiv = 70;
    const xQt = 118;
    const xDesc = 152;
    const xUnit = 387;
    const xTot = 443;

    let y = 220;
    const headerH = 32;
    const rowHeight = 24;

    drawCell(xDiv, y, 48, headerH, "Divisão", { bold: true });
    drawCell(xQt, y, 34, headerH, "Qt.", { bold: true });
    drawCell(xDesc, y, 235, headerH, "Descrição do material", { bold: true });
    drawCell(xUnit, y, 56, headerH, "Valor\nUnitário", { bold: true });
    drawCell(xTot, y, 56, headerH, "Valor\nTotal", { bold: true });

    y += headerH;

    const materialRowsHeight = calc.linhas.length * rowHeight;

    drawCell(xDiv, y, 48, materialRowsHeight, calc.divisao || "Sala", { size: 9 });

    calc.linhas.forEach((row, index) => {
      const rowY = y + (index * rowHeight);

      drawCell(xQt, rowY, 34, rowHeight, formatQuantidade(row.qt));
      drawCell(xDesc, rowY, 235, rowHeight, row.descricao);
      drawCell(xUnit, rowY, 56, rowHeight, formatEuro(row.unitario));
      drawCell(xTot, rowY, 56, rowHeight, formatEuro(row.total));
    });

    y += materialRowsHeight;

    drawText(xUnit - 66, y + 4, "Sub - Total:", {
      size: 10,
      bold: true,
      width: 60,
      align: "right"
    });
    drawCell(xUnit, y, 56, 20, "", { fill: "#d9d9d9" });
    drawCell(xTot, y, 56, 20, formatEuro(calc.total), { fill: "#d9d9d9" });

    y += 20;

    drawText(xUnit - 66, y + 4, "Total Iva 23%:", {
      size: 10,
      bold: true,
      width: 60,
      align: "right"
    });
    drawCell(xUnit, y, 56, 20, "", { fill: "#d9d9d9" });
    drawCell(xTot, y, 56, 20, "Incluído", { fill: "#d9d9d9" });

    y += 55;

    drawText(70, y, "Condições de Fornecimento:", { size: 10 });
    y += 18;

    drawText(88, y, "• O preço orçamentado inclui IVA à taxa em vigor.", { size: 9, width: 360 });
    y += 14;
    drawText(88, y, "• Proposta válida pelo período de 7 dias.", { size: 9, width: 360 });
    y += 14;
    drawText(
      88,
      y,
      "• Condições de pagamento: 30% de adjudicação ou superior se o cliente assim pretender (IBAN: PT50 0036 0032 9910 0361 4048 8), restante após conclusão dos trabalhos.",
      { size: 9, width: 360 }
    );
    y += 28;
    drawText(88, y, "• Local de entrega: Obra do cliente.", { size: 9, width: 360 });
    y += 14;
    drawText(88, y, "• Prazo de entrega: A definir.", { size: 9, width: 360 });

    y += 26;
    drawText(
      70,
      y,
      "Esperamos que o orçamento seja do seu agrado, agradecemos imenso a sua proposta de consulta.",
      { size: 9, width: 360 }
    );

    y += 24;
    drawText(
      70,
      y,
      "Sem outro assunto de momento subscrevemo-nos com consideração.",
      { size: 9, width: 360 }
    );

    y += 34;
    drawText(centerX, y, "A Gerência", {
      size: 10,
      align: "center",
      width: contentWidth
    });

    y += 22;
    doc.font("Times-BoldItalic").fontSize(12).text("Andreia Guerreiro & Luís Pires", centerX, y, {
      width: contentWidth,
      align: "center"
    });

    doc.addPage();

    drawText(centerX, 35, "GUIA LAR – Loja de Decoração", {
      size: 13,
      align: "center",
      width: contentWidth
    });

    drawText(
      secondPageLeft,
      95,
      "Em caso de adjudicação, deverão V. Exas., devolver-nos este documento devidamente assinado.",
      {
        size: 9,
        width: secondPageBlockWidth * 0.74,
        align: "left"
      }
    );

    drawText(centerX, 122, "O Cliente", {
      size: 10,
      align: "center",
      width: contentWidth
    });

    doc.moveTo(secondPageLeft, 146).lineTo(secondPageLeft + secondPageBlockWidth, 146).stroke();

    drawText(secondPageLeft, 165, "Nota importante:", {
      size: 8,
      width: secondPageBlockWidth,
      align: "left"
    });

    drawText(
      secondPageLeft + 18,
      178,
      "1. A Guialar considera da responsabilidade do proprietário ou de quem legitimamente o represente, a obtenção de todas as licenças e demais autorizações, necessárias à execução da obra, não podendo, por isso ser-lhe imputada qualquer responsabilidade pela sua não existência.",
      { size: 8, width: secondPageBlockWidth - 30, align: "left" }
    );

    drawText(
      secondPageLeft + 18,
      238,
      "2. Os materiais fornecidos serão propriedade da Guialar, até ao seu pagamento integral, podendo ser retirados da casa do cliente em caso de não pagamento.",
      { size: 8, width: secondPageBlockWidth - 30, align: "left" }
    );

    drawText(
      secondPageLeft + 18,
      290,
      "3. Os preços podem variar em função das medidas definidas e da supervisão das características técnicas da obra, não incluindo quaisquer encargos de eventuais trabalhos de desmontagem e ou preparação de vãos.",
      { size: 8, width: secondPageBlockWidth - 30, align: "left" }
    );

    drawText(centerX, 390, "O Cliente", {
      size: 10,
      align: "center",
      width: contentWidth
    });

    doc.moveTo(secondPageLeft, 414).lineTo(secondPageLeft + secondPageBlockWidth, 414).stroke();

    doc.end();
  });
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    mensagem: "API Guia Lar ativa."
  });
});

app.get("/api/collections/:slug/products", async (req, res) => {
  try {
    const { slug } = req.params;
    const produtos = await getProductsByCollectionAlias(slug);

    res.json(produtos);
  } catch (error) {
    console.error("Erro ao carregar produtos da coleção:", error);
    res.status(500).json({
      mensagem: "Erro ao carregar produtos da coleção."
    });
  }
});

app.get("/api/orcamento/config", async (req, res) => {
  try {
    const calhas = await getProductsByCollectionAlias("calhas");

    res.json({
      tipos: CONFIG.tipos,
      tiposCortina: CONFIG.tiposCortina,
      calhas
    });
  } catch (error) {
    console.error("Erro ao carregar configuração:", error);
    res.status(500).json({
      mensagem: "Erro ao carregar a configuração do orçamento."
    });
  }
});

app.post("/api/orcamento/enviar", async (req, res) => {
  try {
    const erroValidacao = await validarPayload(req.body);

    if (erroValidacao) {
      return res.status(400).json({
        mensagem: erroValidacao
      });
    }

    const calc = await calcularOrcamento(req.body);
    const cliente = req.body.cliente;
    const pdfBuffer = await gerarPdfOrcamento(req.body, calc);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `"Guia Lar" <${process.env.SMTP_FROM}>`,
      to: cliente.email,
      subject: "Orçamento Guia Lar",
      text: "Em anexo segue o seu orçamento em PDF.",
      attachments: [
        {
          filename: "orcamento-guialar.pdf",
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    });

    await transporter.sendMail({
      from: `"Guia Lar" <${process.env.SMTP_FROM}>`,
      to: process.env.ADMIN_EMAIL || "orcamento@guialar.net",
      subject: `Novo pedido de orçamento - ${cliente.nome}`,
      text: `Novo pedido recebido de ${cliente.nome}.`,
      attachments: [
        {
          filename: "orcamento-guialar.pdf",
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    });

    return res.json({
      mensagem: "Pedido de orçamento enviado com sucesso."
    });
  } catch (error) {
    console.error("Erro ao enviar orçamento:", error);
    return res.status(500).json({
      mensagem: error.message || "Erro ao enviar o orçamento."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});
