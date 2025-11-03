const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const convertRoutes = require('./routes/convert');
const { middleware: i18nMiddleware, languageMiddleware } = require('./utils/i18n');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/xml' || 
        file.mimetype === 'application/xml' || 
        file.originalname.toLowerCase().endsWith('.xml')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos XML são permitidos!'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB máximo
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configurar i18n
app.use(i18nMiddleware);
app.use(languageMiddleware);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para upload
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Rotas
app.use('/', convertRoutes);
// Catálogo removido por solicitação do usuário: não montamos mais rotas de catálogo

// Favicon fallback for browsers requesting /favicon.ico
app.get('/favicon.ico', (req, res) => {
  res.type('image/svg+xml');
  res.sendFile(path.join(__dirname, 'public', 'favicon.svg'));
});

// Rota para traduções
app.get('/api/translations/:lang', (req, res) => {
  const lang = req.params.lang;
  const validLanguages = ['pt', 'en', 'es', 'ru', 'uk'];
  
  if (!validLanguages.includes(lang)) {
    return res.status(400).json({ error: 'Invalid language' });
  }
  
  try {
    const translations = require(`../locales/${lang}/translation.json`);
    res.json(translations);
  } catch (error) {
    console.error('Error loading translations:', error);
    // Fallback to Portuguese
    try {
      const fallbackTranslations = require('../locales/pt/translation.json');
      res.json(fallbackTranslations);
    } catch (fallbackError) {
      res.status(500).json({ error: 'Translations not available' });
    }
  }
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Arquivo muito grande. Máximo 50MB permitido.'
      });
    }
  }
  
  console.error('Erro:', error);
  res.status(500).json({
    error: 'Erro interno do servidor.',
    message: error.message
  });
});

// Criar diretórios necessários
async function createDirectories() {
  try {
    await fs.ensureDir(path.join(__dirname, '../uploads'));
    await fs.ensureDir(path.join(__dirname, '../downloads'));
    console.log('Diretórios criados/verificados');
  } catch (error) {
    console.error('Erro ao criar diretórios:', error);
  }
}

// Iniciar servidor
app.listen(PORT, async () => {
  await createDirectories();
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});

module.exports = app;