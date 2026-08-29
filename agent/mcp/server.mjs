#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as z from "zod/v4";
import {
  invokeSesiDo,
  listArtifacts,
  readArtifactFromUri,
  resolveWorkspacePath,
} from "./bridge.mjs";

const VERSION = "0.1.0";

const artifactSchema = z.object({
  uri: z.string(),
  path: z.string(),
  name: z.string(),
  mimeType: z.string(),
  size: z.number(),
  modifiedAt: z.string(),
});

const resultSchema = z.object({
  ok: z.boolean(),
  action: z.string(),
  result: z.string(),
  artifacts: z.array(artifactSchema),
  recovery: z.string().optional(),
  logs: z.string().optional(),
});

const text = (description) => z.string().trim().min(1).describe(description);
const SCRIPT_RECOVERY_GUIDANCE =
  "If rendering fails but returns a .sesi script, do not repeat the tool call. Inspect the failure logs, repair the returned script, and run that script manually.";

const withScriptRecovery = (description) => `${description} ${SCRIPT_RECOVERY_GUIDANCE}`;

function resolveBrowseTarget(target) {
  const value = target.trim();

  if (value.startsWith("file://")) {
    return pathToFileURL(resolveWorkspacePath(fileURLToPath(value))).href;
  }

  if (/\.html?$/i.test(value) && !value.includes("://")) {
    return resolveWorkspacePath(value);
  }

  return value;
}

function toolResponse(output) {
  const failedScript =
    !output.ok && output.artifacts.some((artifact) => artifact.mimeType === "text/x-sesi");
  const recovery = failedScript
    ? "Do not retry this tool call. Inspect the returned .sesi artifact and the failure logs, repair that script manually, then run the repaired script."
    : output.recovery;
  const response = recovery ? { ...output, recovery } : output;
  const content = [
    { type: "text", text: recovery ? `${output.result}\n\nRecovery: ${recovery}` : output.result },
  ];
  for (const artifact of output.artifacts) {
    content.push({
      type: "resource_link",
      uri: artifact.uri,
      name: artifact.name,
      mimeType: artifact.mimeType,
      description: `SesiDo artifact at ${artifact.path}`,
    });
  }

  return {
    content,
    structuredContent: response,
    isError: !output.ok,
  };
}

function createServer() {
  const server = new McpServer(
    { name: "sesido", version: VERSION },
    {
      instructions:
        "SesiDo provides Sesi-native research, code, browser, and media workflows. " +
        "Generation tools create artifacts under SesiDo/.artifacts. Use file-oriented tools only with paths inside the configured workspace. " +
        "If a failed rendering tool returns a .sesi artifact, do not retry the tool call: inspect and repair that generated script manually, then run the repaired script.",
    },
  );

  const register = (name, config, run) => {
    server.registerTool(
      name,
      { ...config, outputSchema: resultSchema },
      async (input) => {
        try {
          return toolResponse(await run(input));
        } catch (error) {
          const output = {
            ok: false,
            action: name,
            result: error instanceof Error ? error.message : String(error),
            artifacts: [],
          };
          return toolResponse(output);
        }
      },
    );
  };

  register(
    "research",
    {
      title: "Research with SesiDo",
      description: "Research a topic and save a sourced report.",
      inputSchema: z.object({ query: text("Topic or research question") }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    ({ query }) => invokeSesiDo("research", [query], { timeoutMs: 10 * 60_000 }),
  );

  register(
    "summarize_text",
    {
      title: "Summarize Text with SesiDo",
      description: "Summarize supplied text and save the summary as an artifact.",
      inputSchema: z.object({ text: text("Text to summarize") }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    ({ text: source }) => invokeSesiDo("summarize_text", [source]),
  );

  register(
    "summarize_file",
    {
      title: "Summarize Workspace File with SesiDo",
      description: "Read and summarize a file located inside the SesiDo workspace.",
      inputSchema: z.object({ path: text("Workspace-relative or absolute file path") }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    ({ path }) => invokeSesiDo("summarize_file", [resolveWorkspacePath(path)]),
  );

  register(
    "write_code",
    {
      title: "Write Code with SesiDo",
      description: "Generate a code response for a requested implementation or example.",
      inputSchema: z.object({ query: text("Code request") }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    ({ query }) => invokeSesiDo("write_code", [query]),
  );

  register(
    "debug_code",
    {
      title: "Debug Code with SesiDo",
      description: "Analyze a workspace code file and generate debugging suggestions and an improved version.",
      inputSchema: z.object({ path: text("Workspace-relative or absolute code file path") }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    ({ path }) => invokeSesiDo("debug_code", [resolveWorkspacePath(path)]),
  );

  register(
    "calculate",
    {
      title: "Calculate with SesiDo",
      description: "Calculate or explain a mathematical expression.",
      inputSchema: z.object({ expression: text("Mathematical expression") }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    ({ expression }) => invokeSesiDo("calculate", [expression]),
  );

  register(
    "create_svg",
    {
      title: "Create SVG with SesiDo",
      description: withScriptRecovery(
        "Generate a Sesi std/draw script and render an SVG artifact.",
      ),
      inputSchema: z.object({ description: text("Visual description") }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    ({ description }) => invokeSesiDo("create_svg", [description]),
  );

  register(
    "draw_pixel_art",
    {
      title: "Draw Pixel Art with SesiDo",
      description: withScriptRecovery("Generate validated pixel art and render PNG artifacts."),
      inputSchema: z.object({ description: text("Pixel-art description") }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    ({ description }) => invokeSesiDo("draw_pixel_art", [description]),
  );

  register(
    "draw_image",
    {
      title: "Draw Image with SesiDo",
      description: withScriptRecovery(
        "Generate Sesi std/draw code and render a PNG without an image-generation model.",
      ),
      inputSchema: z.object({ description: text("Image description") }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    ({ description }) => invokeSesiDo("draw_image", [description]),
  );

  register(
    "generate_image",
    {
      title: "Generate Image with SesiDo",
      description: "Generate and save an AI image.",
      inputSchema: z.object({ prompt: text("Image-generation prompt") }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    ({ prompt }) => invokeSesiDo("generate_image", [prompt], { timeoutMs: 10 * 60_000 }),
  );

  register(
    "generate_video",
    {
      title: "Generate Video with SesiDo",
      description: "Generate and save an AI video.",
      inputSchema: z.object({
        prompt: text("Video-generation prompt"),
        duration: z.union([z.literal(4), z.literal(6), z.literal(8)]),
        negative: text("Elements the generated video should avoid"),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    ({ prompt, duration, negative }) =>
      invokeSesiDo("generate_video", [prompt, duration, negative], {
        timeoutMs: 30 * 60_000,
        maxOutputBytes: 32 * 1024 * 1024,
      }),
  );

  register(
    "inspect_image",
    {
      title: "Inspect Image with SesiDo",
      description: "Analyze an image located inside the SesiDo workspace.",
      inputSchema: z.object({ path: text("Workspace-relative or absolute image path") }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    ({ path }) => invokeSesiDo("inspect_image", [resolveWorkspacePath(path)]),
  );

  register(
    "browse_page",
    {
      title: "Browse Page with SesiDo",
      description:
        "Fetch, scrape, research, analyze, or screenshot a URL or workspace-local HTML file.",
      inputSchema: z.object({
        target: text(
          "URL, hostname, workspace-relative HTML path, absolute workspace HTML path, or confined file:// URL",
        ),
        operation: z.enum(["fetch", "scrape", "research", "analyze", "screenshot"]),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    ({ target, operation }) =>
      invokeSesiDo("browse_page", [resolveBrowseTarget(target), operation], {
        timeoutMs: 10 * 60_000,
      }),
  );

  server.registerResource(
    "capabilities",
    "sesido://capabilities",
    {
      title: "SesiDo MCP Capabilities",
      description: "Overview of the SesiDo workflows exposed through MCP.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text:
            "# SesiDo MCP\n\n" +
            "Exposes research, summarization, code generation and debugging, calculation, browser operations, SVG and pixel rendering, image generation, video generation, and image inspection.\n\n" +
            "Arbitrary shell execution, eval, deletion, and generic workspace mutation are intentionally not exposed.",
        },
      ],
    }),
  );

  server.registerResource(
    "artifact",
    new ResourceTemplate("sesido://artifact/{artifactPath}", {
      list: async () => ({
        resources: (await listArtifacts()).map((artifact) => ({
          uri: artifact.uri,
          name: artifact.name,
          description: artifact.path,
          mimeType: artifact.mimeType,
        })),
      }),
    }),
    {
      title: "SesiDo Artifact",
      description: "A generated SesiDo artifact.",
    },
    async (uri) => ({ contents: [await readArtifactFromUri(uri.href)] }),
  );

  return server;
}

export { createServer };

serveStdio(createServer, {
  onerror(error) {
    console.error("SesiDo MCP transport error:", error);
  },
});
