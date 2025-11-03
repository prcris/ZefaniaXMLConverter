const fs = require('fs-extra');
const xml2js = require('xml2js');
const path = require('path');
const { normalizeBookName } = require('./bookMapping');

// Mapeamento de números para nomes de livros da Bíblia
const BOOK_NAMES = {
  // Antigo Testamento
  1: 'Gênesis', 2: 'Êxodo', 3: 'Levítico', 4: 'Números', 5: 'Deuteronômio',
  6: 'Josué', 7: 'Juízes', 8: 'Rute', 9: '1 Samuel', 10: '2 Samuel',
  11: '1 Reis', 12: '2 Reis', 13: '1 Crônicas', 14: '2 Crônicas', 15: 'Esdras',
  16: 'Neemias', 17: 'Ester', 18: 'Jó', 19: 'Salmos', 20: 'Provérbios',
  21: 'Eclesiastes', 22: 'Cantares', 23: 'Isaías', 24: 'Jeremias', 25: 'Lamentações',
  26: 'Ezequiel', 27: 'Daniel', 28: 'Oséias', 29: 'Joel', 30: 'Amós',
  31: 'Obadias', 32: 'Jonas', 33: 'Miquéias', 34: 'Naum', 35: 'Habacuque',
  36: 'Sofonias', 37: 'Ageu', 38: 'Zacarias', 39: 'Malaquias',
  
  // Novo Testamento
  40: 'Mateus', 41: 'Marcos', 42: 'Lucas', 43: 'João', 44: 'Atos',
  45: 'Romanos', 46: '1 Coríntios', 47: '2 Coríntios', 48: 'Gálatas', 49: 'Efésios',
  50: 'Filipenses', 51: 'Colossenses', 52: '1 Tessalonicenses', 53: '2 Tessalonicenses', 54: '1 Timóteo',
  55: '2 Timóteo', 56: 'Tito', 57: 'Filemon', 58: 'Hebreus', 59: 'Tiago',
  60: '1 Pedro', 61: '2 Pedro', 62: '1 João', 63: '2 João', 64: '3 João',
  65: 'Judas', 66: 'Apocalipse'
};

/**
 * Obtém o nome do livro pelo número
 * @param {number} number - Número do livro
 * @returns {string} - Nome do livro
 */
function getBookNameByNumber(number) {
  return BOOK_NAMES[number] || null;
}

/**
 * Parse de arquivo XML de bíblia
 * @param {string} filePath - Caminho para o arquivo XML
 * @returns {object} - Dados estruturados da bíblia
 */
async function parseXML(filePath) {
  try {
    console.log(`Lendo arquivo: ${filePath}`);
    
    // Ler conteúdo do arquivo
    const xmlContent = await fs.readFile(filePath, 'utf8');
    
    // Parse XML
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true
    });
    
    const result = await parser.parseStringPromise(xmlContent);
    
    // Detectar formato e processar
    const bibleData = detectAndParse(result);
    
    console.log(`Parse concluído: ${bibleData.books.length} livros encontrados`);
    
    return bibleData;
    
  } catch (error) {
    console.error('Erro no parse XML:', error);
    throw new Error(`Erro ao processar arquivo XML: ${error.message}`);
  }
}

/**
 * Detecta o formato do XML e faz o parse apropriado
 * @param {object} xmlData - Dados XML parseados
 * @returns {object} - Dados estruturados
 */
function detectAndParse(xmlData) {
  // Verificar se é formato Zefenia
  if (xmlData.XMLBIBLE || xmlData.xmlbible) {
    return parseZefeniaFormat(xmlData);
  }
  
  // Verificar se é formato OSIS
  if (xmlData.osis) {
    return parseOsisFormat(xmlData);
  }
  
  // Verificar formato simples
  if (xmlData.bible || xmlData.BIBLE) {
    return parseSimpleFormat(xmlData);
  }
  
  // Tentar detectar automaticamente
  const rootKeys = Object.keys(xmlData);
  console.log('Chaves raiz encontradas:', rootKeys);
  
  // Fallback para formato simples
  return parseSimpleFormat(xmlData);
}

/**
 * Parse formato Zefenia XML
 * @param {object} xmlData - Dados XML
 * @returns {object} - Dados estruturados
 */
function parseZefeniaFormat(xmlData) {
  const bible = xmlData.XMLBIBLE || xmlData.xmlbible;
  const books = [];
  
  if (bible.BIBLEBOOK) {
    const bibleBooks = Array.isArray(bible.BIBLEBOOK) ? bible.BIBLEBOOK : [bible.BIBLEBOOK];
    
    for (const book of bibleBooks) {
      const chapters = [];
      
      if (book.CHAPTER) {
        const bookChapters = Array.isArray(book.CHAPTER) ? book.CHAPTER : [book.CHAPTER];
        
        for (const chapter of bookChapters) {
          const verses = [];
          
          if (chapter.VERS) {
            const chapterVerses = Array.isArray(chapter.VERS) ? chapter.VERS : [chapter.VERS];
            
            for (const verse of chapterVerses) {
              verses.push({
                number: parseInt(verse.vnumber || verse.number || verses.length + 1),
                text: verse._ || verse.text || ''
              });
            }
          }
          
          chapters.push({
            number: parseInt(chapter.cnumber || chapter.number || chapters.length + 1),
            verses: verses
          });
        }
      }
      
      books.push({
        id: book.bname || book.name || book.bnumber,
        name: normalizeBookName(book.bname || book.name || ''),
        chapters: chapters
      });
    }
  }
  
  return {
    title: bible.biblename || 'Bíblia',
    books: books
  };
}

/**
 * Parse formato OSIS
 * @param {object} xmlData - Dados XML
 * @returns {object} - Dados estruturados
 */
function parseOsisFormat(xmlData) {
  const osis = xmlData.osis;
  const books = [];
  
  if (osis.osisText && osis.osisText.div) {
    const divs = Array.isArray(osis.osisText.div) ? osis.osisText.div : [osis.osisText.div];
    
    for (const div of divs) {
      if (div.type === 'book' && div.chapter) {
        const chapters = [];
        const bookChapters = Array.isArray(div.chapter) ? div.chapter : [div.chapter];
        
        for (const chapter of bookChapters) {
          const verses = [];
          
          if (chapter.verse) {
            const chapterVerses = Array.isArray(chapter.verse) ? chapter.verse : [chapter.verse];
            
            for (const verse of chapterVerses) {
              verses.push({
                number: parseInt(verse.n || verse.osisID?.split('.').pop() || verses.length + 1),
                text: verse._ || verse.content || ''
              });
            }
          }
          
          chapters.push({
            number: parseInt(chapter.n || chapter.osisID?.split('.').pop() || chapters.length + 1),
            verses: verses
          });
        }
        
        books.push({
          id: div.osisID || div.n,
          name: normalizeBookName(div.title || div.osisID || ''),
          chapters: chapters
        });
      }
    }
  }
  
  return {
    title: osis.osisText?.title || 'Bíblia OSIS',
    books: books
  };
}

/**
 * Parse formato simples
 * @param {object} xmlData - Dados XML
 * @returns {object} - Dados estruturados
 */
function parseSimpleFormat(xmlData) {
  const books = [];
  
  // Tentar diferentes estruturas
  const rootElement = xmlData.bible || xmlData.BIBLE || xmlData;
  
  console.log('Estrutura do XML:', Object.keys(rootElement));
  
  // Verificar se tem testamentos
  if (rootElement.testament) {
    const testaments = Array.isArray(rootElement.testament) ? rootElement.testament : [rootElement.testament];
    
    for (const testament of testaments) {
      console.log(`Processando testamento: ${testament.name}`);
      
      if (testament.book) {
        const testamentBooks = Array.isArray(testament.book) ? testament.book : [testament.book];
        
        for (const book of testamentBooks) {
          const parsedBook = parseBookElement(book);
          if (parsedBook && parsedBook.chapters.length > 0) {
            books.push(parsedBook);
          }
        }
      }
    }
  }
  // Estrutura direta com livros
  else if (rootElement.book || rootElement.BOOK) {
    const bibleBooks = Array.isArray(rootElement.book || rootElement.BOOK) 
      ? (rootElement.book || rootElement.BOOK) 
      : [rootElement.book || rootElement.BOOK];
    
    for (const book of bibleBooks) {
      const parsedBook = parseBookElement(book);
      if (parsedBook && parsedBook.chapters.length > 0) {
        books.push(parsedBook);
      }
    }
  }
  
  console.log(`Total de livros encontrados: ${books.length}`);
  
  return {
    title: rootElement.translation || rootElement.title || rootElement.name || 'Bíblia',
    books: books
  };
}

/**
 * Parse um elemento book individual
 * @param {object} book - Elemento book do XML
 * @returns {object} - Livro parseado
 */
function parseBookElement(book) {
  const chapters = [];
  
  if (book.chapter || book.CHAPTER) {
    const bookChapters = Array.isArray(book.chapter || book.CHAPTER) 
      ? (book.chapter || book.CHAPTER) 
      : [book.chapter || book.CHAPTER];
    
    for (const chapter of bookChapters) {
      const verses = [];
      
      if (chapter.verse || chapter.VERSE) {
        const chapterVerses = Array.isArray(chapter.verse || chapter.VERSE) 
          ? (chapter.verse || chapter.VERSE) 
          : [chapter.verse || chapter.VERSE];
        
        for (const verse of chapterVerses) {
          verses.push({
            number: parseInt(verse.number || verse.n || verse.id || verses.length + 1),
            text: verse.text || verse._ || verse.content || (typeof verse === 'string' ? verse : '')
          });
        }
      }
      
      if (verses.length > 0) {
        chapters.push({
          number: parseInt(chapter.number || chapter.n || chapter.id || chapters.length + 1),
          verses: verses
        });
      }
    }
  }
  
  if (chapters.length > 0) {
    // Mapear número do livro para nome usando bookMapping
    const bookNumber = parseInt(book.number || book.id || 0);
    const bookName = getBookNameByNumber(bookNumber) || `Livro ${bookNumber}`;
    
    return {
      id: book.id || book.name || book.title || bookNumber.toString(),
      name: bookName,
      number: bookNumber,
      chapters: chapters
    };
  }
  
  return null;
}

module.exports = {
  parseXML,
  detectAndParse,
  parseZefeniaFormat,
  parseOsisFormat,
  parseSimpleFormat,
  parseBookElement,
  getBookNameByNumber
};