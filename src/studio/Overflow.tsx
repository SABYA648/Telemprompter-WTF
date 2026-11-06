import type { ComponentChildren, Ref } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Icon, type IconName } from './Icons';

/** A small "..." menu for secondary actions. Closes on an outside tap, Escape, or a choice. */
export function Overflow({
  label,
  up = false,
  icon = 'more',
  summaryRef,
  children,
}: {
  label: string;
  up?: boolean;
  icon?: IconName;
  summaryRef?: Ref<HTMLElement> | undefined;
  children: ComponentChildren;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const fallback = useRef<HTMLElement>(null);
  useEffect(() => {
    const close = (event: Event) => {
      const menu = ref.current;
      if (menu?.open && !menu.contains(event.target as Node)) menu.open = false;
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  return (
    <details
      ref={ref}
      class={up ? 'studio-overflow studio-overflow--up' : 'studio-overflow'}
      onKeyDown={(event) => {
        const menu = ref.current;
        if (event.key !== 'Escape' || !menu?.open) return;
        event.stopPropagation();
        menu.open = false;
        menu.querySelector('summary')?.focus();
      }}
      onClick={(event) => {
        if ((event.target as Element).closest('.studio-overflow__menu :is(button, a)'))
          ref.current?.removeAttribute('open');
      }}
    >
      <summary ref={summaryRef ?? fallback} aria-label={label}>
        <Icon name={icon} />
      </summary>
      <div class="studio-overflow__menu">{children}</div>
    </details>
  );
}
