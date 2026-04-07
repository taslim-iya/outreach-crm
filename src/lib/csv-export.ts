/**
 * Export an array of objects to a CSV file and trigger download.
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (data.length === 0) return;

  const cols = columns ?? (Object.keys(data[0]) as (keyof T)[]).map((key) => ({
    key,
    label: String(key),
  }));

  const escapeCell = (value: unknown): string => {
    if (value == null) return '';
    const str = Array.isArray(value) ? value.join('; ') : String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = cols.map((c) => escapeCell(c.label)).join(',');
  const rows = data.map((row) =>
    cols.map((c) => escapeCell(row[c.key])).join(',')
  );

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
