import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverPersonas } from "../src/persona-discovery.js";

let root: string;
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), "superspec-persona-")); });
afterEach(async () => { await rm(root, { recursive: true, force: true }); });

describe("discoverPersonas", () => {
  it("reads name/description frontmatter from .claude/agents/*.md", async () => {
    const dir = join(root, ".claude", "agents");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "backend-developer.md"),
      '---\nname: backend-developer\ndescription: "Responsible for server-side implementation."\n---\n\n# Agent: Backend Developer\nBody',
      "utf8"
    );

    const personas = await discoverPersonas({ claude: dir });

    expect(personas).toHaveLength(1);
    expect(personas[0].name).toBe("backend-developer");
    expect(personas[0].description).toBe('"Responsible for server-side implementation."');
    expect(personas[0].source).toBe("claude");
    expect(personas[0].path).toBe(join(dir, "backend-developer.md"));
  });

  it("reads name/description frontmatter from .cursor/agents/*.md", async () => {
    const dir = join(root, ".cursor", "agents");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "frontend-developer.md"),
      "---\nname: frontend-developer\ndescription: Handles UI work.\n---\n\nBody",
      "utf8"
    );

    const personas = await discoverPersonas({ cursor: dir });

    expect(personas).toHaveLength(1);
    expect(personas[0].name).toBe("frontend-developer");
    expect(personas[0].description).toBe("Handles UI work.");
    expect(personas[0].source).toBe("cursor");
    expect(personas[0].path).toBe(join(dir, "frontend-developer.md"));
  });

  it("merges both sources, with .claude/agents winning on name collision", async () => {
    const claudeDir = join(root, ".claude", "agents");
    const cursorDir = join(root, ".cursor", "agents");
    await mkdir(claudeDir, { recursive: true });
    await mkdir(cursorDir, { recursive: true });

    await writeFile(
      join(claudeDir, "backend-developer.md"),
      "---\nname: backend-developer\ndescription: Claude version.\n---\n\nBody",
      "utf8"
    );
    await writeFile(
      join(cursorDir, "backend-developer.md"),
      "---\nname: backend-developer\ndescription: Cursor version.\n---\n\nBody",
      "utf8"
    );
    await writeFile(
      join(cursorDir, "qa-engineer.md"),
      "---\nname: qa-engineer\ndescription: Testing.\n---\n\nBody",
      "utf8"
    );

    const personas = await discoverPersonas({ claude: claudeDir, cursor: cursorDir });

    expect(personas).toHaveLength(2);
    const backend = personas.find((p) => p.name === "backend-developer");
    expect(backend?.description).toBe("Claude version.");
    expect(backend?.source).toBe("claude");
    expect(backend?.path).toBe(join(claudeDir, "backend-developer.md"));
  });

  it("skips malformed files (no frontmatter or missing name) without throwing", async () => {
    const dir = join(root, ".claude", "agents");
    await mkdir(dir, { recursive: true });

    await writeFile(join(dir, "no-frontmatter.md"), "# Just a heading\nNo frontmatter here.", "utf8");
    await writeFile(
      join(dir, "missing-name.md"),
      "---\ndescription: Missing name field.\n---\n\nBody",
      "utf8"
    );
    await writeFile(
      join(dir, "empty-name.md"),
      "---\nname: \ndescription: Empty name field.\n---\n\nBody",
      "utf8"
    );
    await writeFile(
      join(dir, "missing-description.md"),
      "---\nname: solo-agent\n---\n\nBody",
      "utf8"
    );
    await writeFile(
      join(dir, "valid-agent.md"),
      "---\nname: valid-agent\ndescription: All good.\n---\n\nBody",
      "utf8"
    );

    const personas = await discoverPersonas({ claude: dir });

    expect(personas).toHaveLength(1);
    expect(personas[0].name).toBe("valid-agent");
  });

  it("returns [] when neither directory exists", async () => {
    const personas = await discoverPersonas({
      claude: join(root, "nonexistent", ".claude", "agents"),
      cursor: join(root, "nonexistent", ".cursor", "agents"),
    });

    expect(personas).toEqual([]);
  });

  it("returns [] when no dirs are provided", async () => {
    const personas = await discoverPersonas({});
    expect(personas).toEqual([]);
  });

  it("returns results sorted alphabetically by name", async () => {
    const dir = join(root, ".claude", "agents");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "zebra.md"), "---\nname: zebra\ndescription: Z.\n---\n\nBody", "utf8");
    await writeFile(join(dir, "alpha.md"), "---\nname: alpha\ndescription: A.\n---\n\nBody", "utf8");
    await writeFile(join(dir, "mid.md"), "---\nname: mid\ndescription: M.\n---\n\nBody", "utf8");

    const personas = await discoverPersonas({ claude: dir });

    expect(personas.map((p) => p.name)).toEqual(["alpha", "mid", "zebra"]);
  });

  it("does not descend into subdirectories", async () => {
    const dir = join(root, ".claude", "agents");
    const subDir = join(dir, "nested");
    await mkdir(subDir, { recursive: true });
    await writeFile(join(dir, "top-level.md"), "---\nname: top-level\ndescription: T.\n---\n\nBody", "utf8");
    await writeFile(join(subDir, "nested-agent.md"), "---\nname: nested-agent\ndescription: N.\n---\n\nBody", "utf8");

    const personas = await discoverPersonas({ claude: dir });

    expect(personas).toHaveLength(1);
    expect(personas[0].name).toBe("top-level");
  });
});
