require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

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
      descricao: "Escolha tecido, tipo de cortina, calha e serviços.",
      imagem: `${API_URL}/imagens/tipos/cortinado.jpg`
    },
    {
      id: "estore",
      nome: "Estore",
      descricao: "Escolha o tecido e os serviços pretendidos.",
      imagem: `${API_URL}/imagens/tipos/estore.jpg`
    },
    {
      id: "estore_japones",
      nome: "Estore Japonês",
      descricao: "Escolha o tecido e os serviços pretendidos.",
      imagem: `${API_URL}/imagens/tipos/estore-japones.jpg`
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
  ],

  produtos: {
    cortinado: [
      {
        id: "tec-cort-001",
        nome: "Linho Natural",
        descricao: "Tecido leve com acabamento natural.",
        precoM2: 38,
        imagem: `${API_URL}/imagens/produtos/cortinado-linho-natural.jpg`
      },
      {
        id: "tec-cort-002",
        nome: "Veludo Areia",
        descricao: "Tecido mais encorpado e sofisticado.",
        precoM2: 52,
        imagem: `${API_URL}/imagens/produtos/cortinado-veludo-areia.jpg`
      },
      {
        id: "tec-cort-003",
        nome: "Blackout Soft",
        descricao: "Maior bloqueio de luz.",
        precoM2: 46,
        imagem: `${API_URL}/imagens/produtos/cortinado-blackout-soft.jpg`
      }
    ],

    estore: [
      {
        id: "tec-est-001",
        nome: "Screen Branco",
        descricao: "Boa entrada de luz com privacidade.",
        precoM2: 34,
        imagem: `${API_URL}/imagens/produtos/estore-screen-branco.jpg`
      },
      {
        id: "tec-est-002",
        nome: "Blackout Cinza",
        descricao: "Bloqueio de luz superior.",
        precoM2: 39,
        imagem: `${API_URL}/imagens/produtos/estore-blackout-cinza.jpg`
      },
      {
        id: "tec-est-003",
        nome: "Linho Bege",
        descricao: "Aspeto decorativo suave.",
        precoM2: 36,
        imagem: `${API_URL}/imagens/produtos/estore-linho-bege.jpg`
      }
    ],

    estore_japones: [
      {
        id: "tec-jap-001",
        nome: "Painel Pérola",
        descricao: "Visual limpo para divisões modernas.",
        precoM2: 41,
        imagem: `${API_URL}/imagens/produtos/japones-perola.jpg`
      },
      {
        id: "tec-jap-002",
        nome: "Painel Areia",
        descricao: "Acabamento contemporâneo.",
        precoM2: 44,
        imagem: `${API_URL}/imagens/produtos/japones-areia.jpg`
      },
      {
        id: "tec-jap-003",
        nome: "Painel Blackout",
        descricao: "Mais controlo de luminosidade.",
        precoM2: 49,
        imagem: `${API_URL}/imagens/produtos/japones-blackout.jpg`
      }
    ]
  },

  calhas: [
    {
      id: "calha-001",
      nome: "Calha Slim Branca",
      descricao: "Perfil discreto e elegante.",
      precoMl: 18,
      imagem: `${API_URL}/imagens/calhas/calha-slim-branca.jpg`
    },
    {
      id: "calha-002",
      nome: "Calha Alumínio Escovado",
      descricao: "Acabamento moderno.",
      precoMl: 24,
      imagem: `${API_URL}/imagens/calhas/calha-aluminio-escovado.jpg`
    },
    {
      id: "calha-003",
      nome: "Calha Premium Preta",
      descricao: "Design mais sofisticado.",
      precoMl: 29,
      imagem: `${API_URL}/imagens/calhas/calha-premium-preta.jpg`
    }
  ],

  servicos: {
    verificacaoMedidas: 25,
    instalacaoCortinado: 65,
    instalacaoEstore: 45,
    confecaoBase: 100
  }
};

function encontrarTipo(id) {
  return CONFIG.tipos.find(item => item.id === id) || null;
}

function encontrarProduto(tipo, produtoId) {
  return (CONFIG.produtos[tipo] || []).find(item => item.id === produtoId) || null;
}

function encontrarTipoCortina(id) {
  return CONFIG.tiposCortina.find(item => item.id === id) || null;
}

function encontrarCalha(id) {
  return CONFIG.calhas.find(item => item.id === id) || null;
}

function existeValor(v) {
  return v !== undefined && v !== null && v !== "";
}

function formatEuro(valor) {
  return Number(valor || 0).toFixed(2).replace(".", ",") + "€";
}

function textoSimNao(valor) {
  return valor === "sim" ? "Sim" : "Não";
}

function validarPayload(body) {
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
  if (!encontrarProduto(tipo, produtoId)) return "Produto inválido.";

  if (Number(larguraCm) <= 0) return "Largura inválida.";
  if (Number(alturaCm) <= 0) return "Altura inválida.";

  if (!["sim", "nao"].includes(verificacaoMedidas)) {
    return "Verificação de medidas inválida.";
  }

  if (!["sim", "nao"].includes(instalacao)) {
    return "Instalação inválida.";
  }

  if (!["sim", "nao"].includes(cliente.podeContactar)) {
    return "Opção de contacto inválida.";
  }

  if (tipo === "cortinado") {
    if (!existeValor(tipoCortinaId)) return "Falta o tipo de cortina.";
    if (!existeValor(calhaId)) return "Falta a calha.";
    if (!existeValor(fixacaoCalha)) return "Falta a fixação da calha.";

    if (!encontrarTipoCortina(tipoCortinaId)) return "Tipo de cortina inválido.";
    if (!encontrarCalha(calhaId)) return "Calha inválida.";
    if (!["teto", "parede"].includes(fixacaoCalha)) return "Fixação da calha inválida.";
  }

  return null;
}

function calcularOrcamento(payload) {
  const tipo = encontrarTipo(payload.tipo);
  const produto = encontrarProduto(payload.tipo, payload.produtoId);
  const tipoCortina = payload.tipoCortinaId ? encontrarTipoCortina(payload.tipoCortinaId) : null;
  const calha = payload.calhaId ? encontrarCalha(payload.calhaId) : null;

  const larguraM = Number(payload.larguraCm) / 100;
  const alturaM = Number(payload.alturaCm) / 100;
  const area = larguraM * alturaM;

  let total = 0;
  const linhas = [];

  if (payload.tipo === "cortinado") {
    const metragemTecido = area * tipoCortina.fatorConsumo;
    const subtotalTecido = metragemTecido * produto.precoM2;
    const subtotalCalha = larguraM * calha.precoMl;
    const subtotalConfecao = CONFIG.servicos.confecaoBase;

    total += subtotalTecido + subtotalCalha + subtotalConfecao;

    linhas.push({
      divisao: "Janela",
      qt: "1",
      descricao: `${calha.nome} c/${larguraM.toFixed(2)} ml (${payload.fixacaoCalha})`,
      unitario: calha.precoMl,
      total: subtotalCalha
    });

    linhas.push({
      divisao: "",
      qt: metragemTecido.toFixed(2),
      descricao: `Tecido "${produto.nome}"`,
      unitario: produto.precoM2,
      total: subtotalTecido
    });

    linhas.push({
      divisao: "",
      qt: "1",
      descricao: `Confeção ${tipoCortina.nome}`,
      unitario: subtotalConfecao,
      total: subtotalConfecao
    });

    if (payload.verificacaoMedidas === "sim") {
      total += CONFIG.servicos.verificacaoMedidas;
      linhas.push({
        divisao: "",
        qt: "1",
        descricao: "Verificação de medidas",
        unitario: CONFIG.servicos.verificacaoMedidas,
        total: CONFIG.servicos.verificacaoMedidas
      });
    }

    if (payload.instalacao === "sim") {
      total += CONFIG.servicos.instalacaoCortinado;
      linhas.push({
        divisao: "",
        qt: "1",
        descricao: "Colocação e montagem",
        unitario: CONFIG.servicos.instalacaoCortinado,
        total: CONFIG.servicos.instalacaoCortinado
      });
    }
  } else {
    const subtotalProduto = area * produto.precoM2;
    total += subtotalProduto;

    linhas.push({
      divisao: "Janela",
      qt: area.toFixed(2),
      descricao: `${tipo.nome} "${produto.nome}"`,
      unitario: produto.precoM2,
      total: subtotalProduto
    });

    if (payload.verificacaoMedidas === "sim") {
      total += CONFIG.servicos.verificacaoMedidas;
      linhas.push({
        divisao: "",
        qt: "1",
        descricao: "Verificação de medidas",
        unitario: CONFIG.servicos.verificacaoMedidas,
        total: CONFIG.servicos.verificacaoMedidas
      });
    }

    if (payload.instalacao === "sim") {
      total += CONFIG.servicos.instalacaoEstore;
      linhas.push({
        divisao: "",
        qt: "1",
        descricao: "Colocação e montagem",
        unitario: CONFIG.servicos.instalacaoEstore,
        total: CONFIG.servicos.instalacaoEstore
      });
    }
  }

  return {
    tipo,
    produto,
    tipoCortina,
    calha,
    total,
    area,
    linhas
  };
}

function gerarPdfOrcamento(payload, calc) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: "A4"
    });

    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const cliente = payload.cliente;
    const hoje = new Date().toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    const produto = encontrarProduto(payload.tipo, payload.produtoId);
    const tipo = encontrarTipo(payload.tipo);
    const tipoCortina = payload.tipoCortinaId ? encontrarTipoCortina(payload.tipoCortinaId) : null;
    const calha = payload.calhaId ? encontrarCalha(payload.calhaId) : null;

    const larguraM = Number(payload.larguraCm) / 100;
    const alturaM = Number(payload.alturaCm) / 100;
    const area = larguraM * alturaM;

    function euro(v) {
      return Number(v || 0).toFixed(2).replace(".", ",") + "€";
    }

    function drawCell(x, y, w, h, text, opts = {}) {
      const {
        font = "Helvetica",
        size = 9,
        align = "center",
        bold = false,
        fill = null,
        padding = 4
      } = opts;

      if (fill) {
        doc.rect(x, y, w, h).fill(fill);
        doc.fillColor("#000000");
      }

      doc.rect(x, y, w, h).stroke();

      doc.font(bold ? "Helvetica-Bold" : font)
        .fontSize(size)
        .text(text || "", x + padding, y + padding, {
          width: w - padding * 2,
          height: h - padding * 2,
          align
        });
    }

    function drawText(x, y, text, opts = {}) {
      const {
        font = "Helvetica",
        size = 10,
        align = "left",
        width = 500,
        bold = false
      } = opts;

      doc.font(bold ? "Helvetica-Bold" : font)
        .fontSize(size)
        .text(text, x, y, { width, align });
    }

    function addWrappedRow(row, xPositions, y, minHeight = 22) {
      const [xDiv, xQt, xDesc, xUnit, xTot] = xPositions;
      const wDiv = 48;
      const wQt = 34;
      const wDesc = 235;
      const wUnit = 56;
      const wTot = 56;

      const descHeight = doc.heightOfString(row.descricao || "", {
        width: wDesc - 8,
        align: "center"
      });

      const cellHeight = Math.max(minHeight, descHeight + 8);

      drawCell(xDiv, y, wDiv, cellHeight, row.divisao || "", { size: 9 });
      drawCell(xQt, y, wQt, cellHeight, String(row.qt || ""), { size: 9 });
      drawCell(xDesc, y, wDesc, cellHeight, row.descricao || "", { size: 9, align: "center" });
      drawCell(xUnit, y, wUnit, cellHeight, row.unitarioTexto || "", { size: 9 });
      drawCell(xTot, y, wTot, cellHeight, row.totalTexto || "", { size: 9 });

      return cellHeight;
    }

    const linhasTabela = [];

    if (payload.tipo === "cortinado") {
      const metragemTecido = area * tipoCortina.fatorConsumo;
      const subtotalTecido = metragemTecido * produto.precoM2;
      const subtotalCalha = larguraM * calha.precoMl;
      const subtotalConfecao = 100;

      linhasTabela.push({
        divisao: "Sala",
        qt: "1",
        descricao: `${calha.nome} c/${larguraM.toFixed(2).replace(".", ",")}l`,
        unitarioTexto: euro(calha.precoMl),
        totalTexto: euro(subtotalCalha)
      });

      linhasTabela.push({
        divisao: "",
        qt: metragemTecido.toFixed(2).replace(".", ","),
        descricao: `Tecido "${produto.nome}"`,
        unitarioTexto: euro(produto.precoM2),
        totalTexto: euro(subtotalTecido)
      });

      linhasTabela.push({
        divisao: "",
        qt: "1",
        descricao: `Confeção ${tipoCortina.nome}`,
        unitarioTexto: euro(subtotalConfecao),
        totalTexto: euro(subtotalConfecao)
      });

      if (payload.verificacaoMedidas === "sim") {
        linhasTabela.push({
          divisao: "",
          qt: "1",
          descricao: "Verificação de Medidas",
          unitarioTexto: euro(CONFIG.servicos.verificacaoMedidas),
          totalTexto: euro(CONFIG.servicos.verificacaoMedidas)
        });
      }

      if (payload.instalacao === "sim") {
        linhasTabela.push({
          divisao: "",
          qt: "1",
          descricao: "Colocação e Montagem",
          unitarioTexto: euro(CONFIG.servicos.instalacaoCortinado),
          totalTexto: euro(CONFIG.servicos.instalacaoCortinado)
        });
      }
    } else {
      const subtotalProduto = area * produto.precoM2;

      linhasTabela.push({
        divisao: "Sala",
        qt: area.toFixed(2).replace(".", ","),
        descricao: `${tipo.nome} "${produto.nome}"`,
        unitarioTexto: euro(produto.precoM2),
        totalTexto: euro(subtotalProduto)
      });

      if (payload.verificacaoMedidas === "sim") {
        linhasTabela.push({
          divisao: "",
          qt: "1",
          descricao: "Verificação de Medidas",
          unitarioTexto: euro(CONFIG.servicos.verificacaoMedidas),
          totalTexto: euro(CONFIG.servicos.verificacaoMedidas)
        });
      }

      if (payload.instalacao === "sim") {
        linhasTabela.push({
          divisao: "",
          qt: "1",
          descricao: "Colocação e Montagem",
          unitarioTexto: euro(CONFIG.servicos.instalacaoEstore),
          totalTexto: euro(CONFIG.servicos.instalacaoEstore)
        });
      }
    }

    const subtotal = calc.total;
    const total = calc.total;

    // Página 1
    drawText(0, 30, "GUIA LAR – Loja de Decoração", {
      bold: false,
      size: 13,
      align: "center",
      width: 595 - 100
    });

    drawText(70, 62, "Exmo. Sr.(a)", { size: 10 });
    drawText(70, 86, `${cliente.nome} / ${cliente.numero}`, {
      size: 10,
      bold: true
    });

    drawText(225, 112, "Orçamento:", {
      size: 11,
      bold: true,
      width: 120,
      align: "left"
    });
    doc.moveTo(225, 126).lineTo(300, 126).stroke();

    drawText(70, 144, "Exmo. Sr.(a)", { size: 10 });
    drawText(350, 144, hoje, { size: 10, bold: true, width: 150, align: "right" });

    drawText(
      70,
      172,
      "Conforme o solicitado por V. Exas. Apresentamos-lhe o nosso orçamento referente ao fornecimento e colocação dos seguintes materiais:",
      { size: 10, width: 430 }
    );

    // Tabela
    const xDiv = 70;
    const xQt = 118;
    const xDesc = 152;
    const xUnit = 387;
    const xTot = 443;
    const xPositions = [xDiv, xQt, xDesc, xUnit, xTot];

    let y = 220;
    const headerH = 32;

    drawCell(xDiv, y, 48, headerH, "Divisão", { bold: true, size: 9 });
    drawCell(xQt, y, 34, headerH, "Qt.", { bold: true, size: 9 });
    drawCell(xDesc, y, 235, headerH, "Descrição do material", { bold: true, size: 9 });
    drawCell(xUnit, y, 56, headerH, "Valor\nUnitário", { bold: true, size: 9 });
    drawCell(xTot, y, 56, headerH, "Valor\nTotal", { bold: true, size: 9 });

    y += headerH;

    linhasTabela.forEach((row) => {
      const h = addWrappedRow(row, xPositions, y, 22);
      y += h;
    });

    // Totais à direita
    const totalBoxX = xUnit;
    const totalLabelW = 56;
    const totalValueW = 56;
    const totalRowH = 20;

    function drawTotalRow(label, value, yy, shaded = false) {
      drawCell(totalBoxX - 66, yy, 66, totalRowH, label, {
        bold: true,
        size: 9,
        align: "right"
      });
      drawCell(totalBoxX, yy, totalLabelW, totalRowH, shaded ? "" : "", {
        size: 9,
        fill: shaded ? "#d9d9d9" : null
      });
      drawCell(totalBoxX + totalLabelW, yy, totalValueW, totalRowH, value, {
        size: 9,
        fill: shaded ? "#d9d9d9" : null
      });
    }

    drawText(totalBoxX - 66, y + 4, "Sub - Total:", {
      size: 10,
      bold: true,
      width: 60,
      align: "right"
    });
    drawCell(totalBoxX, y, totalLabelW, totalRowH, "", { fill: "#d9d9d9" });
    drawCell(totalBoxX + totalLabelW, y, totalValueW, totalRowH, euro(subtotal), {
      fill: "#d9d9d9",
      size: 9
    });

    y += totalRowH;

    drawText(totalBoxX - 66, y + 4, "Total Iva 23%:", {
      size: 10,
      bold: true,
      width: 60,
      align: "right"
    });
    drawCell(totalBoxX, y, totalLabelW, totalRowH, "", { fill: "#d9d9d9" });
    drawCell(totalBoxX + totalLabelW, y, totalValueW, totalRowH, "Incluido", {
      fill: "#d9d9d9",
      size: 9
    });

    y += totalRowH;

    drawText(totalBoxX - 66, y + 4, "Total:", {
      size: 10,
      bold: true,
      width: 60,
      align: "right"
    });
    drawCell(totalBoxX, y, totalLabelW, totalRowH, "", { fill: "#d9d9d9" });
    drawCell(totalBoxX + totalLabelW, y, totalValueW, totalRowH, euro(total), {
      fill: "#d9d9d9",
      size: 9
    });

    y += totalRowH;

    drawText(totalBoxX - 66, y + 4, "Entrega:", {
      size: 10,
      bold: true,
      width: 60,
      align: "right"
    });
    drawCell(totalBoxX, y, totalLabelW, totalRowH, "", { fill: "#d9d9d9" });
    drawCell(totalBoxX + totalLabelW, y, totalValueW, totalRowH, "", {
      fill: "#d9d9d9",
      size: 9
    });

    y += totalRowH;

    drawText(totalBoxX - 66, y + 4, "Total:", {
      size: 10,
      bold: true,
      width: 60,
      align: "right"
    });
    drawCell(totalBoxX, y, totalLabelW, totalRowH, "", { fill: "#d9d9d9" });
    drawCell(totalBoxX + totalLabelW, y, totalValueW, totalRowH, "", {
      fill: "#d9d9d9",
      size: 9
    });

    y += 55;

    drawText(70, y, "Condições de Fornecimento:", {
      size: 12,
      bold: false
    });

    y += 28;
    drawText(88, y, "• O preço orçamentado inclui IVA à taxa em vigor.", { size: 10, width: 430 });
    y += 18;
    drawText(88, y, "• Proposta válida pelo período de 7 dias.", { size: 10, width: 430 });
    y += 18;
    drawText(88, y, "• Condições de pagamento: 30% de adjudicação ou superior se o cliente assim pretender (IBAN: PT50 0036 0032 9910 0361 4048 8), restante após conclusão dos trabalhos.", {
      size: 10,
      width: 430
    });
    y += 34;
    drawText(88, y, "• Local de entrega: Obra do cliente.", { size: 10, width: 430 });
    y += 18;
    drawText(88, y, "• Prazo de entrega: A definir.", { size: 10, width: 430 });

    y += 42;
    drawText(70, y, "Esperamos que o orçamento seja do seu agrado, agradecemos imenso a sua proposta de consulta.", {
      size: 10,
      width: 430
    });

    y += 32;
    drawText(70, y, "Sem outro assunto de momento subscrevemo-nos com consideração.", {
      size: 10,
      width: 430
    });

    y += 48;
    drawText(0, y, "A Gerência", {
      size: 12,
      align: "center",
      width: 595 - 100
    });

    y += 30;
    doc.font("Times-BoldItalic").fontSize(14).text("Andreia Guerreiro & Luís Pires", 0, y, {
      width: 595 - 100,
      align: "center"
    });

    // Página 2
    doc.addPage();

    drawText(0, 30, "GUIA LAR – Loja de Decoração", {
      size: 13,
      align: "center",
      width: 595 - 100
    });

    drawText(
      70,
      110,
      "Em caso de adjudicação, deverão V. Exas., devolver-nos este documento devidamente assinado.",
      { size: 11, width: 430 }
    );

    drawText(0, 150, "O Cliente", {
      size: 12,
      align: "center",
      width: 595 - 100
    });

    doc.moveTo(100, 190).lineTo(445, 190).stroke();

    drawText(70, 205, "Nota importante:", {
      size: 10,
      bold: false,
      width: 430
    });

    drawText(
      88,
      220,
      "1. A Guialar considera da responsabilidade do proprietário ou de quem legitimamente o represente, a obtenção de todas as licenças e demais autorizações, necessárias à execução da obra, não podendo, por isso ser-lhe imputada qualquer responsabilidade pela sua não existência.",
      { size: 10, width: 380 }
    );

    drawText(
      88,
      290,
      "2. Os materiais fornecidos serão propriedade da Guialar, até ao seu pagamento integral, podendo ser retirados da casa do cliente em caso de não pagamento.",
      { size: 10, width: 380 }
    );

    drawText(
      88,
      350,
      "3. Os preços podem variar em função das medidas definidas e da supervisão das características técnicas da obra, não incluindo quaisquer encargos de eventuais trabalhos de desmontagem e ou preparação de vãos.",
      { size: 10, width: 380 }
    );

    drawText(0, 430, "O Cliente", {
      size: 12,
      align: "center",
      width: 595 - 100
    });

    doc.moveTo(100, 470).lineTo(445, 470).stroke();

    doc.end();
  });
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    mensagem: "API Guia Lar ativa."
  });
});

app.get("/api/orcamento/config", (req, res) => {
  res.json(CONFIG);
});

app.post("/api/orcamento/enviar", async (req, res) => {
  try {
    const erroValidacao = validarPayload(req.body);
    if (erroValidacao) {
      return res.status(400).json({
        mensagem: erroValidacao
      });
    }

    const calc = calcularOrcamento(req.body);
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

    const textoCliente = `
Olá ${cliente.nome},

Recebemos o seu pedido de orçamento na Guia Lar.

Em anexo segue o seu orçamento em PDF.

Obrigado,
Guia Lar
`.trim();

    const textoAdmin = `
Novo pedido de orçamento recebido.

Cliente: ${cliente.nome}
Telefone: ${cliente.numero}
Email: ${cliente.email}
Cidade: ${cliente.cidade}
Tipo: ${calc.tipo.nome}
Produto: ${calc.produto.nome}
Total estimado: ${formatEuro(calc.total)}
`.trim();

    await transporter.sendMail({
      from: `"Guia Lar" <${process.env.SMTP_FROM}>`,
      to: cliente.email,
      subject: "Orçamento Guia Lar",
      text: textoCliente,
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
      text: textoAdmin,
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
