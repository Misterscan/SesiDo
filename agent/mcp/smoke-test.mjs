import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const child = spawn(process.execPath, [path.join(directory, "server.mjs")], {
  cwd: path.resolve(directory, "../.."),
  stdio: ["pipe", "pipe", "pipe"],
});

let stdoutBuffer = "";
let stderr = "";
let nextId = 1;
const pending = new Map();

child.stderr.on("data", (chunk) => {
  stderr += chunk.toString("utf8");
});

child.stdout.on("data", (chunk) => {
  stdoutBuffer += chunk.toString("utf8");
  const lines = stdoutBuffer.split("\n");
  stdoutBuffer = lines.pop() ?? "";

  for (const line of lines) {
    if (!line.trim()) continue;
    const message = JSON.parse(line);
    const waiter = pending.get(message.id);
    if (waiter) {
      pending.delete(message.id);
      waiter.resolve(message);
    }
  }
});

function send(message) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

function request(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}. stderr: ${stderr}`));
    }, 10_000);

    pending.set(id, {
      resolve(message) {
        clearTimeout(timer);
        resolve(message);
      },
    });

    send({ jsonrpc: "2.0", id, method, params });
  });
}

try {
  const initialized = await request("initialize", {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "sesido-smoke-test", version: "1.0.0" },
  });
  assert.equal(initialized.result.serverInfo.name, "sesido");

  send({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });

  const tools = await request("tools/list");
  assert.equal(tools.result.tools.length, 13);
  assert(tools.result.tools.some((tool) => tool.name === "research"));
  assert(tools.result.tools.some((tool) => tool.name === "generate_video"));
  const scriptRecoveryTools = new Set(["create_svg", "draw_pixel_art", "draw_image"]);
  for (const tool of tools.result.tools) {
    if (scriptRecoveryTools.has(tool.name)) {
      assert.match(tool.description, /do not repeat the tool call/i);
    } else {
      assert.doesNotMatch(tool.description, /do not repeat the tool call/i);
    }
  }
  const browseTool = tools.result.tools.find((tool) => tool.name === "browse_page");
  assert(browseTool.inputSchema.properties.target);

  const resources = await request("resources/list");
  assert(
    resources.result.resources.some((resource) => resource.uri === "sesido://capabilities"),
  );

  const capabilities = await request("resources/read", { uri: "sesido://capabilities" });
  assert.match(capabilities.result.contents[0].text, /SesiDo MCP/);

  const artifact = resources.result.resources.find(
    (resource) =>
      resource.uri.startsWith("sesido://artifact/") && resource.mimeType?.startsWith("text/"),
  );
  if (artifact) {
    const artifactResult = await request("resources/read", { uri: artifact.uri });
    assert.equal(artifactResult.result.contents[0].uri, artifact.uri);
  }

  const confinedPath = await request("tools/call", {
    name: "summarize_file",
    arguments: { path: "../../outside-the-sesido-workspace.txt" },
  });
  assert.equal(confinedPath.result.isError, true);
  assert.match(confinedPath.result.content[0].text, /outside the SesiDo workspace/);

  const confinedBrowse = await request("tools/call", {
    name: "browse_page",
    arguments: {
      target: "../../outside-the-sesido-workspace.html",
      operation: "scrape",
    },
  });
  assert.equal(confinedBrowse.result.isError, true);
  assert.match(confinedBrowse.result.content[0].text, /outside the SesiDo workspace/);

  console.error(
    `SesiDo MCP smoke test passed: ${tools.result.tools.length} tools, ${resources.result.resources.length} listed resources.`,
  );
} finally {
  child.stdin.end();
  child.kill("SIGTERM");
}
