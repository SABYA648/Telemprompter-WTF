import { useEffect, useRef, useState } from 'preact/hooks';
import { analytics } from '../domain/analytics';
import { IMPORT_ACCEPT, importScriptFile } from '../domain/studio/docImport';
import { parseMarkup } from '../domain/studio/markup';
import { PrompterBroadcast, operatorRequested } from '../domain/studio/operator';
import { createScript } from '../domain/studio/scriptsRepo';
import type { StudioScript } from '../domain/studio/types';

/** A hidden file input plus `pick()`, so Import can live in a "..." menu. */
export function useScriptImport(onImported: (script: StudioScript) => void | Promise<void>) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const element = (
    <input
      ref={input}
      type="file"
      accept={IMPORT_ACCEPT}
      class="studio-visually-hidden"
      tabIndex={-1}
      aria-label="Import a script file"
      data-testid="script-import"
      onChange={async (event) => {
        const field = event.currentTarget;
        const file = field.files?.[0];
        field.value = '';
        if (!file) return;
        setStatus('Importing...');
        try {
          const imported = await importScriptFile(file);
          if (!imported.body.trim()) throw new Error('That file has no text to import.');
          const script = await createScript(imported);
          analytics.track('created_script', { source: 'import' });
          setStatus('');
          await onImported(script);
        } catch (error) {
          setStatus(error instanceof Error ? error.message : 'Could not import that file.');
        }
      }}
    />
  );
  return { element, status, pick: () => input.current?.click() };
}

/** The print layout for a script: only this article prints (see the print rules in studio.css). */
export function PrintableScript({ script }: { script: StudioScript }) {
  const { tokens } = parseMarkup(script.body);
  return (
    <article class="studio-print" aria-hidden="true">
      <h1>{script.title || 'Untitled script'}</h1>
      <p>
        {tokens.map((token, index) =>
          token.type === 'paragraphBreak' ? (
            <br key={index} />
          ) : token.type === 'section' ? (
            <strong key={index} class="studio-print__section">
              {token.value}
            </strong>
          ) : token.type === 'emphasis' ? (
            <strong key={index}>{token.value}</strong>
          ) : token.type === 'highlight' ? (
            <mark key={index}>{token.value}</mark>
          ) : token.type === 'pause' || token.type === 'cue' ? (
            <span key={index} class="studio-print__cue">
              [{token.value}]
            </span>
          ) : token.type === 'note' ? null : (
            <span key={index}>{token.value} </span>
          ),
        )}
      </p>
    </article>
  );
}

/** While this tab has an operator window, keep it showing the script being edited. */
export function useEditorBroadcast(body: string | undefined, enabled: boolean) {
  const channel = useRef<PrompterBroadcast | null>(null);
  useEffect(() => {
    if (!enabled && !operatorRequested()) return;
    channel.current = new PrompterBroadcast();
    return () => {
      channel.current?.close();
      channel.current = null;
    };
  }, [enabled]);
  useEffect(() => {
    if (body !== undefined) channel.current?.send({ body, progress: 0, wpm: 140, playing: false });
  }, [body, enabled]);
}
