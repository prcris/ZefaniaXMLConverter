const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { 
  fetchBiblesList, 
  downloadBible, 
  getAvailableLanguages, 
  searchBibles,
  clearCache,
  getCatalogStats 
} = require('../utils/githubRepo');
const { parseXML } = require('../utils/xmlParser');
const { convertToZefenia } = require('../utils/zefeniaConverter');
const { sanitizeXmlProlog } = require('../utils/xmlSanitizer');

const router = express.Router();

// Rota principal do catálogo - compatível com frontend
router.get('/', async (req, res) => {
  try {
    const bibles = await fetchBiblesList();
    const languages = await getAvailableLanguages();
    const stats = await getCatalogStats();
    
    res.json({
      success: true,
      bibles: bibles.slice(0, 100), // Limitar para performance inicial
      total: bibles.length,
      languages: languages.length,
      stats
    });
    
  } catch (error) {
    console.error('Erro ao carregar catálogo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao carregar catálogo',
      details: error.message
    });
  }
});

// Rota para obter lista de bíblias
router.get('/bibles', async (req, res) => {
  try {
    const { 
      query = '', 
      language = '', 
      limit = 50, 
      refresh = false 
    } = req.query;
    
    // Limpar cache se solicitado
    if (refresh === 'true') {
      clearCache();
    }
    
    const bibles = await searchBibles(query, language, parseInt(limit));
    
    res.json({
      success: true,
      bibles,
      total: bibles.length,
      query: {
        search: query,
        language,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar bíblias:', error);
    res.status(500).json({
      success: false,
      error: req.t('catalog.loadError'),
      details: error.message
    });
  }
});

// Rota para obter idiomas disponíveis
router.get('/languages', async (req, res) => {
  try {
    const languages = await getAvailableLanguages();
    
    res.json({
      success: true,
      languages
    });
    
  } catch (error) {
    console.error('Erro ao buscar idiomas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao carregar idiomas',
      details: error.message
    });
  }
});

// Rota para estatísticas do catálogo
router.get('/stats', async (req, res) => {
  try {
    const stats = await getCatalogStats();
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao carregar estatísticas',
      details: error.message
    });
  }
});

// Rota para baixar e converter bíblia do repositório
router.post('/download-convert', async (req, res) => {
  try {
    const { biblePath, bibleName } = req.body;
    
    if (!biblePath) {
      return res.status(400).json({
        success: false,
        error: req.t('common.error'),
        details: 'Caminho da bíblia é obrigatório'
      });
    }
    
    console.log(`Iniciando download e conversão: ${biblePath}`);
    
    // 1. Baixar arquivo do GitHub
    const filename = path.basename(biblePath);
    const tempPath = path.join(__dirname, '../../uploads', `temp_${Date.now()}_${filename}`);
    
    try {
      await downloadBible(biblePath, tempPath);
    } catch (downloadError) {
      console.error('Erro no download:', downloadError);
      return res.status(500).json({
        success: false,
        error: req.t('catalog.downloadError') || 'Erro no download',
        details: downloadError.message
      });
    }
    
    // 2. Parse do arquivo XML
    let parsedData;
    try {
      parsedData = await parseXML(tempPath);
    } catch (parseError) {
      console.error('Erro no parse:', parseError);
      // Limpeza do arquivo temporário
      await fs.remove(tempPath).catch(() => {});
      
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar arquivo XML',
        details: parseError.message,
        ...(process.env.NODE_ENV !== 'production' ? { stack: parseError.stack } : {})
      });
    }
    
    if (!parsedData || !parsedData.books || parsedData.books.length === 0) {
      // Limpeza do arquivo temporário
      await fs.remove(tempPath).catch(() => {});
      
      return res.status(500).json({
        success: false,
        error: 'Arquivo XML não contém dados bíblicos válidos',
        details: 'Estrutura XML não reconhecida'
      });
    }
    
    // 3. Conversão para Zefenia XML
    let zefeniaXML;
    try {
      zefeniaXML = await convertToZefenia(parsedData);
      // Sanitizar o XML para evitar BOM/whitespace no prólogo
      zefeniaXML = sanitizeXmlProlog(zefeniaXML);
    } catch (convertError) {
      console.error('Erro na conversão:', convertError);
      // Limpeza do arquivo temporário
      await fs.remove(tempPath).catch(() => {});
      
      return res.status(500).json({
        success: false,
        error: 'Erro na conversão para Zefenia XML',
        details: convertError.message,
        ...(process.env.NODE_ENV !== 'production' ? { stack: convertError.stack } : {})
      });
    }
    
    // 4. Salvar arquivo convertido
    const outputFileName = filename.replace(/\.xml$/i, '_zefenia.xml');
    const outputPath = path.join(__dirname, '../../downloads', outputFileName);
    
    try {
      // Gravar explicitamente sem BOM
      await fs.writeFile(outputPath, Buffer.from(zefeniaXML, 'utf8'));
    } catch (writeError) {
      console.error('Erro ao salvar arquivo:', writeError);
      // Limpeza do arquivo temporário
      await fs.remove(tempPath).catch(() => {});
      
      return res.status(500).json({
        success: false,
        error: 'Erro ao salvar arquivo convertido',
        details: writeError.message,
        ...(process.env.NODE_ENV !== 'production' ? { stack: writeError.stack } : {})
      });
    }
    
    // 5. Limpeza do arquivo temporário
    await fs.remove(tempPath).catch(() => {});
    
    // 6. Resposta de sucesso
    res.json({
      success: true,
      message: req.t('converter.successMessage', {
        originalName: bibleName || filename,
        convertedName: outputFileName
      }),
      // A rota de download global é servida por convertRoutes em '/download/:filename'
      downloadUrl: `/download/${outputFileName}`,
      originalName: bibleName || filename,
      convertedName: outputFileName,
      stats: {
        books: parsedData.books.length,
        chapters: parsedData.books.reduce((total, book) => total + book.chapters.length, 0),
        verses: parsedData.books.reduce((total, book) => 
          total + book.chapters.reduce((chTotal, chapter) => chTotal + chapter.verses.length, 0), 0)
      }
    });
    
  } catch (error) {
    console.error('Erro geral na conversão:', error);
    res.status(500).json({
      success: false,
      error: req.t('common.error'),
      details: error.message
    });
  }
});

// Rota para limpar cache
router.post('/refresh', async (req, res) => {
  try {
    clearCache();
    
    res.json({
      success: true,
      message: 'Cache limpo com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao limpar cache',
      details: error.message
    });
  }
});

// Rota para busca avançada
router.post('/search', async (req, res) => {
  try {
    const { 
      query = '', 
      languages = [], 
      limit = 100,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.body;
    
    let bibles = await fetchBiblesList();
    
    // Filtrar por texto de busca
    if (query && query.trim() !== '') {
      const searchTerm = query.toLowerCase().trim();
      bibles = bibles.filter(bible =>
        bible.displayName.toLowerCase().includes(searchTerm) ||
        bible.language.toLowerCase().includes(searchTerm) ||
        bible.version.toLowerCase().includes(searchTerm) ||
        bible.filename.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filtrar por idiomas
    if (languages.length > 0) {
      bibles = bibles.filter(bible => 
        languages.includes(bible.language)
      );
    }
    
    // Ordenar
    bibles.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'language':
          aValue = a.language;
          bValue = b.language;
          break;
        case 'version':
          aValue = a.version;
          bValue = b.version;
          break;
        default:
          aValue = a.displayName;
          bValue = b.displayName;
      }
      
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    // Limitar resultados
    if (limit > 0) {
      bibles = bibles.slice(0, limit);
    }
    
    res.json({
      success: true,
      bibles,
      total: bibles.length,
      searchParams: {
        query,
        languages,
        limit,
        sortBy,
        sortOrder
      }
    });
    
  } catch (error) {
    console.error('Erro na busca avançada:', error);
    res.status(500).json({
      success: false,
      error: 'Erro na busca',
      details: error.message
    });
  }
});

module.exports = router;