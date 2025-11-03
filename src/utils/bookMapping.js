// Mapeamento de livros bíblicos para padronização
// Suporta múltiplos formatos e idiomas

const BOOK_MAPPING = {
  // Antigo Testamento
  'Genesis': { number: 1, shortName: 'Gn', osisId: 'Gen', variants: ['Genesis', 'Gênesis', 'Gen', 'Ge'] },
  'Exodus': { number: 2, shortName: 'Ex', osisId: 'Exod', variants: ['Exodus', 'Êxodo', 'Exod', 'Ex'] },
  'Leviticus': { number: 3, shortName: 'Lv', osisId: 'Lev', variants: ['Leviticus', 'Levítico', 'Lev', 'Le'] },
  'Numbers': { number: 4, shortName: 'Nm', osisId: 'Num', variants: ['Numbers', 'Números', 'Num', 'Nu'] },
  'Deuteronomy': { number: 5, shortName: 'Dt', osisId: 'Deut', variants: ['Deuteronomy', 'Deuteronômio', 'Deut', 'De'] },
  'Joshua': { number: 6, shortName: 'Js', osisId: 'Josh', variants: ['Joshua', 'Josué', 'Josh', 'Jos'] },
  'Judges': { number: 7, shortName: 'Jz', osisId: 'Judg', variants: ['Judges', 'Juízes', 'Judg', 'Jdg'] },
  'Ruth': { number: 8, shortName: 'Rt', osisId: 'Ruth', variants: ['Ruth', 'Rute', 'Ru'] },
  '1 Samuel': { number: 9, shortName: '1Sm', osisId: '1Sam', variants: ['1 Samuel', '1Samuel', '1Sm', '1 Sam', 'I Samuel'] },
  '2 Samuel': { number: 10, shortName: '2Sm', osisId: '2Sam', variants: ['2 Samuel', '2Samuel', '2Sm', '2 Sam', 'II Samuel'] },
  '1 Kings': { number: 11, shortName: '1Rs', osisId: '1Kgs', variants: ['1 Kings', '1 Reis', '1Kings', '1Rs', '1 Re', 'I Kings'] },
  '2 Kings': { number: 12, shortName: '2Rs', osisId: '2Kgs', variants: ['2 Kings', '2 Reis', '2Kings', '2Rs', '2 Re', 'II Kings'] },
  '1 Chronicles': { number: 13, shortName: '1Cr', osisId: '1Chr', variants: ['1 Chronicles', '1 Crônicas', '1Chronicles', '1Cr', '1 Chr', 'I Chronicles'] },
  '2 Chronicles': { number: 14, shortName: '2Cr', osisId: '2Chr', variants: ['2 Chronicles', '2 Crônicas', '2Chronicles', '2Cr', '2 Chr', 'II Chronicles'] },
  'Ezra': { number: 15, shortName: 'Ed', osisId: 'Ezra', variants: ['Ezra', 'Esdras', 'Esd', 'Ez'] },
  'Nehemiah': { number: 16, shortName: 'Ne', osisId: 'Neh', variants: ['Nehemiah', 'Neemias', 'Neh', 'Ne'] },
  'Esther': { number: 17, shortName: 'Et', osisId: 'Esth', variants: ['Esther', 'Ester', 'Est', 'Es'] },
  'Job': { number: 18, shortName: 'Jó', osisId: 'Job', variants: ['Job', 'Jó'] },
  'Psalms': { number: 19, shortName: 'Sl', osisId: 'Ps', variants: ['Psalms', 'Salmos', 'Psalm', 'Ps', 'Sal'] },
  'Proverbs': { number: 20, shortName: 'Pv', osisId: 'Prov', variants: ['Proverbs', 'Provérbios', 'Prov', 'Pr'] },
  'Ecclesiastes': { number: 21, shortName: 'Ec', osisId: 'Eccl', variants: ['Ecclesiastes', 'Eclesiastes', 'Eccl', 'Ec'] },
  'Song of Songs': { number: 22, shortName: 'Ct', osisId: 'Song', variants: ['Song of Songs', 'Cantares', 'Song', 'Ct', 'Cantar dos Cantares'] },
  'Isaiah': { number: 23, shortName: 'Is', osisId: 'Isa', variants: ['Isaiah', 'Isaías', 'Isa', 'Is'] },
  'Jeremiah': { number: 24, shortName: 'Jr', osisId: 'Jer', variants: ['Jeremiah', 'Jeremias', 'Jer', 'Je'] },
  'Lamentations': { number: 25, shortName: 'Lm', osisId: 'Lam', variants: ['Lamentations', 'Lamentações', 'Lam', 'La'] },
  'Ezekiel': { number: 26, shortName: 'Ez', osisId: 'Ezek', variants: ['Ezekiel', 'Ezequiel', 'Ezek', 'Eze'] },
  'Daniel': { number: 27, shortName: 'Dn', osisId: 'Dan', variants: ['Daniel', 'Dan', 'Da'] },
  'Hosea': { number: 28, shortName: 'Os', osisId: 'Hos', variants: ['Hosea', 'Oséias', 'Hos', 'Ho'] },
  'Joel': { number: 29, shortName: 'Jl', osisId: 'Joel', variants: ['Joel', 'Jl'] },
  'Amos': { number: 30, shortName: 'Am', osisId: 'Amos', variants: ['Amos', 'Am'] },
  'Obadiah': { number: 31, shortName: 'Ob', osisId: 'Obad', variants: ['Obadiah', 'Obadias', 'Obad', 'Ob'] },
  'Jonah': { number: 32, shortName: 'Jn', osisId: 'Jonah', variants: ['Jonah', 'Jonas', 'Jon'] },
  'Micah': { number: 33, shortName: 'Mq', osisId: 'Mic', variants: ['Micah', 'Miquéias', 'Mic', 'Mi'] },
  'Nahum': { number: 34, shortName: 'Na', osisId: 'Nah', variants: ['Nahum', 'Naum', 'Nah', 'Na'] },
  'Habakkuk': { number: 35, shortName: 'Hc', osisId: 'Hab', variants: ['Habakkuk', 'Habacuque', 'Hab', 'Ha'] },
  'Zephaniah': { number: 36, shortName: 'Sf', osisId: 'Zeph', variants: ['Zephaniah', 'Sofonias', 'Zeph', 'Zep'] },
  'Haggai': { number: 37, shortName: 'Ag', osisId: 'Hag', variants: ['Haggai', 'Ageu', 'Hag'] },
  'Zechariah': { number: 38, shortName: 'Zc', osisId: 'Zech', variants: ['Zechariah', 'Zacarias', 'Zech', 'Zec'] },
  'Malachi': { number: 39, shortName: 'Ml', osisId: 'Mal', variants: ['Malachi', 'Malaquias', 'Mal'] },
  
  // Novo Testamento
  'Matthew': { number: 40, shortName: 'Mt', osisId: 'Matt', variants: ['Matthew', 'Mateus', 'Matt', 'Mt'] },
  'Mark': { number: 41, shortName: 'Mc', osisId: 'Mark', variants: ['Mark', 'Marcos', 'Mc', 'Mr'] },
  'Luke': { number: 42, shortName: 'Lc', osisId: 'Luke', variants: ['Luke', 'Lucas', 'Lc', 'Lu'] },
  'John': { number: 43, shortName: 'Jo', osisId: 'John', variants: ['John', 'João', 'Jo', 'Jn'] },
  'Acts': { number: 44, shortName: 'At', osisId: 'Acts', variants: ['Acts', 'Atos', 'Act', 'At'] },
  'Romans': { number: 45, shortName: 'Rm', osisId: 'Rom', variants: ['Romans', 'Romanos', 'Rom', 'Ro'] },
  '1 Corinthians': { number: 46, shortName: '1Co', osisId: '1Cor', variants: ['1 Corinthians', '1 Coríntios', '1Corinthians', '1Co', '1 Cor', 'I Corinthians'] },
  '2 Corinthians': { number: 47, shortName: '2Co', osisId: '2Cor', variants: ['2 Corinthians', '2 Coríntios', '2Corinthians', '2Co', '2 Cor', 'II Corinthians'] },
  'Galatians': { number: 48, shortName: 'Gl', osisId: 'Gal', variants: ['Galatians', 'Gálatas', 'Gal', 'Ga'] },
  'Ephesians': { number: 49, shortName: 'Ef', osisId: 'Eph', variants: ['Ephesians', 'Efésios', 'Eph', 'Ep'] },
  'Philippians': { number: 50, shortName: 'Fp', osisId: 'Phil', variants: ['Philippians', 'Filipenses', 'Phil', 'Php'] },
  'Colossians': { number: 51, shortName: 'Cl', osisId: 'Col', variants: ['Colossians', 'Colossenses', 'Col'] },
  '1 Thessalonians': { number: 52, shortName: '1Ts', osisId: '1Thess', variants: ['1 Thessalonians', '1 Tessalonicenses', '1Thessalonians', '1Ts', '1 Thess', 'I Thessalonians'] },
  '2 Thessalonians': { number: 53, shortName: '2Ts', osisId: '2Thess', variants: ['2 Thessalonians', '2 Tessalonicenses', '2Thessalonians', '2Ts', '2 Thess', 'II Thessalonians'] },
  '1 Timothy': { number: 54, shortName: '1Tm', osisId: '1Tim', variants: ['1 Timothy', '1 Timóteo', '1Timothy', '1Tm', '1 Tim', 'I Timothy'] },
  '2 Timothy': { number: 55, shortName: '2Tm', osisId: '2Tim', variants: ['2 Timothy', '2 Timóteo', '2Timothy', '2Tm', '2 Tim', 'II Timothy'] },
  'Titus': { number: 56, shortName: 'Tt', osisId: 'Titus', variants: ['Titus', 'Tito', 'Tt'] },
  'Philemon': { number: 57, shortName: 'Fm', osisId: 'Phlm', variants: ['Philemon', 'Filemom', 'Phlm', 'Phm'] },
  'Hebrews': { number: 58, shortName: 'Hb', osisId: 'Heb', variants: ['Hebrews', 'Hebreus', 'Heb', 'He'] },
  'James': { number: 59, shortName: 'Tg', osisId: 'Jas', variants: ['James', 'Tiago', 'Jas', 'Ja'] },
  '1 Peter': { number: 60, shortName: '1Pe', osisId: '1Pet', variants: ['1 Peter', '1 Pedro', '1Peter', '1Pe', '1 Pet', 'I Peter'] },
  '2 Peter': { number: 61, shortName: '2Pe', osisId: '2Pet', variants: ['2 Peter', '2 Pedro', '2Peter', '2Pe', '2 Pet', 'II Peter'] },
  '1 John': { number: 62, shortName: '1Jo', osisId: '1John', variants: ['1 John', '1 João', '1John', '1Jo', '1 Jn', 'I John'] },
  '2 John': { number: 63, shortName: '2Jo', osisId: '2John', variants: ['2 John', '2 João', '2John', '2Jo', '2 Jn', 'II John'] },
  '3 John': { number: 64, shortName: '3Jo', osisId: '3John', variants: ['3 John', '3 João', '3John', '3Jo', '3 Jn', 'III John'] },
  'Jude': { number: 65, shortName: 'Jd', osisId: 'Jude', variants: ['Jude', 'Judas', 'Jd'] },
  'Revelation': { number: 66, shortName: 'Ap', osisId: 'Rev', variants: ['Revelation', 'Apocalipse', 'Rev', 'Re', 'Ap'] }
};

// Criar mapa reverso para busca rápida
const REVERSE_MAPPING = {};
for (const [standardName, data] of Object.entries(BOOK_MAPPING)) {
  // Adicionar nome padrão
  REVERSE_MAPPING[standardName.toLowerCase()] = { standardName, ...data };
  
  // Adicionar variantes
  data.variants.forEach(variant => {
    REVERSE_MAPPING[variant.toLowerCase()] = { standardName, ...data };
  });
  
  // Adicionar OSIS ID
  REVERSE_MAPPING[data.osisId.toLowerCase()] = { standardName, ...data };
}

/**
 * Normaliza o nome de um livro bíblico
 * @param {string} bookName - Nome do livro a ser normalizado
 * @returns {Object|null} - Dados do livro normalizado ou null se não encontrado
 */
function normalizeBookName(bookName) {
  if (!bookName || typeof bookName !== 'string') {
    return null;
  }
  
  // Limpar e normalizar o nome
  const cleanName = bookName
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .toLowerCase();
  
  // Buscar no mapeamento reverso
  const found = REVERSE_MAPPING[cleanName];
  if (found) {
    return found;
  }
  
  // Tentativa de busca parcial (para casos como "1o Samuel", "1º Samuel", etc.)
  for (const [key, value] of Object.entries(REVERSE_MAPPING)) {
    if (key.includes(cleanName) || cleanName.includes(key)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Obtém informações de um livro pelo número
 * @param {number} bookNumber - Número do livro (1-66)
 * @returns {Object|null} - Dados do livro ou null se não encontrado
 */
function getBookByNumber(bookNumber) {
  for (const [standardName, data] of Object.entries(BOOK_MAPPING)) {
    if (data.number === bookNumber) {
      return { standardName, ...data };
    }
  }
  return null;
}

/**
 * Obtém todos os livros ordenados por número
 * @returns {Array} - Array com todos os livros ordenados
 */
function getAllBooks() {
  return Object.entries(BOOK_MAPPING)
    .map(([standardName, data]) => ({ standardName, ...data }))
    .sort((a, b) => a.number - b.number);
}

/**
 * Valida se um nome de livro é válido
 * @param {string} bookName - Nome do livro a validar
 * @returns {boolean} - True se válido, false caso contrário
 */
function isValidBook(bookName) {
  return normalizeBookName(bookName) !== null;
}

module.exports = {
  BOOK_MAPPING,
  normalizeBookName,
  getBookByNumber,
  getAllBooks,
  isValidBook
};