const fs = require('fs-extra');
const xml2js = require('xml2js');
const { normalizeBookName } = require('../utils/bookMapping');

/**
 * Parser XML genérico para diferentes formatos de Bíblia
 */
class XMLParser {
  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      trim: true,
      normalize: true,
      normalizeTags: true,
      mergeAttrs: true
    });
  }

  /**
   * Detecta o formato do XML
   * @param {Object} xmlData - Dados XML parseados
   * @returns {string} - Tipo de formato detectado
   */
  detectFormat(xmlData) {
    // Formato Zefenia
    if (xmlData.xmlbible || xmlData.XMLBIBLE) {
      return 'zefenia';
    }
    
    // Formato OSIS
    if (xmlData.osis || (xmlData.osisText && xmlData.osisText.div)) {
      return 'osis';
    }
    
    // Formato simples com estrutura de books
    if (xmlData.bible || xmlData.Bible) {
      return 'simple';
    }
    
    // Formato com root tag 'books'
    if (xmlData.books) {
      return 'books';
    }
    
    // Formato de array de livros
    if (Array.isArray(xmlData) && xmlData.length > 0 && xmlData[0].book) {
      return 'array';
    }
    
    return 'unknown';
  }

  /**
   * Extrai dados de acordo com o formato Zefenia
   * @param {Object} xmlData - Dados XML
   * @returns {Object} - Dados estruturados
   */
  parseZefeniaFormat(xmlData) {
    const bibleData = xmlData.xmlbible || xmlData.XMLBIBLE;
    const result = {
      title: '',
      description: '',
      language: 'POR',
      books: []
    };

    // Extrair informações gerais
    if (bibleData.information || bibleData.INFORMATION) {
      const info = bibleData.information || bibleData.INFORMATION;
      result.title = info.title || info.biblename || '';
      result.description = info.description || '';
      result.language = info.language || 'POR';
    }

    // Extrair livros
    const books = bibleData.biblebook || bibleData.BIBLEBOOK;
    const booksArray = Array.isArray(books) ? books : [books];

    for (const book of booksArray) {
      if (!book) continue;

      const bookData = {
        name: book.bname || book.name || '',
        number: parseInt(book.bnumber) || 0,
        shortName: book.bsname || '',
        chapters: []
      };

      // Normalizar nome do livro
      const normalized = normalizeBookName(bookData.name);
      if (normalized) {
        bookData.name = normalized.standardName;
        bookData.number = normalized.number;
        bookData.shortName = normalized.shortName;
      }

      // Extrair capítulos
      const chapters = book.chapter || book.CHAPTER;
      const chaptersArray = Array.isArray(chapters) ? chapters : [chapters];

      for (const chapter of chaptersArray) {
        if (!chapter) continue;

        const chapterData = {
          number: parseInt(chapter.cnumber) || 0,
          verses: []
        };

        // Extrair versículos
        const verses = chapter.vers || chapter.VERS;
        const versesArray = Array.isArray(verses) ? verses : [verses];

        for (const verse of versesArray) {
          if (!verse) continue;

          const verseData = {
            number: parseInt(verse.vnumber) || 0,
            text: typeof verse === 'string' ? verse : (verse._ || verse.text || '')
          };

          chapterData.verses.push(verseData);
        }

        bookData.chapters.push(chapterData);
      }

      result.books.push(bookData);
    }

    return result;
  }

  /**
   * Extrai dados de acordo com o formato OSIS
   * @param {Object} xmlData - Dados XML
   * @returns {Object} - Dados estruturados
   */
  parseOSISFormat(xmlData) {
    const result = {
      title: 'OSIS Bible',
      description: '',
      language: 'POR',
      books: []
    };

    let osisData = xmlData.osis || xmlData;
    if (osisData.osisText) {
      osisData = osisData.osisText;
    }

    // Extrair informações do header
    if (osisData.header) {
      const work = osisData.header.work;
      if (work) {
        result.title = work.title || result.title;
        result.description = work.description || '';
        result.language = work.language || 'POR';
      }
    }

    // Processar divisões (livros)
    const divs = osisData.div || [];
    const divsArray = Array.isArray(divs) ? divs : [divs];

    for (const div of divsArray) {
      if (!div || div.type !== 'book') continue;

      const bookData = {
        name: '',
        number: 0,
        shortName: '',
        chapters: []
      };

      // Extrair nome do livro
      if (div.title) {
        bookData.name = typeof div.title === 'string' ? div.title : div.title._;
      }

      // Normalizar usando OSIS ID
      if (div.osisID) {
        const normalized = normalizeBookName(div.osisID);
        if (normalized) {
          bookData.name = normalized.standardName;
          bookData.number = normalized.number;
          bookData.shortName = normalized.shortName;
        }
      }

      // Processar capítulos
      const chapters = div.chapter || [];
      const chaptersArray = Array.isArray(chapters) ? chapters : [chapters];

      for (const chapter of chaptersArray) {
        if (!chapter) continue;

        const chapterData = {
          number: parseInt(chapter.osisID?.split('.').pop()) || 0,
          verses: []
        };

        // Processar versículos (milestone format)
        this.processOSISVerses(chapter, chapterData.verses);

        if (chapterData.verses.length > 0) {
          bookData.chapters.push(chapterData);
        }
      }

      if (bookData.chapters.length > 0) {
        result.books.push(bookData);
      }
    }

    return result;
  }

  /**
   * Processa versículos no formato OSIS milestone
   * @param {Object} chapter - Dados do capítulo
   * @param {Array} verses - Array para armazenar versículos
   */
  processOSISVerses(chapter, verses) {
    // Implementação simplificada para milestone verses
    if (chapter.verse) {
      const versesData = Array.isArray(chapter.verse) ? chapter.verse : [chapter.verse];
      
      for (const verse of versesData) {
        if (!verse) continue;

        const verseData = {
          number: parseInt(verse.n) || parseInt(verse.osisID?.split('.').pop()) || 0,
          text: ''
        };

        // Extrair texto do versículo
        if (typeof verse === 'string') {
          verseData.text = verse;
        } else if (verse._) {
          verseData.text = verse._;
        } else if (verse.w) {
          // Processar palavras com Strong's numbers
          const words = Array.isArray(verse.w) ? verse.w : [verse.w];
          verseData.text = words.map(w => typeof w === 'string' ? w : w._).join(' ');
        }

        if (verseData.text && verseData.number > 0) {
          verses.push(verseData);
        }
      }
    }
  }

  /**
   * Extrai dados de acordo com formato simples
   * @param {Object} xmlData - Dados XML
   * @returns {Object} - Dados estruturados
   */
  parseSimpleFormat(xmlData) {
    const bibleData = xmlData.bible || xmlData.Bible;
    const result = {
      title: bibleData.title || 'Bíblia',
      description: bibleData.description || '',
      language: bibleData.language || 'POR',
      books: []
    };

    const books = bibleData.books || bibleData.book || [];
    const booksArray = Array.isArray(books) ? books : [books];

    for (const book of booksArray) {
      if (!book) continue;

      const bookData = {
        name: book.name || '',
        number: parseInt(book.number) || 0,
        shortName: book.shortName || '',
        chapters: []
      };

      const normalized = normalizeBookName(bookData.name);
      if (normalized) {
        bookData.name = normalized.standardName;
        bookData.number = normalized.number;
        bookData.shortName = normalized.shortName;
      }

      const chapters = book.chapters || book.chapter || [];
      const chaptersArray = Array.isArray(chapters) ? chapters : [chapters];

      for (const chapter of chaptersArray) {
        if (!chapter) continue;

        const chapterData = {
          number: parseInt(chapter.number) || 0,
          verses: []
        };

        const verses = chapter.verses || chapter.verse || [];
        const versesArray = Array.isArray(verses) ? verses : [verses];

        for (const verse of versesArray) {
          if (!verse) continue;

          const verseData = {
            number: parseInt(verse.number) || 0,
            text: verse.text || verse._ || ''
          };

          chapterData.verses.push(verseData);
        }

        bookData.chapters.push(chapterData);
      }

      result.books.push(bookData);
    }

    return result;
  }

  /**
   * Parse principal do arquivo XML
   * @param {string} xmlContent - Conteúdo XML como string
   * @returns {Object} - Dados estruturados
   */
  async parse(xmlContent) {
    try {
      const xmlData = await this.parser.parseStringPromise(xmlContent);
      const format = this.detectFormat(xmlData);

      console.log(`Formato detectado: ${format}`);

      switch (format) {
        case 'zefenia':
          return this.parseZefeniaFormat(xmlData);
        case 'osis':
          return this.parseOSISFormat(xmlData);
        case 'simple':
        case 'books':
          return this.parseSimpleFormat(xmlData);
        default:
          throw new Error(`Formato XML não suportado: ${format}`);
      }
    } catch (error) {
      console.error('Erro no parse XML:', error);
      throw new Error(`Erro ao processar XML: ${error.message}`);
    }
  }
}

/**
 * Função principal para parsing de arquivo XML
 * @param {string} filePath - Caminho para o arquivo XML
 * @returns {Object} - Dados estruturados da Bíblia
 */
async function parseXMLFile(filePath) {
  try {
    const xmlContent = await fs.readFile(filePath, 'utf8');
    const parser = new XMLParser();
    return await parser.parse(xmlContent);
  } catch (error) {
    console.error('Erro ao ler arquivo XML:', error);
    throw new Error(`Erro ao processar arquivo: ${error.message}`);
  }
}

module.exports = {
  XMLParser,
  parseXMLFile
};