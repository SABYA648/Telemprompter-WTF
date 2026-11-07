import { readFileSync } from 'node:fs';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { docxToScript, markdownToScript, type XmlNode } from './docImport';

/** Node has no DOMParser, so the test reads the fixture XML into the small node shape the walker uses. */
function parseXml(xml: string): XmlNode {
  const namespaces: Record<string, string> = {};
  const root: XmlNode & { childNodes: XmlNode[] } = {
    nodeType: 9,
    textContent: null,
    childNodes: [],
  };
  const stack = [root];
  const decode = (value: string) =>
    value.replace(
      /&(amp|lt|gt|quot|apos);/g,
      (_, name: string) =>
        ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[name as 'amp'] ?? '',
    );
  for (const [, close, tag, attrs = '', self, text] of xml.matchAll(
    /<(\/?)([\w:.-]+)((?:\s+[\w:.-]+="[^"]*")*)\s*(\/?)>|([^<]+)/g,
  )) {
    const parent = stack.at(-1)!;
    if (text !== undefined) {
      parent.childNodes.push({ nodeType: 3, textContent: decode(text), childNodes: [] });
      continue;
    }
    if (close) {
      stack.pop();
      continue;
    }
    const attributes: Record<string, string> = Object.fromEntries(
      [...attrs.matchAll(/([\w:.-]+)="([^"]*)"/g)].map(([, k, v]) => [k!, decode(v ?? '')]),
    );
    for (const [key, value] of Object.entries(attributes))
      if (key.startsWith('xmlns:')) namespaces[key.slice(6)] = value;
    const [prefix, local] = tag!.includes(':') ? tag!.split(':') : ['', tag];
    const node: XmlNode & { childNodes: XmlNode[] } = {
      nodeType: 1,
      localName: local ?? null,
      namespaceURI: namespaces[prefix ?? ''] ?? null,
      childNodes: [],
      get textContent() {
        const all = (n: XmlNode): string =>
          n.nodeType === 3 ? (n.textContent ?? '') : Array.from(n.childNodes).map(all).join('');
        return all(this);
      },
      getAttributeNS: (namespace, name) =>
        Object.entries(attributes).find(
          ([key]) => key.endsWith(`:${name}`) && namespaces[key.split(':')[0]!] === namespace,
        )?.[1] ?? null,
    };
    parent.childNodes.push(node);
    if (!self) stack.push(node);
  }
  return root;
}

describe('docx import', () => {
  it('reads paragraphs from w:p and text from w:t in the fixture', () => {
    const zip = unzipSync(new Uint8Array(readFileSync('tests/fixtures/script.docx')));
    const xml = strFromU8(zip['word/document.xml']!);
    expect(docxToScript(parseXml(xml), 'script')).toEqual({
      title: 'Morning Routine Reel',
      body: [
        '# Hook',
        'Stop scrolling. This changed my mornings & my focus.',
        'Step one water first.\nStep two: light.',
        '# The routine',
        'Kept words only.',
        'Table cell line.',
      ].join('\n\n'),
    });
  });
  it('falls back to the file name when there is no Title paragraph', () => {
    const xml =
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Only line</w:t></w:r></w:p></w:body></w:document>';
    expect(docxToScript(parseXml(xml), 'notes')).toEqual({ title: 'notes', body: 'Only line' });
  });
});

describe('markdown import', () => {
  it('uses a leading H1 as the title and turns other headings into sections', () => {
    const result = markdownToScript(
      [
        '# My launch video',
        '',
        '## Hook',
        'Read **this** and _that_, see [the docs](https://example.com).',
        '',
        '- first point',
        '1. second point',
        '> quoted `code`',
        '---',
        '![img](a.png)Tail [pause]',
      ].join('\n'),
      'file',
    );
    expect(result).toEqual({
      title: 'My launch video',
      body: [
        '# Hook',
        'Read **this** and that, see the docs.',
        '',
        'first point',
        'second point',
        'quoted code',
        '',
        'Tail [pause]',
      ].join('\n'),
    });
  });
  it('keeps the file name when the file does not start with a heading', () => {
    expect(markdownToScript('Hello *world*\n# Part', 'notes')).toEqual({
      title: 'notes',
      body: 'Hello world\n# Part',
    });
  });
});
