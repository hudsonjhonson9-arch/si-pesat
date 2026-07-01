export function toDisplay(iso: string | undefined | null): string {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function fromDisplay(ddmm: string): string {
  const m = ddmm.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return ddmm;
  return `${m[3]}-${m[2]}-${m[1]}`;
}
