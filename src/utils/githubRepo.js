const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// URL base do repositório GitHub
const GITHUB_REPO_BASE = 'https://api.github.com/repos/Beblia/Holy-Bible-XML-Format';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/main';

/**
 * Cache de bíblias para evitar muitas requisições à API
 */
let biblesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutos

/**
 * Extrai informações de uma bíblia a partir do nome do arquivo
 */
function parseBibleInfo(filename) {
  // Remover extensão .xml
  const basename = filename.replace(/\.xml$/i, '');
  
  // Padrões para extrair idioma e versão
  const patterns = [
    // Padrão: Language + Version + Bible (ex: English1965Bible.xml)
    /^([A-Za-z]+)(\d{4})?(.*)Bible$/,
    // Padrão: Language + Bible (ex: PortugueseBible.xml)
    /^([A-Za-z]+)Bible$/,
    // Padrão com hífen: Language-Version-Bible
    /^([A-Za-z]+)-?(.+)?$/
  ];
  
  let language = 'Unknown';
  let version = '';
  let name = basename;
  
  for (const pattern of patterns) {
    const match = basename.match(pattern);
    if (match) {
      language = match[1];
      version = match[2] || match[3] || '';
      break;
    }
  }
  
  // Mapear idiomas conhecidos
  const languageMap = {
    'Portuguese': 'Português',
    'English': 'English',
    'Spanish': 'Español',
    'French': 'Français',
    'German': 'Deutsch',
    'Italian': 'Italiano',
    'Chinese': '中文',
    'Arabic': 'العربية',
    'Russian': 'Русский',
    'Hindi': 'हिन्दी',
    'Korean': '한국어',
    'Japanese': '日本語',
    'Dutch': 'Nederlands',
    'Finnish': 'Suomi',
    'Swedish': 'Svenska',
    'Norwegian': 'Norsk',
    'Danish': 'Dansk',
    'Greek': 'Ελληνικά',
    'Hebrew': 'עברית',
    'Latin': 'Latina',
    'Romanian': 'Română',
    'Polish': 'Polski',
    'Czech': 'Čeština',
    'Hungarian': 'Magyar',
    'Bulgarian': 'Български',
    'Croatian': 'Hrvatski',
    'Serbian': 'Српски',
    'Slovenian': 'Slovenščina',
    'Slovak': 'Slovenčina',
    'Ukrainian': 'Українська',
    'Estonian': 'Eesti',
    'Latvian': 'Latviešu',
    'Lithuanian': 'Lietuvių',
    'Turkish': 'Türkçe',
    'Persian': 'فارسی',
    'Urdu': 'اردو',
    'Bengali': 'বাংলা',
    'Tamil': 'தமிழ்',
    'Telugu': 'తెలుగు',
    'Malayalam': 'മലയാളം',
    'Kannada': 'ಕನ್ನಡ',
    'Gujarati': 'ગુજરાતી',
    'Punjabi': 'ਪੰਜਾਬੀ',
    'Marathi': 'मराठी',
    'Nepali': 'नेपाली',
    'Sinhala': 'සිංහල',
    'Burmese': 'မြန်မာ',
    'Thai': 'ไทย',
    'Vietnamese': 'Tiếng Việt',
    'Indonesian': 'Bahasa Indonesia',
    'Malay': 'Bahasa Melayu',
    'Filipino': 'Filipino',
    'Swahili': 'Kiswahili',
    'Yoruba': 'Yorùbá',
    'Igbo': 'Igbo',
    'Hausa': 'Hausa',
    'Amharic': 'አማርኛ',
    'Somali': 'Soomaali'
  };
  
  const displayLanguage = languageMap[language] || language;
  
  // Criar nome de exibição mais amigável
  let displayName = displayLanguage;
  if (version && version.trim()) {
    const cleanVersion = version.replace(/Bible$/, '').trim();
    if (cleanVersion) {
      displayName += ` (${cleanVersion})`;
    }
  }
  
  return {
    filename,
    language: displayLanguage,
    originalLanguage: language,
    version: version.replace(/Bible$/, '').trim(),
    displayName,
    downloadUrl: `${GITHUB_RAW_BASE}/${filename}`
  };
}

/**
 * Busca lista de bíblias do repositório GitHub
 */
async function fetchBiblesList() {
  try {
    // Verificar cache
    if (biblesCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      return biblesCache;
    }
    
    console.log('Buscando lista de bíblias do GitHub...');
    
    // Buscar arquivos do repositório
    const response = await axios.get(`${GITHUB_REPO_BASE}/contents`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ZefeniaXMLConverter/1.0'
      },
      timeout: 10000
    });
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Resposta inválida da API do GitHub');
    }
    
    // Filtrar apenas arquivos XML
    const xmlFiles = response.data.filter(file => 
      file.type === 'file' && file.name.toLowerCase().endsWith('.xml')
    );
    
    // Processar informações das bíblias
    const bibles = xmlFiles.map(file => parseBibleInfo(file.name));
    
    // Ordenar por idioma e depois por nome
    bibles.sort((a, b) => {
      if (a.language !== b.language) {
        return a.language.localeCompare(b.language);
      }
      return a.displayName.localeCompare(b.displayName);
    });
    
    // Atualizar cache
    biblesCache = bibles;
    cacheTimestamp = Date.now();
    
    console.log(`Encontradas ${bibles.length} bíblias`);
    return bibles;
    
  } catch (error) {
    console.error('Erro ao buscar lista de bíblias:', error);
    
    // Retornar cache se disponível
    if (biblesCache) {
      console.log('Retornando dados do cache devido ao erro');
      return biblesCache;
    }
    
    throw new Error(`Erro ao acessar repositório: ${error.message}`);
  }
}

/**
 * Baixa uma bíblia específica do repositório
 */
async function downloadBible(filename, destinationPath) {
  try {
    console.log(`Baixando bíblia: ${filename}`);
    
    const url = `${GITHUB_RAW_BASE}/${filename}`;
    const response = await axios.get(url, {
      timeout: 60000, // 1 minuto
      responseType: 'stream'
    });
    
    // Criar diretório se não existir
    await fs.ensureDir(path.dirname(destinationPath));
    
    // Salvar arquivo
    const writer = fs.createWriteStream(destinationPath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`Bíblia baixada com sucesso: ${filename}`);
        resolve(destinationPath);
      });
      
      writer.on('error', (error) => {
        console.error(`Erro ao salvar bíblia ${filename}:`, error);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error(`Erro ao baixar bíblia ${filename}:`, error);
    throw new Error(`Erro no download: ${error.message}`);
  }
}

/**
 * Obter idiomas únicos da lista de bíblias
 */
async function getAvailableLanguages() {
  try {
    const bibles = await fetchBiblesList();
    const languages = [...new Set(bibles.map(bible => bible.language))];
    return languages.sort();
  } catch (error) {
    console.error('Erro ao obter idiomas:', error);
    return [];
  }
}

/**
 * Buscar bíblias com filtros
 */
async function searchBibles(query = '', language = '', limit = 50) {
  try {
    let bibles = await fetchBiblesList();
    
    // Filtrar por idioma
    if (language && language !== '') {
      bibles = bibles.filter(bible => 
        bible.language.toLowerCase() === language.toLowerCase()
      );
    }
    
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
    
    // Limitar resultados
    if (limit > 0) {
      bibles = bibles.slice(0, limit);
    }
    
    return bibles;
    
  } catch (error) {
    console.error('Erro na busca de bíblias:', error);
    throw error;
  }
}

/**
 * Limpar cache (para forçar atualização)
 */
function clearCache() {
  biblesCache = null;
  cacheTimestamp = null;
  console.log('Cache de bíblias limpo');
}

/**
 * Obter estatísticas do catálogo
 */
async function getCatalogStats() {
  try {
    const bibles = await fetchBiblesList();
    const languages = await getAvailableLanguages();
    
    return {
      totalBibles: bibles.length,
      totalLanguages: languages.length,
      lastUpdated: cacheTimestamp ? new Date(cacheTimestamp) : new Date()
    };
    
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return {
      totalBibles: 0,
      totalLanguages: 0,
      lastUpdated: new Date()
    };
  }
}

module.exports = {
  fetchBiblesList,
  downloadBible,
  getAvailableLanguages,
  searchBibles,
  clearCache,
  getCatalogStats,
  parseBibleInfo
};