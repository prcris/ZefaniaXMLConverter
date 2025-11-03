const xmlbuilder2 = require('xmlbuilder2');

/**
 * Converte dados estruturados para formato Zefenia XML
 * @param {object} bibleData - Dados da bíblia estruturados
 * @returns {string} - XML no formato Zefenia
 */
function convertToZefenia(bibleData) {
  try {
    console.log('Iniciando conversão para Zefenia XML...');
    
    // Criar documento XML base
    const doc = xmlbuilder2.create({
      version: '1.0',
      encoding: 'UTF-8'
    });
    
    // Elemento raiz XMLBIBLE
    const xmlBible = doc.ele('XMLBIBLE', {
      xmlns: 'http://www.zefania.de/2009/xmlbible',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation': 'http://www.zefania.de/2009/xmlbible http://www.zefania.de/2009/xmlbible.xsd',
      biblename: bibleData.title || 'Bíblia Convertida',
      status: 'v',
      version: '2.6',
      revision: '1'
    });
    
    // Adicionar informações da bíblia
    const information = xmlBible.ele('INFORMATION');
    information.ele('title').txt(bibleData.title || 'Bíblia Convertida');
    information.ele('creator').txt('Zefenia XML Converter');
    information.ele('description').txt('Bíblia convertida automaticamente para formato Zefenia XML');
    information.ele('language').txt('pt');
    information.ele('date').txt(new Date().toISOString().split('T')[0]);
    information.ele('format').txt('Zefania XML Bible Markup Language');
    information.ele('identifier').txt(`converted-${Date.now()}`);
    information.ele('source').txt('Conversão automática');
    information.ele('coverage').txt('Texto bíblico completo');
    information.ele('rights').txt('Domínio público');
    
    // Adicionar livros
    if (bibleData.books && bibleData.books.length > 0) {
      for (const book of bibleData.books) {
        console.log(`Convertendo livro: ${book.name || book.id}`);
        
        const resolvedNumber = (book && Number.isInteger(book.number)) ? book.number : getBookNumber(book.name || book.id);
        const biblebook = xmlBible.ele('BIBLEBOOK', {
          bnumber: resolvedNumber,
          bname: book.name || book.id,
          bsname: getBookShortName(book.name || book.id)
        });
        
        // Adicionar capítulos
        if (book.chapters && book.chapters.length > 0) {
          for (const chapter of book.chapters) {
            const chapterElement = biblebook.ele('CHAPTER', {
              cnumber: chapter.number || 1
            });
            
            // Adicionar versículos
            if (chapter.verses && chapter.verses.length > 0) {
              for (const verse of chapter.verses) {
                if (verse.text && verse.text.trim()) {
                  chapterElement.ele('VERS', {
                    vnumber: verse.number || 1
                  }).txt(cleanVerseText(verse.text));
                }
              }
            }
          }
        }
      }
    }
    
    // Gerar XML
    const xmlString = doc.end({
      prettyPrint: true,
      indent: '  ',
      newline: '\n'
    });
    
    console.log('Conversão para Zefenia XML concluída');
    return xmlString;
    
  } catch (error) {
    console.error('Erro na conversão para Zefenia:', error);
    throw new Error(`Erro na conversão para Zefenia XML: ${error.message}`);
  }
}

/**
 * Obtém o número do livro bíblico
 * @param {string} bookName - Nome do livro
 * @returns {number} - Número do livro
 */
function getBookNumber(bookName) {
  const bookNumbers = {
    // Antigo Testamento
    'genesis': 1, 'gênesis': 1, 'gen': 1, 'gn': 1,
    'exodus': 2, 'êxodo': 2, 'exo': 2, 'ex': 2,
    'leviticus': 3, 'levítico': 3, 'lev': 3, 'lv': 3,
    'numbers': 4, 'números': 4, 'num': 4, 'nm': 4,
    'deuteronomy': 5, 'deuteronômio': 5, 'deu': 5, 'dt': 5,
    'joshua': 6, 'josué': 6, 'jos': 6, 'js': 6,
    'judges': 7, 'juízes': 7, 'jdg': 7, 'jz': 7,
    'ruth': 8, 'rute': 8, 'rut': 8, 'rt': 8,
    '1 samuel': 9, '1samuel': 9, '1sm': 9, '1s': 9,
    '2 samuel': 10, '2samuel': 10, '2sm': 10, '2s': 10,
    '1 kings': 11, '1 reis': 11, '1kings': 11, '1rs': 11,
    '2 kings': 12, '2 reis': 12, '2kings': 12, '2rs': 12,
    '1 chronicles': 13, '1 crônicas': 13, '1chronicles': 13, '1cr': 13,
    '2 chronicles': 14, '2 crônicas': 14, '2chronicles': 14, '2cr': 14,
    'ezra': 15, 'esdras': 15, 'ezr': 15, 'ed': 15,
    'nehemiah': 16, 'neemias': 16, 'neh': 16, 'ne': 16,
    'esther': 17, 'ester': 17, 'est': 17, 'et': 17,
    'job': 18, 'jó': 18, 'job': 18, 'jb': 18,
    'psalms': 19, 'salmos': 19, 'psa': 19, 'sl': 19,
    'proverbs': 20, 'provérbios': 20, 'pro': 20, 'pv': 20,
    'ecclesiastes': 21, 'eclesiastes': 21, 'ecc': 21, 'ec': 21,
    'song of solomon': 22, 'cantares': 22, 'song': 22, 'ct': 22,
    'isaiah': 23, 'isaías': 23, 'isa': 23, 'is': 23,
    'jeremiah': 24, 'jeremias': 24, 'jer': 24, 'jr': 24,
    'lamentations': 25, 'lamentações': 25, 'lam': 25, 'lm': 25,
    'ezekiel': 26, 'ezequiel': 26, 'eze': 26, 'ez': 26,
    'daniel': 27, 'daniel': 27, 'dan': 27, 'dn': 27,
    'hosea': 28, 'oséias': 28, 'hos': 28, 'os': 28,
    'joel': 29, 'joel': 29, 'joe': 29, 'jl': 29,
    'amos': 30, 'amós': 30, 'amo': 30, 'am': 30,
    'obadiah': 31, 'obadias': 31, 'oba': 31, 'ob': 31,
    'jonah': 32, 'jonas': 32, 'jon': 32, 'jn': 32,
    'micah': 33, 'miquéias': 33, 'mic': 33, 'mq': 33,
    'nahum': 34, 'naum': 34, 'nah': 34, 'na': 34,
    'habakkuk': 35, 'habacuque': 35, 'hab': 35, 'hc': 35,
    'zephaniah': 36, 'sofonias': 36, 'zep': 36, 'sf': 36,
    'haggai': 37, 'ageu': 37, 'hag': 37, 'ag': 37,
    'zechariah': 38, 'zacarias': 38, 'zec': 38, 'zc': 38,
    'malachi': 39, 'malaquias': 39, 'mal': 39, 'ml': 39,
    
    // Novo Testamento
    'matthew': 40, 'mateus': 40, 'mat': 40, 'mt': 40,
    'mark': 41, 'marcos': 41, 'mar': 41, 'mc': 41,
    'luke': 42, 'lucas': 42, 'luk': 42, 'lc': 42,
    'john': 43, 'joão': 43, 'joh': 43, 'jo': 43,
    'acts': 44, 'atos': 44, 'act': 44, 'at': 44,
    'romans': 45, 'romanos': 45, 'rom': 45, 'rm': 45,
    '1 corinthians': 46, '1 coríntios': 46, '1corinthians': 46, '1co': 46,
    '2 corinthians': 47, '2 coríntios': 47, '2corinthians': 47, '2co': 47,
    'galatians': 48, 'gálatas': 48, 'gal': 48, 'gl': 48,
    'ephesians': 49, 'efésios': 49, 'eph': 49, 'ef': 49,
    'philippians': 50, 'filipenses': 50, 'phi': 50, 'fp': 50,
    'colossians': 51, 'colossenses': 51, 'col': 51, 'cl': 51,
    '1 thessalonians': 52, '1 tessalonicenses': 52, '1thessalonians': 52, '1ts': 52,
    '2 thessalonians': 53, '2 tessalonicenses': 53, '2thessalonians': 53, '2ts': 53,
    '1 timothy': 54, '1 timóteo': 54, '1timothy': 54, '1tm': 54,
    '2 timothy': 55, '2 timóteo': 55, '2timothy': 55, '2tm': 55,
  'titus': 56, 'tito': 56, 'tit': 56, 'tt': 56,
  'philemon': 57, 'filemom': 57, 'filemon': 57, 'phm': 57, 'fm': 57,
    'hebrews': 58, 'hebreus': 58, 'heb': 58, 'hb': 58,
    'james': 59, 'tiago': 59, 'jam': 59, 'tg': 59,
    '1 peter': 60, '1 pedro': 60, '1peter': 60, '1pe': 60,
    '2 peter': 61, '2 pedro': 61, '2peter': 61, '2pe': 61,
    '1 john': 62, '1 joão': 62, '1john': 62, '1jo': 62,
    '2 john': 63, '2 joão': 63, '2john': 63, '2jo': 63,
    '3 john': 64, '3 joão': 64, '3john': 64, '3jo': 64,
    'jude': 65, 'judas': 65, 'jud': 65, 'jd': 65,
    'revelation': 66, 'apocalipse': 66, 'rev': 66, 'ap': 66
  };
  
  if (bookName == null) return 1;
  const normalized = String(bookName).toLowerCase().trim();
  // Se o nome já for um número válido em string
  if (/^\d+$/.test(normalized)) {
    const n = parseInt(normalized, 10);
    if (n >= 1 && n <= 66) return n;
  }
  return bookNumbers[normalized] || 1;
}

/**
 * Obtém o nome abreviado do livro
 * @param {string} bookName - Nome do livro
 * @returns {string} - Nome abreviado
 */
function getBookShortName(bookName) {
  const shortNames = {
    'genesis': 'Gen', 'gênesis': 'Gn',
    'exodus': 'Exo', 'êxodo': 'Ex',
    'leviticus': 'Lev', 'levítico': 'Lv',
    'numbers': 'Num', 'números': 'Nm',
    'deuteronomy': 'Deu', 'deuteronômio': 'Dt',
    'joshua': 'Jos', 'josué': 'Js',
    'judges': 'Jdg', 'juízes': 'Jz',
    'ruth': 'Rut', 'rute': 'Rt',
    '1 samuel': '1Sm', '1samuel': '1Sm',
    '2 samuel': '2Sm', '2samuel': '2Sm',
    '1 kings': '1Ki', '1 reis': '1Rs',
    '2 kings': '2Ki', '2 reis': '2Rs',
    '1 chronicles': '1Ch', '1 crônicas': '1Cr',
    '2 chronicles': '2Ch', '2 crônicas': '2Cr',
    'ezra': 'Ezr', 'esdras': 'Ed',
    'nehemiah': 'Neh', 'neemias': 'Ne',
    'esther': 'Est', 'ester': 'Et',
    'job': 'Job', 'jó': 'Jó',
    'psalms': 'Psa', 'salmos': 'Sl',
    'proverbs': 'Pro', 'provérbios': 'Pv',
    'ecclesiastes': 'Ecc', 'eclesiastes': 'Ec',
    'song of solomon': 'Sng', 'cantares': 'Ct',
    'isaiah': 'Isa', 'isaías': 'Is',
    'jeremiah': 'Jer', 'jeremias': 'Jr',
    'lamentations': 'Lam', 'lamentações': 'Lm',
    'ezekiel': 'Eze', 'ezequiel': 'Ez',
    'daniel': 'Dan', 'daniel': 'Dn',
    'hosea': 'Hos', 'oséias': 'Os',
    'joel': 'Joe', 'joel': 'Jl',
    'amos': 'Amo', 'amós': 'Am',
    'obadiah': 'Oba', 'obadias': 'Ob',
    'jonah': 'Jon', 'jonas': 'Jn',
    'micah': 'Mic', 'miquéias': 'Mq',
    'nahum': 'Nah', 'naum': 'Na',
    'habakkuk': 'Hab', 'habacuque': 'Hc',
    'zephaniah': 'Zep', 'sofonias': 'Sf',
    'haggai': 'Hag', 'ageu': 'Ag',
    'zechariah': 'Zec', 'zacarias': 'Zc',
    'malachi': 'Mal', 'malaquias': 'Ml',
    'matthew': 'Mat', 'mateus': 'Mt',
    'mark': 'Mar', 'marcos': 'Mc',
    'luke': 'Luk', 'lucas': 'Lc',
    'john': 'Joh', 'joão': 'Jo',
    'acts': 'Act', 'atos': 'At',
    'romans': 'Rom', 'romanos': 'Rm',
    '1 corinthians': '1Co', '1 coríntios': '1Co',
    '2 corinthians': '2Co', '2 coríntios': '2Co',
    'galatians': 'Gal', 'gálatas': 'Gl',
    'ephesians': 'Eph', 'efésios': 'Ef',
    'philippians': 'Phi', 'filipenses': 'Fp',
    'colossians': 'Col', 'colossenses': 'Cl',
    '1 thessalonians': '1Th', '1 tessalonicenses': '1Ts',
    '2 thessalonians': '2Th', '2 tessalonicenses': '2Ts',
    '1 timothy': '1Ti', '1 timóteo': '1Tm',
    '2 timothy': '2Ti', '2 timóteo': '2Tm',
    'titus': 'Tit', 'tito': 'Tt',
    'philemon': 'Phm', 'filemom': 'Fm',
    'hebrews': 'Heb', 'hebreus': 'Hb',
    'james': 'Jam', 'tiago': 'Tg',
    '1 peter': '1Pe', '1 pedro': '1Pe',
    '2 peter': '2Pe', '2 pedro': '2Pe',
    '1 john': '1Jo', '1 joão': '1Jo',
    '2 john': '2Jo', '2 joão': '2Jo',
    '3 john': '3Jo', '3 joão': '3Jo',
    'jude': 'Jud', 'judas': 'Jd',
    'revelation': 'Rev', 'apocalipse': 'Ap'
  };
  
  const normalized = bookName.toLowerCase().trim();
  return shortNames[normalized] || bookName.substring(0, 3);
}

/**
 * Limpa o texto do versículo removendo tags e caracteres especiais
 * @param {string} text - Texto do versículo
 * @returns {string} - Texto limpo
 */
function cleanVerseText(text) {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, '') // Remove tags HTML/XML
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

module.exports = {
  convertToZefenia,
  getBookNumber,
  getBookShortName,
  cleanVerseText
};