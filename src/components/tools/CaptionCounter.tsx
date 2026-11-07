import { useState } from 'preact/hooks';
import { limits } from '../../content/studio/platformFacts';
const rows = [
  {
    name: 'Instagram caption',
    max: limits.instagramCaption,
    preview: limits.instagramCaptionVisible,
  },
  { name: 'YouTube title', max: limits.youtubeTitle },
  { name: 'YouTube description', max: limits.youtubeDescription },
  { name: 'TikTok caption', max: limits.tiktokCaption },
];
export default function CaptionCounter(): preact.JSX.Element {
  const [text, setText] = useState('');
  const hashtags = (text.match(/(^|\s)#[\p{L}\p{N}_]+/gu) ?? []).length;
  const count = [...text].length;
  return (
    <div class="creator-tool">
      <label for="caption-input">Caption, title or description</label>
      <textarea
        id="caption-input"
        rows={6}
        value={text}
        onInput={(event) => setText(event.currentTarget.value)}
        placeholder="Write or paste your caption"
      />
      <p aria-live="polite">
        <strong>{count} characters</strong> · {hashtags} hashtags
      </p>
      <p>
        {hashtags > limits.instagramHashtags
          ? `Instagram: ${hashtags - limits.instagramHashtags} hashtags over the ${limits.instagramHashtags} limit.`
          : `Instagram: ${limits.instagramHashtags - hashtags} hashtag spaces left.`}
      </p>
      <h2>Platform limits</h2>
      <div class="creator-tool__results">
        {rows.map((row) => (
          <section>
            <h3>{row.name}</h3>
            <p>
              {count} / {row.max} characters ·{' '}
              {count > row.max ? `${count - row.max} over` : `${row.max - count} left`}
            </p>
            {row.preview && (
              <p>
                <strong>Approximate preview before “more”:</strong>{' '}
                {[...text].slice(0, row.preview).join('')}
                {count > row.preview ? '…' : ''}
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
