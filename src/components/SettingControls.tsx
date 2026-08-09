import { SETTING_LIMITS } from '../domain/settings';
import type { SettingName } from '../domain/analytics';
import type { PresenterPreferences } from '../domain/types';

interface Props {
  preferences: PresenterPreferences;
  onChange: (next: PresenterPreferences, setting?: SettingName) => void;
}

export default function SettingControls({ preferences, onChange }: Props): preact.JSX.Element {
  // Sliders update live without a setting name (no analytics spam while dragging) and
  // report the setting only on commit, matching how discrete controls fire.
  const update = <K extends keyof PresenterPreferences>(
    key: K,
    value: PresenterPreferences[K],
    commit = true,
  ) => {
    onChange({ ...preferences, [key]: value }, commit ? key : undefined);
  };

  return (
    <div class="settings-grid">
      <label class="range-field">
        <span>
          <b>Font size</b>
          <output>{preferences.fontSize}px</output>
        </span>
        <input
          type="range"
          aria-label="Font size"
          min={SETTING_LIMITS.fontSize.min}
          max={SETTING_LIMITS.fontSize.max}
          step={SETTING_LIMITS.fontSize.step}
          value={preferences.fontSize}
          onInput={(event) => update('fontSize', Number(event.currentTarget.value), false)}
          onChange={(event) => update('fontSize', Number(event.currentTarget.value))}
        />
      </label>
      <label class="range-field">
        <span>
          <b>Line height</b>
          <output>{preferences.lineHeight.toFixed(2)}</output>
        </span>
        <input
          type="range"
          aria-label="Line height"
          min={SETTING_LIMITS.lineHeight.min}
          max={SETTING_LIMITS.lineHeight.max}
          step={SETTING_LIMITS.lineHeight.step}
          value={preferences.lineHeight}
          onInput={(event) => update('lineHeight', Number(event.currentTarget.value), false)}
          onChange={(event) => update('lineHeight', Number(event.currentTarget.value))}
        />
      </label>
      <label class="range-field">
        <span>
          <b>Text width</b>
          <output>{preferences.textWidth}%</output>
        </span>
        <input
          type="range"
          aria-label="Text width"
          min={SETTING_LIMITS.textWidth.min}
          max={SETTING_LIMITS.textWidth.max}
          step={SETTING_LIMITS.textWidth.step}
          value={preferences.textWidth}
          onInput={(event) => update('textWidth', Number(event.currentTarget.value), false)}
          onChange={(event) => update('textWidth', Number(event.currentTarget.value))}
        />
      </label>
      <label class="range-field">
        <span>
          <b>Focus position</b>
          <output>{preferences.focusPosition}%</output>
        </span>
        <input
          type="range"
          aria-label="Focus position"
          min={SETTING_LIMITS.focusPosition.min}
          max={SETTING_LIMITS.focusPosition.max}
          step={SETTING_LIMITS.focusPosition.step}
          value={preferences.focusPosition}
          onInput={(event) => update('focusPosition', Number(event.currentTarget.value), false)}
          onChange={(event) => update('focusPosition', Number(event.currentTarget.value))}
        />
      </label>
      <fieldset class="segmented-field">
        <legend>Text alignment</legend>
        <div class="segmented">
          <button
            type="button"
            aria-pressed={preferences.alignment === 'left'}
            onClick={() => update('alignment', 'left')}
          >
            Left
          </button>
          <button
            type="button"
            aria-pressed={preferences.alignment === 'center'}
            onClick={() => update('alignment', 'center')}
          >
            Center
          </button>
        </div>
      </fieldset>
      <div class="toggle-list">
        <label class="toggle-field">
          <span>
            <b>Mirror horizontally</b>
            <small>For beam-splitter glass</small>
          </span>
          <input
            type="checkbox"
            checked={preferences.mirror}
            onChange={(event) => update('mirror', event.currentTarget.checked)}
          />
        </label>
        <label class="toggle-field">
          <span>
            <b>Flip vertically</b>
            <small>For inverted rigs</small>
          </span>
          <input
            type="checkbox"
            checked={preferences.verticalFlip}
            onChange={(event) => update('verticalFlip', event.currentTarget.checked)}
          />
        </label>
        <label class="toggle-field">
          <span>
            <b>Focus line</b>
            <small>Keep your eyes anchored</small>
          </span>
          <input
            type="checkbox"
            checked={preferences.focusLine}
            onChange={(event) => update('focusLine', event.currentTarget.checked)}
          />
        </label>
      </div>
    </div>
  );
}
