import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverPersonas, findProjectRoot, defaultPersonaDirs } from "../src/persona-discovery.js";

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "superspec-persona-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("discoverPersonas", () => {
  it("reads name/description frontmatter from .claude/agents/*.md", async () => {
    const dir = join(root, ".claude", "agents");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "backend-developer.md"),
      '---\nname: backend-developer\ndescription: "Responsible for server-side implementation."\n---\n\n# Agent: Backend Developer\nBody',
      "utf8",
    );

    const personas = await discoverPersonas({ claude: dir, includeDefaults: false });

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
      "utf8",
    );

    const personas = await discoverPersonas({ cursor: dir, includeDefaults: false });
    expect(personas).toHaveLength(1);
    expect(personas[0].name).toBe("frontend-developer");
    expect(personas[0].description).toBe("Handles UI work.");
    expect(personas[0].source).toBe("cursor");
    expect(personas[0].path).toBe(join(dir, "frontend-developer.md"));
  });

  it("discovers personas from CRLF Windows agent files", async () => {
    const dir = join(root, ".claude", "agents");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "backend-developer.md"),
      "---\r\nname: backend-developer\r\ndescription: \"API work.\"\r\n---\r\n\r\nBody",
      "utf8",
    );

    const personas = await discoverPersonas({ claude: dir, includeDefaults: false });
    expect(personas).toHaveLength(1);
    expect(personas[0].name).toBe("backend-developer");
    expect(personas[0].description).toBe('"API work."');
  });

  it("reads Codex TOML agents from .codex/agents", async () => {
    const dir = join(root, ".codex", "agents");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "reviewer.toml"),
      'name = "reviewer"\ndescription = "PR reviewer focused on correctness."\ndeveloper_instructions = """Review carefully."""\n',
      "utf8",
    );

    const personas = await discoverPersonas({ codex: dir, includeDefaults: false });
    expect(personas).toHaveLength(1);
    expect(personas[0].name).toBe("reviewer");
    expect(personas[0].description).toBe("PR reviewer focused on correctness.");
    expect(personas[0].source).toBe("codex");
  });

  it("defaults to project .claude/.cursor/.codex agents under projectRoot", async () => {
    await mkdir(join(root, ".claude", "agents"), { recursive: true });
    await mkdir(join(root, ".cursor", "agents"), { recursive: true });
    await writeFile(
      join(root, ".claude", "agents", "backend.md"),
      "---\nname: backend\ndescription: API work.\n---\n\nBody",
      "utf8",
    );
    await writeFile(
      join(root, ".cursor", "agents", "frontend.md"),
      "---\nname: frontend\ndescription: UI work.\n---\n\nBody",
      "utf8",
    );

    const personas = await discoverPersonas({
      projectRoot: root,
      includeHome: false,
    });

    expect(personas.map((p) => p.name).sort()).toEqual(["backend", "frontend"]);
  });

  it("resolves relative agent dirs against projectRoot not cwd", async () => {
    await mkdir(join(root, ".claude", "agents"), { recursive: true });
    await writeFile(
      join(root, ".claude", "agents", "backend.md"),
      "---\nname: backend\ndescription: API.\n---\n\nBody",
      "utf8",
    );

    const personas = await discoverPersonas({
      projectRoot: root,
      claude: ".claude/agents",
      includeDefaults: false,
    });

    expect(personas).toHaveLength(1);
    expect(personas[0].name).toBe("backend");
  });

  it("merges both sources, with .claude/agents winning on name collision", async () => {
    const claudeDir = join(root, ".claude", "agents");
    const cursorDir = join(root, ".cursor", "agents");
    await mkdir(claudeDir, { recursive: true });
    await mkdir(cursorDir, { recursive: true });

    await writeFile(
      join(claudeDir, "backend-developer.md"),
      "---\nname: backend-developer\ndescription: Claude version.\n---\n\nBody",
      "utf8",
    );
    await writeFile(
      join(cursorDir, "backend-developer.md"),
      "---\nname: backend-developer\ndescription: Cursor version.\n---\n\nBody",
      "utf8",
    );
    await writeFile(
      join(cursorDir, "qa-engineer.md"),
      "---\nname: qa-engineer\ndescription: Testing.\n---\n\nBody",
      "utf8",
    );

    const personas = await discoverPersonas({
      claude: claudeDir,
      cursor: cursorDir,
      includeDefaults: false,
    });

    expect(personas).toHaveLength(2);
    const backend = personas.find((p) => p.name === "backend-developer");
    expect(backend?.description).toBe("Claude version.");
    expect(backend?.source).toBe("claude");
    expect(backend?.path).toBe(join(claudeDir, "backend-developer.md"));
  });

  it("skips malformed files (no frontmatter or missing name) without throwing", async () => {
    const dir = join(root, ".claude", "agents");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "no-frontmatter.md"), "# Just a heading\n\nBody", "utf8");
    await writeFile(
      join(dir, "missing-name.md"),
      "---\ndescription: Has description only.\n---\n\nBody",
      "utf8",
    );
    await writeFile(
      join(dir, "valid-agent.md"),
      "---\nname: valid-agent\ndescription: All good.\n---\n\nBody",
      "utf8",
    );

    const personas = await discoverPersonas({ claude: dir, includeDefaults: false });

    expect(personas).toHaveLength(1);
    expect(personas[0].name).toBe("valid-agent");
  });

  it("returns [] when neither directory exists", async () => {
    const personas = await discoverPersonas({
      claude: join(root, "nonexistent", ".claude", "agents"),
      cursor: join(root, "nonexistent", ".cursor", "agents"),
      includeDefaults: false,
    });

    expect(personas).toEqual([]);
  });

  it("returns [] when defaults are disabled and no dirs are provided", async () => {
    const personas = await discoverPersonas({ includeDefaults: false });
    expect(personas).toEqual([]);
  });

  it("returns results sorted alphabetically by name", async () => {
    const dir = join(root, ".claude", "agents");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "zebra.md"), "---\nname: zebra\ndescription: Z.\n---\n\nBody", "utf8");
    await writeFile(join(dir, "alpha.md"), "---\nname: alpha\ndescription: A.\n---\n\nBody", "utf8");
    await writeFile(join(dir, "mid.md"), "---\nname: mid\ndescription: M.\n---\n\nBody", "utf8");

    const personas = await discoverPersonas({ claude: dir, includeDefaults: false });

    expect(personas.map((p) => p.name)).toEqual(["alpha", "mid", "zebra"]);
  });

  it("descends into subdirectories (Claude Code recursive layout)", async () => {
    const dir = join(root, ".claude", "agents");
    const subDir = join(dir, "nested");
    await mkdir(subDir, { recursive: true });
    await writeFile(
      join(subDir, "nested-agent.md"),
      "---\nname: nested-agent\ndescription: Nested.\n---\n\nBody",
      "utf8",
    );

    const personas = await discoverPersonas({ claude: dir, includeDefaults: false });

    expect(personas).toHaveLength(1);
    expect(personas[0].name).toBe("nested-agent");
  });
});

describe("findProjectRoot", () => {
  it("finds root via .git marker from a nested cwd", async () => {
    await mkdir(join(root, ".git"), { recursive: true });
    const nested = join(root, "packages", "core");
    await mkdir(nested, { recursive: true });
    expect(await findProjectRoot(nested)).toBe(root);
  });
});

describe("defaultPersonaDirs", () => {
  it("lists project and home agent paths", () => {
    const dirs = defaultPersonaDirs(root, { home: join(root, "home"), includeHome: true });
    expect(dirs.claude).toEqual([
      join(root, ".claude", "agents"),
      join(root, "home", ".claude", "agents"),
    ]);
    expect(dirs.cursor[0]).toBe(join(root, ".cursor", "agents"));
    expect(dirs.codex[0]).toBe(join(root, ".codex", "agents"));
  });
});
