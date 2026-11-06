// Writes tests/fixtures/script.docx, the Word fixture used by the docx import tests.
import { writeFileSync } from 'node:fs';
import { strToU8, zipSync } from 'fflate';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const p = (runs, style) =>
  `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}${runs}</w:p>`;
const r = (text, bold = false) =>
  `<w:r>${bold ? '<w:rPr><w:b/></w:rPr>' : ''}<w:t xml:space="preserve">${text}</w:t></w:r>`;
const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}"><w:body>
${p(r('Morning Routine Reel'), 'Title')}
${p(r('Hook'), 'Heading1')}
${p(r('Stop scrolling. ') + r('This changed my mornings', true) + r(' &amp; my focus.'))}
${p('')}
${p(r('Step one') + '<w:r><w:tab/></w:r>' + r('water first.') + '<w:r><w:br/></w:r>' + r('Step two: light.'))}
${p(r('The routine'), 'Heading2')}
${p('<w:del w:id="1" w:author="a"><w:r><w:delText>removed words</w:delText></w:r></w:del>' + r('Kept words only.'))}
<w:tbl><w:tr><w:tc>${p(r('Table cell line.'))}</w:tc></w:tr></w:tbl>
<w:sectPr/>
</w:body></w:document>`;
const files = {
  '[Content_Types].xml': strToU8(
    `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
  ),
  '_rels/.rels': strToU8(
    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
  ),
  'word/document.xml': strToU8(document),
};
writeFileSync(
  new URL('../tests/fixtures/script.docx', import.meta.url),
  zipSync(files, { mtime: new Date('2026-11-06T00:00:00Z') }),
);
