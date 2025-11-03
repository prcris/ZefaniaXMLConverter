const { create } = require('xmlbuilder2');

/**
 * Conversor para formato Zefenia XML
 */
class ZefeniaConverter {
  constructor() {
    this.defaultInfo = {
      subject: 'Holy Bible',
      format: 'XML Bible Markup Language',
      title: 'Bíblia Sagrada',
      description: 'Convertida para formato Zefenia XML',
      language: 'POR',
      creator: 'Zefenia XML Converter',
      publisher: 'Conversor Automático',
      type: 'x-bible',
      version: '1',
      status: 'v',
      revision: '0'
    };
  }

  /**
   * Converte dados estruturados para XML Zefenia
   * @param {Object} bibleData - Dados da bíblia estruturados
   * @returns {string} - XML no formato Zefenia
   */
  convert(bibleData) {
    try {
      // Criar estrutura básica do XML
      const doc = create({ version: '1.0', encoding: 'utf-8' });
      
      // Adicionar comentários de cabeçalho
      doc.com('Visit the online documentation for Zefania XML Markup');
      doc.com('http://bgfdb.de/zefaniaxml/bml/');
      doc.com('Download another Zefania XML files from');
      doc.com('http://sourceforge.net/projects/zefania-sharp');

      // Elemento raiz XMLBIBLE
      const xmlBible = doc.ele('XMLBIBLE', {
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:noNamespaceSchemaLocation': 'zef2005.xsd',
        version: this.defaultInfo.version,
        status: this.defaultInfo.status,
        biblename: bibleData.title || this.defaultInfo.title,
        revision: this.defaultInfo.revision,
        type: this.defaultInfo.type
      });

      // Seção INFORMATION
      const information = xmlBible.ele('INFORMATION');
      information.ele('subject').txt(this.defaultInfo.subject);
      information.ele('format').txt(this.defaultInfo.format);
      information.ele('date').txt(new Date().toISOString().split('T')[0]);
      information.ele('title').txt(bibleData.title || this.defaultInfo.title);
      information.ele('description').txt(bibleData.description || this.defaultInfo.description);
      information.ele('language').txt(bibleData.language || this.defaultInfo.language);
      information.ele('creator').txt(this.defaultInfo.creator);
      information.ele('identifier').txt(bibleData.title || this.defaultInfo.title);
      information.ele('publisher').txt(this.defaultInfo.publisher);
      information.ele('contributors');
      information.ele('type');
      information.ele('source');
      information.ele('coverage');
      information.ele('rights');

      // Processar livros
      if (bibleData.books && Array.isArray(bibleData.books)) {
        // Ordenar livros por número
        const sortedBooks = bibleData.books.sort((a, b) => a.number - b.number);

        for (const book of sortedBooks) {
          if (!book.chapters || book.chapters.length === 0) {
            console.warn(`Livro ${book.name} não tem capítulos, pulando...`);
            continue;
          }

          // Elemento BIBLEBOOK
          const bibleBook = xmlBible.ele('BIBLEBOOK', {
            bnumber: book.number.toString(),
            bname: book.name,
            bsname: book.shortName || book.name.substring(0, 3)
          });

          // Ordenar capítulos por número
          const sortedChapters = book.chapters.sort((a, b) => a.number - b.number);

          for (const chapter of sortedChapters) {
            if (!chapter.verses || chapter.verses.length === 0) {
              console.warn(`Capítulo ${chapter.number} do livro ${book.name} não tem versículos, pulando...`);
              continue;
            }

            // Elemento CHAPTER
            const chapterElem = bibleBook.ele('CHAPTER', {
              cnumber: chapter.number.toString()
            });

            // Ordenar versículos por número
            const sortedVerses = chapter.verses.sort((a, b) => a.number - b.number);

            for (const verse of sortedVerses) {
              if (!verse.text || verse.text.trim() === '') {
                console.warn(`Versículo ${verse.number} do capítulo ${chapter.number} do livro ${book.name} está vazio, pulando...`);
                continue;
              }

              // Elemento VERS
              const verseElem = chapterElem.ele('VERS', {
                vnumber: verse.number.toString()
              });

              // Processar texto do versículo
              const processedText = this.processVerseText(verse.text);
              verseElem.txt(processedText);
            }
          }
        }
      }

      // Retornar XML como string
      return doc.end({ prettyPrint: true, indent: '  ' });
    } catch (error) {
      console.error('Erro na conversão para Zefenia XML:', error);
      throw new Error(`Erro na conversão: ${error.message}`);
    }
  }

  /**
   * Processa o texto do versículo para formato Zefenia
   * @param {string} text - Texto original do versículo
   * @returns {string} - Texto processado
   */
  processVerseText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Remover caracteres de controle e normalizar espaços
    let processed = text
      .replace(/[\r\n\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Remover marcações de versículo no início (como [1], (1), etc.)
    processed = processed.replace(/^\[?\d+\]?\s*/, '');
    processed = processed.replace(/^\(\d+\)\s*/, '');

    // Processar marcações especiais comuns
    processed = processed
      // Itálico
      .replace(/<i>(.*?)<\/i>/g, '<i>$1</i>')
      // Negrito (converter para itálico, pois Zefenia usa principalmente itálico)
      .replace(/<b>(.*?)<\/b>/g, '<i>$1</i>')
      .replace(/<strong>(.*?)<\/strong>/g, '<i>$1</i>')
      // Remover outras tags HTML não suportadas
      .replace(/<(?!\/?(i|I))[^>]*>/g, '')
      // Normalizar tags de itálico
      .replace(/<I>/g, '<i>')
      .replace(/<\/I>/g, '</i>');

    // Escapar caracteres especiais XML (exceto tags de formatação válidas)
    processed = processed
      .replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Restaurar tags de itálico válidas
      .replace(/&lt;i&gt;/g, '<i>')
      .replace(/&lt;\/i&gt;/g, '</i>');

    return processed;
  }

  /**
   * Valida os dados antes da conversão
   * @param {Object} bibleData - Dados da bíblia
   * @returns {boolean} - True se válido
   */
  validate(bibleData) {
    if (!bibleData || typeof bibleData !== 'object') {
      throw new Error('Dados da bíblia inválidos');
    }

    if (!bibleData.books || !Array.isArray(bibleData.books)) {
      throw new Error('Lista de livros não encontrada ou inválida');
    }

    if (bibleData.books.length === 0) {
      throw new Error('Nenhum livro encontrado nos dados');
    }

    // Validar estrutura básica de cada livro
    for (const book of bibleData.books) {
      if (!book.name || !book.number) {
        throw new Error(`Livro inválido encontrado: ${JSON.stringify(book)}`);
      }

      if (!book.chapters || !Array.isArray(book.chapters)) {
        throw new Error(`Livro ${book.name} não tem capítulos válidos`);
      }

      for (const chapter of book.chapters) {
        if (!chapter.number) {
          throw new Error(`Capítulo inválido no livro ${book.name}`);
        }

        if (!chapter.verses || !Array.isArray(chapter.verses)) {
          throw new Error(`Capítulo ${chapter.number} do livro ${book.name} não tem versículos válidos`);
        }

        for (const verse of chapter.verses) {
          if (!verse.number || !verse.text) {
            throw new Error(`Versículo inválido no capítulo ${chapter.number} do livro ${book.name}`);
          }
        }
      }
    }

    return true;
  }

  /**
   * Gera estatísticas dos dados convertidos
   * @param {Object} bibleData - Dados da bíblia
   * @returns {Object} - Estatísticas
   */
  generateStats(bibleData) {
    const stats = {
      books: 0,
      chapters: 0,
      verses: 0,
      characters: 0,
      words: 0
    };

    if (bibleData.books) {
      stats.books = bibleData.books.length;

      for (const book of bibleData.books) {
        if (book.chapters) {
          stats.chapters += book.chapters.length;

          for (const chapter of book.chapters) {
            if (chapter.verses) {
              stats.verses += chapter.verses.length;

              for (const verse of chapter.verses) {
                if (verse.text) {
                  stats.characters += verse.text.length;
                  stats.words += verse.text.split(/\s+/).length;
                }
              }
            }
          }
        }
      }
    }

    return stats;
  }
}

/**
 * Função principal para conversão para Zefenia XML
 * @param {Object} bibleData - Dados estruturados da bíblia
 * @returns {string} - XML no formato Zefenia
 */
async function convertToZefenia(bibleData) {
  try {
    const converter = new ZefeniaConverter();
    
    // Validar dados
    converter.validate(bibleData);
    
    // Gerar estatísticas
    const stats = converter.generateStats(bibleData);
    console.log('Estatísticas da conversão:', stats);
    
    // Converter para XML
    const xml = converter.convert(bibleData);
    
    console.log('Conversão para Zefenia XML concluída com sucesso');
    return xml;
    
  } catch (error) {
    console.error('Erro na conversão para Zefenia:', error);
    throw error;
  }
}

module.exports = {
  ZefeniaConverter,
  convertToZefenia
};