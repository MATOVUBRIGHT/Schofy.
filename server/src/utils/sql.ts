export function rowToObject(columns: string[], values: any[]): Record<string, any> {
  const obj: Record<string, any> = {};
  columns.forEach((col, i) => {
    obj[col] = values[i];
  });
  return obj;
}

export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

export function asSqlString(value: string): string {
  return `'${escapeSqlString(value)}'`;
}

export function getStringParam(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export function isIsoDateString(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}
