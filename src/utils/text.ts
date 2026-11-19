export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "1 min 05 s" style duration, readable in every supported locale. */
export function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} s`
}
