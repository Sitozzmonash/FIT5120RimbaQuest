export type CategoryProgress = {
  id: string;
  label: string;
  found: number;
  total: number;
};

export function percentOf(found: number, total: number): number {
  return total ? Math.min(100, Math.round((found / total) * 100)) : 0;
}
