import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Icon } from './Icons';

const FOCUSABLE =
  'button:not([disabled]),a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';

/** A modal bottom sheet for one secondary task: a heading, Escape and backdrop close, focus held. */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ComponentChildren;
}) {
  const dialog = useRef<HTMLElement>(null);
  const returnTo = useRef<Element | null>(null);
  useEffect(() => {
    returnTo.current = document.activeElement;
    dialog.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => (returnTo.current as HTMLElement | null)?.focus?.();
  }, []);
  return (
    <div class="studio-sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        ref={dialog}
        class="studio-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onClose();
            return;
          }
          if (event.key !== 'Tab') return;
          const items = [...(dialog.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
          if (event.shiftKey && document.activeElement === items[0]) {
            event.preventDefault();
            items.at(-1)?.focus();
          } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
            event.preventDefault();
            items[0]?.focus();
          }
        }}
      >
        <div class="studio-sheet__head">
          <h2>{title}</h2>
          <button class="studio-sheet__close" aria-label="Close" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
