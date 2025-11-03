const path = require('path');
const fs = require('fs');

// Lista de idiomas suportados com informações detalhadas
const SUPPORTED_LANGUAGES = [
  {
    code: 'pt',
    name: 'Português',
    nativeName: 'Português',
    flag: '🇧🇷',
    default: true
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'es',
    name: 'Español',
    nativeName: 'Español',
    flag: '🇪🇸'
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺'
  },
  {
    code: 'uk',
    name: 'Ukrainian',
    nativeName: 'Українська',
    flag: '🇺🇦'
  }
];

// Cache para traduções
const translationsCache = {};

/**
 * Carrega as traduções de um idioma
 * @param {string} language - Código do idioma
 * @returns {object} - Objeto com as traduções
 */
function loadTranslations(language) {
  if (translationsCache[language]) {
    return translationsCache[language];
  }
  
  try {
    const filePath = path.join(__dirname, '../../locales', language, 'translation.json');
    const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    translationsCache[language] = translations;
    return translations;
  } catch (error) {
    console.error(`Error loading translations for ${language}:`, error);
    // Fallback para português
    if (language !== 'pt') {
      return loadTranslations('pt');
    }
    return {};
  }
}

/**
 * Detecta o idioma preferido do usuário baseado no Accept-Language
 * @param {string} acceptLanguage - Header Accept-Language
 * @returns {string} - Código do idioma detectado
 */
function detectLanguageFromHeader(acceptLanguage) {
  if (!acceptLanguage) return 'pt';
  
  // Parse do header Accept-Language
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, quality = '1'] = lang.trim().split(';q=');
      return {
        code: code.split('-')[0].toLowerCase(),
        quality: parseFloat(quality)
      };
    })
    .sort((a, b) => b.quality - a.quality);
  
  // Encontrar primeiro idioma suportado
  for (const lang of languages) {
    const supported = SUPPORTED_LANGUAGES.find(sl => sl.code === lang.code);
    if (supported) {
      return supported.code;
    }
  }
  
  return 'pt'; // fallback
}

/**
 * Middleware simples para internacionalização
 */
function middleware(req, res, next) {
  let language = req.query.lng || req.cookies?.i18next;
  
  if (!language) {
    language = detectLanguageFromHeader(req.headers['accept-language']);
  }
  
  // Validar se o idioma é suportado
  const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === language);
  if (!isSupported) {
    language = 'pt';
  }
  
  // Carregar traduções
  const translations = loadTranslations(language);
  
  // Adicionar ao objeto request
  req.language = language;
  req.translations = translations;
  
  // Função helper para traduzir
  req.t = (key, options = {}) => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Retorna a chave se não encontrar tradução
      }
    }
    
    if (typeof value === 'string' && options) {
      // Simples interpolação
      return value.replace(/\{\{(\w+)\}\}/g, (match, key) => options[key] || match);
    }
    
    return value || key;
  };
  
  // Configurar cookie se necessário
  if (!req.cookies?.i18next || req.cookies.i18next !== language) {
    res.cookie('i18next', language, {
      maxAge: 10080 * 60 * 1000, // 7 dias
      httpOnly: false
    });
  }
  
  next();
}

/**
 * Middleware adicional para configurações de idioma
 */
function languageMiddleware(req, res, next) {
  // Este middleware agora é opcional, pois a lógica foi movida para o middleware principal
  next();
}

/**
 * Helper para traduzir textos
 * @param {object} req - Request object
 * @param {string} key - Chave de tradução
 * @param {object} options - Opções de interpolação
 * @returns {string} - Texto traduzido
 */
function translate(req, key, options = {}) {
  return req.t ? req.t(key, options) : key;
}

/**
 * Obter lista de idiomas suportados
 * @returns {Array} - Lista de idiomas
 */
function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

/**
 * Obter informações de um idioma específico
 * @param {string} code - Código do idioma
 * @returns {object|null} - Informações do idioma
 */
function getLanguageInfo(code) {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || null;
}

module.exports = {
  middleware,
  languageMiddleware,
  translate,
  getSupportedLanguages,
  getLanguageInfo,
  SUPPORTED_LANGUAGES,
  loadTranslations
};