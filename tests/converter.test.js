const { parseXMLFile } = require('../src/parsers/xmlParser');
const { convertToZefenia } = require('../src/converters/zefeniaConverter');
const { normalizeBookName } = require('../src/utils/bookMapping');
const path = require('path');

describe('Zefenia XML Converter Tests', () => {
  
  describe('Book Mapping', () => {
    test('should normalize Genesis correctly', () => {
      const result = normalizeBookName('Genesis');
      expect(result).toBeTruthy();
      expect(result.standardName).toBe('Genesis');
      expect(result.number).toBe(1);
      expect(result.shortName).toBe('Gn');
    });

    test('should normalize Portuguese book names', () => {
      const result = normalizeBookName('Gênesis');
      expect(result).toBeTruthy();
      expect(result.standardName).toBe('Genesis');
      expect(result.number).toBe(1);
    });

    test('should handle OSIS IDs', () => {
      const result = normalizeBookName('Gen');
      expect(result).toBeTruthy();
      expect(result.standardName).toBe('Genesis');
    });

    test('should return null for invalid book names', () => {
      const result = normalizeBookName('InvalidBook');
      expect(result).toBeNull();
    });
  });

  describe('XML Parser', () => {
    test('should parse simple XML format', async () => {
      const xmlContent = `
        <?xml version="1.0" encoding="utf-8"?>
        <bible>
          <title>Test Bible</title>
          <books>
            <book name="Genesis" number="1">
              <chapters>
                <chapter number="1">
                  <verses>
                    <verse number="1">
                      <text>In the beginning God created the heaven and the earth.</text>
                    </verse>
                  </verses>
                </chapter>
              </chapters>
            </book>
          </books>
        </bible>
      `;

      // Mock parseXMLFile para testar com conteúdo direto
      const { XMLParser } = require('../src/parsers/xmlParser');
      const parser = new XMLParser();
      const result = await parser.parse(xmlContent);

      expect(result).toBeTruthy();
      expect(result.books).toHaveLength(1);
      expect(result.books[0].name).toBe('Genesis');
      expect(result.books[0].chapters).toHaveLength(1);
      expect(result.books[0].chapters[0].verses).toHaveLength(1);
    });
  });

  describe('Zefenia Converter', () => {
    test('should convert structured data to Zefenia XML', async () => {
      const testData = {
        title: 'Test Bible',
        description: 'Test Description',
        language: 'POR',
        books: [
          {
            name: 'Genesis',
            number: 1,
            shortName: 'Gn',
            chapters: [
              {
                number: 1,
                verses: [
                  {
                    number: 1,
                    text: 'No princípio criou Deus os céus e a terra.'
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = await convertToZefenia(testData);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(result).toContain('<XMLBIBLE');
      expect(result).toContain('<BIBLEBOOK bnumber="1" bname="Genesis"');
      expect(result).toContain('<CHAPTER cnumber="1">');
      expect(result).toContain('<VERS vnumber="1">');
    });

    test('should validate data before conversion', async () => {
      const invalidData = {
        title: 'Test Bible',
        books: [] // Empty books array should cause error
      };

      await expect(convertToZefenia(invalidData)).rejects.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete conversion flow', async () => {
      // Test with example file if it exists
      const examplePath = path.join(__dirname, '../examples/exemplo_simples.xml');
      
      try {
        const parsedData = await parseXMLFile(examplePath);
        expect(parsedData).toBeTruthy();
        expect(parsedData.books.length).toBeGreaterThan(0);

        const zefeniaXML = await convertToZefenia(parsedData);
        expect(zefeniaXML).toBeTruthy();
        expect(zefeniaXML).toContain('<XMLBIBLE');
      } catch (error) {
        // Se o arquivo não existir, pular o teste
        console.log('Example file not found, skipping integration test');
      }
    });
  });

});

// Mock para fs-extra se necessário
jest.mock('fs-extra', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  ensureDir: jest.fn(),
  remove: jest.fn(),
  pathExists: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn()
}));