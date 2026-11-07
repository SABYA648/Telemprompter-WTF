/**
 * Script import from `.txt`, `.md` and `.docx` (M11). `.docx` text comes from
 * `word/document.xml`: paragraphs from `w:p`, text from `w:t`. `fflate` loads only on import.
 */

export interface ImportedScript {
  title: string;
  body: string;
}
export const IMPORT_ACCEPT = '.txt,.md,.markdown,.docx,text/plain,text/markdown';
const MAX_BYTES = 5 * 1024 * 1024;
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/** The subset of the DOM that the `.docx` walker reads, so tests can feed it a parsed fixture. */
export interface XmlNode {
  nodeType: number;
  localName?: string | null;
  namespaceURI?: string | null;
  textContent: string | null;
  childNodes: ArrayLike<XmlNode>;
  getAttributeNS?(namespace: string | null, name: string): string | null;
}

const isW = (node: XmlNode, name: string) =>
  node.nodeType === 1 && node.localName === name && (!node.namespaceURI || node.namespaceURI === W);
function* elements(node: XmlNode): Generator<XmlNode> {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType !== 1) continue;
    yield child;
    yield* elements(child);
  }
}
function paragraphText(paragraph: XmlNode): string {
  let text = '';
  for (const node of elements(paragraph)) {
    if (isW(node, 't')) text += node.textContent ?? '';
    else if (isW(node, 'tab')) text += ' ';
    else if (isW(node, 'br') || isW(node, 'cr')) text += '\n';
  }
  return text.replace(/[ \t]+/g, ' ').trim();
}
function paragraphStyle(paragraph: XmlNode): string {
  for (const node of elements(paragraph))
    if (isW(node, 'pStyle')) return node.getAttributeNS?.(W, 'val') ?? '';
  return '';
}

/** Turn a parsed `word/document.xml` into script markup. Headings become `# ` sections. */
export function docxToScript(document: XmlNode, fallbackTitle: string): ImportedScript {
  let title = '';
  const blocks: string[] = [];
  for (const node of elements(document)) {
    if (!isW(node, 'p')) continue;
    const text = paragraphText(node);
    if (!text) continue;
    const style = paragraphStyle(node);
    if (/^title$/i.test(style) && !title) title = text;
    else if (/^(heading\s?\d|title|subtitle)$/i.test(style))
      blocks.push(`# ${text.replace(/\n/g, ' ')}`);
    else blocks.push(text);
  }
  return { title: title || fallbackTitle, body: blocks.join('\n\n') };
}

/** Markdown to script markup: headings become sections, bold stays emphasis, the rest is text. */
export function markdownToScript(markdown: string, fallbackTitle: string): ImportedScript {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  let title = '';
  const firstText = lines.findIndex((line) => line.trim());
  const heading = lines[firstText]?.match(/^#\s+(.+?)\s*#*\s*$/);
  if (heading) {
    title = heading[1] ?? '';
    lines.splice(firstText, 1);
  }
  const out: string[] = [];
  for (const raw of lines) {
    if (/^\s*(```|~~~)/.test(raw)) continue;
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(raw)) {
      out.push('');
      continue;
    }
    const section = raw.match(/^\s*#{1,6}\s+(.+?)\s*#*\s*$/);
    let line = section
      ? `# ${section[1]}`
      : raw
          .replace(/^\s*>\s?/, '')
          .replace(/^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/, '')
          .trim();
    line = line
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/__([^_]+)__/g, '**$1**')
      .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1$2')
      .replace(/(^|\W)_([^_\s][^_]*?)_(?=\W|$)/g, '$1$2')
      .replace(/~~([^~]+)~~/g, '$1')
      .replace(/<[^>]+>/g, '');
    out.push(line);
  }
  return {
    title: title || fallbackTitle,
    body: out
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  };
}

const baseName = (name: string) => name.replace(/\.[^.]+$/, '').trim() || 'Imported script';

/** Read a picked file into a script. Throws an Error with a user-facing message on failure. */
export async function importScriptFile(file: File): Promise<ImportedScript> {
  if (file.size > MAX_BYTES) throw new Error('That file is over 5 MB. Try a shorter document.');
  const name = file.name.toLowerCase();
  const title = baseName(file.name);
  if (name.endsWith('.docx')) {
    const { unzipSync, strFromU8 } = await import('fflate');
    let xml: string;
    try {
      const entry = unzipSync(new Uint8Array(await file.arrayBuffer()), {
        filter: (item) => item.name === 'word/document.xml',
      })['word/document.xml'];
      if (!entry) throw new Error('missing');
      xml = strFromU8(entry);
    } catch {
      throw new Error("We couldn't read that Word file. Save it as .docx and try again.");
    }
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    if (document.getElementsByTagName('parsererror').length)
      throw new Error("We couldn't read that Word file. Save it as .docx and try again.");
    return docxToScript(document as unknown as XmlNode, title);
  }
  const text = await file.text();
  if (name.endsWith('.md') || name.endsWith('.markdown') || file.type === 'text/markdown')
    return markdownToScript(text, title);
  if (name.endsWith('.txt') || file.type.startsWith('text/'))
    return { title, body: text.replace(/\r\n?/g, '\n').trim() };
  throw new Error('Import a .txt, .md or .docx file.');
}
