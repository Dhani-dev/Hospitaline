export function isoNow(): string {
  return new Date().toISOString();
}

export function asJson(value: unknown): any {
  return value as any;
}
