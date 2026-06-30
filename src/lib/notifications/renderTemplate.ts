/** Render {{key}} placeholders. Pure (Skill 47). */
export function renderTemplate(template: string, data: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    const v = data[key];
    return v == null ? "" : String(v);
  });
}
