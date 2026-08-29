import { spawn } from "node:child_process";
import { realpathSync } from "node:fs";
import { readdir, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MCP_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(MCP_DIR, "../..");
export const DISPATCHER_PATH = path.join(MCP_DIR, "dispatch.sesi");
export const RESULT_PREFIX = "__SESIDO_MCP_RESULT__=";

const ARTIFACT_ROOTS = [
  path.join(PROJECT_ROOT, "SesiDo", ".artifacts"),
  path.join(PROJECT_ROOT, ".artifacts"),
];

const MIME_TYPES = new Map([
  [".md", "text/markdown"],
  [".txt", "text/plain"],
  [".json", "application/json"],
  [".sesi", "text/x-sesi"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".mp4", "video/mp4"],
  [".wav", "audio/wav"],
]);

function mimeTypeFor(filePath) {
  return MIME_TYPES.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream";
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function resolveWorkspacePath(inputPath) {
  const resolved = path.resolve(PROJECT_ROOT, inputPath);
  if (!isWithin(PROJECT_ROOT, resolved)) {
    throw new Error(`Path is outside the SesiDo workspace: ${inputPath}`);
  }

  const realRoot = realpathSync(PROJECT_ROOT);
  const realResolved = realpathSync(resolved);
  if (!isWithin(realRoot, realResolved)) {
    throw new Error(`Path resolves outside the SesiDo workspace: ${inputPath}`);
  }
  return realResolved;
}

async function walkFiles(root) {
  const files = [];

  async function visit(directory) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  }

  await visit(root);
  return files;
}

async function artifactSnapshot() {
  const snapshot = new Map();
  for (const root of ARTIFACT_ROOTS) {
    for (const filePath of await walkFiles(root)) {
      const info = await stat(filePath);
      snapshot.set(filePath, `${info.mtimeMs}:${info.size}`);
    }
  }
  return snapshot;
}

export async function listArtifacts() {
  const artifacts = [];
  for (const root of ARTIFACT_ROOTS) {
    for (const filePath of await walkFiles(root)) {
      const info = await stat(filePath);
      const relativePath = path.relative(PROJECT_ROOT, filePath);
      artifacts.push({
        uri: `sesido://artifact/${encodeURIComponent(relativePath)}`,
        path: relativePath,
        name: path.basename(filePath),
        mimeType: mimeTypeFor(filePath),
        size: info.size,
        modifiedAt: info.mtime.toISOString(),
      });
    }
  }
  return artifacts.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

export async function readArtifactFromUri(uri) {
  const parsed = new URL(uri);
  if (parsed.protocol !== "sesido:" || parsed.hostname !== "artifact") {
    throw new Error("Unsupported SesiDo artifact URI.");
  }

  const relativePath = decodeURIComponent(parsed.pathname.slice(1));
  const filePath = path.resolve(PROJECT_ROOT, relativePath);
  const realFilePath = await realpath(filePath);
  const realArtifactRoots = (
    await Promise.all(
      ARTIFACT_ROOTS.map(async (root) => {
        try {
          return await realpath(root);
        } catch (error) {
          if (error?.code === "ENOENT") return null;
          throw error;
        }
      }),
    )
  ).filter(Boolean);

  if (!realArtifactRoots.some((root) => isWithin(root, realFilePath))) {
    throw new Error("Artifact URI is outside the configured SesiDo artifact roots.");
  }

  const info = await stat(realFilePath);
  if (info.size > 10 * 1024 * 1024) {
    throw new Error("Artifact is larger than the 10 MB MCP resource limit.");
  }

  const mimeType = mimeTypeFor(realFilePath);
  const data = await readFile(realFilePath);
  const textual = mimeType.startsWith("text/") || mimeType === "application/json";

  return textual
    ? { uri, mimeType, text: data.toString("utf8") }
    : { uri, mimeType, blob: data.toString("base64") };
}

function parseDispatcherResult(stdout) {
  const markerAt = stdout.lastIndexOf(RESULT_PREFIX);
  if (markerAt < 0) {
    throw new Error("SesiDo dispatcher did not emit a structured result marker.");
  }

  const payload = stdout.slice(markerAt + RESULT_PREFIX.length).trim();
  return {
    envelope: JSON.parse(payload),
    logs: stdout.slice(0, markerAt).trim(),
  };
}

export async function invokeSesiDo(action, actionArgs = [], options = {}) {
  const timeoutMs = options.timeoutMs ?? 5 * 60_000;
  const maxOutputBytes = options.maxOutputBytes ?? 16 * 1024 * 1024;
  const before = await artifactSnapshot();

  const outcome = await new Promise((resolve, reject) => {
    const child = spawn(
      process.env.SESI_BIN || "sesi",
      ["-l", DISPATCHER_PATH, action, ...actionArgs.map(String)],
      {
        cwd: PROJECT_ROOT,
        env: { ...process.env, PWD: PROJECT_ROOT, SESI_MCP: "1" },
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 2_000).unref();
    }, timeoutMs);

    const collect = (target) => (chunk) => {
      outputBytes += chunk.length;
      if (outputBytes > maxOutputBytes) {
        child.kill("SIGTERM");
        reject(new Error("SesiDo exceeded the MCP output limit."));
        return;
      }
      if (target === "stdout") stdout += chunk.toString("utf8");
      else stderr += chunk.toString("utf8");
    };

    child.stdout.on("data", collect("stdout"));
    child.stderr.on("data", collect("stderr"));
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`SesiDo timed out after ${timeoutMs} ms.`));
      } else if (code !== 0) {
        reject(
          new Error(
            `SesiDo exited with code ${code}${signal ? ` (${signal})` : ""}. ${stderr.trim()}`,
          ),
        );
      } else {
        resolve({ stdout, stderr });
      }
    });
  });

  const { envelope, logs } = parseDispatcherResult(outcome.stdout);
  const diagnostics = [logs, outcome.stderr.trim()].filter(Boolean).join("\n");
  const after = await artifactSnapshot();
  const allArtifacts = await listArtifacts();
  const newArtifacts = allArtifacts.filter((artifact) => {
    const absolutePath = path.join(PROJECT_ROOT, artifact.path);
    return before.get(absolutePath) !== after.get(absolutePath);
  });

  return {
    ok: Boolean(envelope.ok),
    action: String(envelope.action ?? action),
    result: String(envelope.result ?? ""),
    artifacts: newArtifacts,
    ...(!envelope.ok && diagnostics ? { logs: diagnostics } : {}),
  };
}
