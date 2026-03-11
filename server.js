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

  if (!["sim", "nao"].includes(verificacaoMedidas)) return "Verificação de medidas inválida.";
  if (!["sim", "nao"].includes(instalacao)) return "Instalação inválida.";
  if (!["sim", "nao"].includes(cliente.podeContactar)) return "Opção de contacto inválida.";

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

    linhas.push(`Tipo: ${tipo.nome}`);
    linhas.push(`Produto: ${produto.nome}`);
    linhas.push(`Tipo de cortina: ${tipoCortina.nome}`);
    linhas.push(`Calha: ${calha.nome}`);
    linhas.push(`Fixação da calha: ${payload.fixacaoCalha}`);
    linhas.push(`Largura: ${payload.larguraCm} cm`);
    linhas.push(`Altura: ${payload.alturaCm} cm`);
    linhas.push(`Área: ${area.toFixed(2)} m²`);
    linhas.push(`Tecido: ${formatEuro(subtotalTecido)}`);
    linhas.push(`Calha: ${formatEuro(subtotalCalha)}`);
    linhas.push(`Confeção: ${formatEuro(subtotalConfecao)}`);
  } else {
    const subtotalProduto = area * produto.precoM2;
    total += subtotalProduto;

    linhas.push(`Tipo: ${tipo.nome}`);
    linhas.push(`Produto: ${produto.nome}`);
    linhas.push(`Largura: ${payload.larguraCm} cm`);
    linhas.push(`Altura: ${payload.alturaCm} cm`);
    linhas.push(`Área: ${area.toFixed(2)} m²`);
    linhas.push(`Produto: ${formatEuro(subtotalProduto)}`);
  }

  if (payload.verificacaoMedidas === "sim") {
    total += CONFIG.servicos.verificacaoMedidas;
    linhas.push(`Verificação de medidas: ${formatEuro(CONFIG.servicos.verificacaoMedidas)}`);
  } else {
    linhas.push(`Verificação de medidas: Não`);
  }

  if (payload.instalacao === "sim") {
    const valorInstalacao = payload.tipo === "cortinado"
      ? CONFIG.servicos.instalacaoCortinado
      : CONFIG.servicos.instalacaoEstore;

    total += valorInstalacao;
    linhas.push(`Instalação: ${formatEuro(valorInstalacao)}`);
  } else {
    linhas.push(`Instalação: Não`);
  }

  linhas.push(`Total estimado: ${formatEuro(total)}`);

  return {
    tipo,
    produto,
    total,
    area,
    linhas
  };
}

function gerarPdfSimples(payload, calc) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: "A4"
    });

    const chunks = [];

    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(18).text("Guia Lar", { align: "center" });
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(14).text("Pedido de Orçamento", { align: "center" });
    doc.moveDown(2);

    doc.font("Helvetica-Bold").fontSize(12).text("Dados do cliente");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11);
    doc.text(`Nome: ${payload.cliente.nome}`);
    doc.text(`Telefone: ${payload.cliente.numero}`);
    doc.text(`Email: ${payload.cliente.email}`);
    doc.text(`Rua: ${payload.cliente.rua}`);
    doc.text(`Cidade: ${payload.cliente.cidade}`);
    doc.text(`Pode ser contactado: ${textoSimNao(payload.cliente.podeContactar)}`);

    doc.moveDown(1.5);
    doc.font("Helvetica-Bold").fontSize(12).text("Resumo do pedido");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11);

    calc.linhas.forEach(linha => {
      doc.text(`- ${linha}`);
    });

    doc.moveDown(1.5);
    doc.font("Helvetica-Bold").fontSize(12).text(`Total estimado: ${formatEuro(calc.total)}`);

    doc.moveDown(2);
    doc.font("Helvetica").fontSize(10).text("Documento gerado automaticamente pela Guia Lar.");

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
    const pdfBuffer = await gerarPdfSimples(req.body, calc);

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

Em anexo segue o resumo do seu pedido em PDF.

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
      subject: "Pedido de orçamento - Guia Lar",
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
