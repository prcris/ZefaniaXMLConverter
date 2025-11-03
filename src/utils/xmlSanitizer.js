/**
 * Utilitários para sanitização de XML antes de salvar/servir
 */

/**
 * Remove BOM UTF-8 e quaisquer espaços/quebras de linha antes do prólogo XML
 * e garante que a primeira linha seja um prólogo XML válido.
 *
 * - Remove BOM (\uFEFF)
 * - Recorta espaços/brancos no início
 * - Se existir conteúdo antes do prólogo, move o prólogo para o topo
 * - Se não houver prólogo, insere um padrão UTF-8
 *
 * @param {string} xmlString
 * @returns {string}
 */
function sanitizeXmlProlog(xmlString) {
  if (typeof xmlString !== 'string') return '';

  let s = xmlString;
  // Remove BOM se existir
  if (s.charCodeAt(0) === 0xFEFF) {
    s = s.slice(1);
  }

  // Remove espaços/brancos iniciais
  s = s.replace(/^\s+/, '');

  // Se já começa com prólogo, retorna
  if (s.startsWith('<?xml')) {
    return s;
  }

  // Procura prólogo existente mais abaixo
  const prologIdx = s.indexOf('<?xml');
  if (prologIdx > 0) {
    // Mantém apenas a partir do prólogo
    s = s.slice(prologIdx);
    return s;
  }

  // Se não houver prólogo, adiciona um
  const prolog = '<?xml version="1.0" encoding="UTF-8"?>\n';
  return prolog + s;
}

module.exports = { sanitizeXmlProlog };
