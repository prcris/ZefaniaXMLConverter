const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { parseXML } = require('../utils/xmlParser');
const { convertToZefania } = require('../utils/zefaniaConverter');
const { sanitizeXmlProlog } = require('../utils/xmlSanitizer');
const { getSupportedLanguages } = require('../utils/i18n');
const tempStore = require('../utils/tempStore');

const router = express.Router();

// Rota para conversão de arquivo
router.post('/convert', (req, res) => {
  req.upload.single('xmlFile')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo foi enviado'
      });
    }

    try {
      const inputPath = req.file.path;
      const fileName = req.file.originalname;
      
      console.log(`Processando arquivo: ${fileName}`);
      
      // 1. Parse do arquivo XML
      const parsedData = await parseXML(inputPath);
      
      if (!parsedData || !parsedData.books || parsedData.books.length === 0) {
        throw new Error('Arquivo XML não contém dados bíblicos válidos');
      }
      
  // 2. Conversão para Zefania XML
  let zefaniaXML = await convertToZefania(parsedData);
      // Sanitizar para evitar erros como "Conteúdo não é permitido no prólogo"
  zefaniaXML = sanitizeXmlProlog(zefaniaXML);

      // 3. Salvar arquivo convertido como temporário e registrar token (TTL 2h)
  const outputFileName = fileName.replace(/\.xml$/i, '_zefania.xml');
      const tempName = `${Date.now()}-${Math.round(Math.random()*1e9)}.xml`;
      const outputPath = path.join(__dirname, '../../downloads', tempName);
      // Gravar explicitamente sem BOM
  await fs.writeFile(outputPath, Buffer.from(zefaniaXML, 'utf8'));

      // Registrar no tempStore (2 horas)
      const token = tempStore.add(outputPath, outputFileName, 2 * 60 * 60 * 1000, 'application/xml');

      // 4. Limpeza do arquivo de upload
      await fs.remove(inputPath);

      // 5. Resposta com informações do arquivo convertido
      res.json({
        success: true,
        message: 'Conversão realizada com sucesso!',
        // Link temporário com expiração
        downloadUrl: `/download/${token}`,
        originalName: fileName,
        convertedName: outputFileName,
        expiresInSeconds: 2 * 60 * 60,
        stats: {
          books: parsedData.books.length,
          chapters: parsedData.books.reduce((total, book) => total + book.chapters.length, 0),
          verses: parsedData.books.reduce((total, book) => 
            total + book.chapters.reduce((chTotal, chapter) => chTotal + chapter.verses.length, 0), 0)
        }
      });
      
    } catch (error) {
      console.error('Erro na conversão:', error);
      
      // Limpeza em caso de erro
      if (req.file && req.file.path) {
        try {
          await fs.remove(req.file.path);
        } catch (cleanupError) {
          console.error('Erro na limpeza:', cleanupError);
        }
      }
      
      res.status(500).json({
        success: false,
        error: 'Erro na conversão do arquivo',
        details: error.message,
        ...(process.env.NODE_ENV !== 'production' ? { stack: error.stack } : {})
      });
    }
  });
});

// Rota para download via token temporário
router.get('/download/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const entry = tempStore.get(token);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Link expirado ou inválido' });
    }

    res.setHeader('Content-Type', entry.mime || 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${entry.displayName}"`);
    res.sendFile(entry.filePath);
    
  } catch (error) {
    console.error('Erro no download:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao baixar arquivo'
    });
  }
});

// Rota para obter idiomas suportados
router.get('/languages', (req, res) => {
  try {
    const languages = getSupportedLanguages();
    res.json({
      success: true,
      languages,
      current: req.language
    });
  } catch (error) {
    console.error('Erro ao obter idiomas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao carregar idiomas'
    });
  }
});

// Rota para obter traduções do idioma atual
router.get('/translations', (req, res) => {
  try {
    // Obter todas as traduções para o idioma atual
    const translations = req.i18n.getResourceBundle(req.language, 'translation');
    
    res.json({
      success: true,
      language: req.language,
      translations
    });
  } catch (error) {
    console.error('Erro ao obter traduções:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao carregar traduções'
    });
  }
});

module.exports = router;