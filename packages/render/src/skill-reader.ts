export interface Skill {
  name: string;
  frontmatter: string;
  body: string;
}

export function readSkill(markdown: string, dirName: string): Skill {
  // Accept LF and CRLF frontmatter delimiters (Windows agent files).
  const m = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { name: dirName, frontmatter: "", body: markdown };
  return { name: dirName, frontmatter: m[1], body: m[2] };
}

export function frontmatterField(frontmatter: string, key: string): string | null {
  const re = new RegExp(`^${key}:\\s*(.+)$`, "m");
  const m = re.exec(frontmatter);
  return m ? m[1].trim() : null;
}
