export function pixelsPerWord(contentHeight: number, spokenWords: number): number {
  return contentHeight / Math.max(1, spokenWords);
}
export function pixelsPerSecond(wpm: number, pxWord: number): number {
  return (wpm / 60) * pxWord;
}
export function crossedMarker(
  scrollTop: number,
  cueOffset: number,
  markers: number[],
  consumed: Set<number>,
): number | null {
  return markers.findIndex((top, index) => !consumed.has(index) && scrollTop + cueOffset >= top) < 0
    ? null
    : markers.findIndex((top, index) => !consumed.has(index) && scrollTop + cueOffset >= top);
}
