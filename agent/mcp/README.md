# SesiDo MCP Server

This directory contains the local stdio MCP server for SesiDo.

The MCP layer exposes SesiDo's exported workflows as focused tools. It does
not expose arbitrary shell execution, JavaScript/Python evaluation, deletion,
or generic file mutation.

## Run

From the SesiDo project root:

```bash
npm run mcp
```

Validate the dispatcher and perform an MCP initialize/list/read smoke test:

```bash
npm run mcp:test
```

The process communicates over stdio. Standard output is reserved for MCP;
diagnostics are written to standard error.

## VS Code

The workspace server is registered in `.vscode/mcp.json`:

```json
{
  "servers": {
    "sesido": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/agent/mcp/server.mjs"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

In VS Code, run **MCP: List Servers** from the Command Palette, select
`sesido`, and start it. Confirm the workspace server trust prompt the first
time. To use its tools with VS Code's native chat, open Chat and select the
local **Agent/Copilot harness**. Open the tools picker in the chat input, or
type `#` to find a tool by name.

The OpenAI Codex extension is a separate MCP client even though it runs inside
VS Code. It does not read `.vscode/mcp.json` or show VS Code's native tools
picker; register the server in Codex configuration to use it from a Codex
conversation.

If the tool definitions change, run **MCP: Reset Cached Tools** and restart
the server.

## Other MCP clients

Clients using the Claude-style portable format use `mcpServers`. Use an
absolute project path when the client does not support a working directory:

```json
{
  "mcpServers": {
    "sesido": {
      "command": "node",
      "args": ["/absolute/path/to/SesiDo/agent/mcp/server.mjs"]
    }
  }
}
```

The `sesi` executable must be available on `PATH`. Set `SESI_BIN` to an
alternate executable path when needed.

## Architecture

- `server.mjs` implements MCP tools and artifact resources.
- `bridge.mjs` launches Sesi without a shell, captures logs, and detects new
  artifacts.
- `dispatch.sesi` maps ordinary positional `args` to exported SesiDo
  workflows, creates a native Sesi `lazy(...)` task for the selected workflow,
  forces only that task, and prints one marked JSON result.

## Exposed tools

- `research`
- `summarize_text`
- `summarize_file`
- `write_code`
- `debug_code`
- `calculate`
- `create_svg`
- `draw_pixel_art`
- `draw_image`
- `generate_image`
- `generate_video`
- `inspect_image`
- `browse_page`

File-oriented inputs are confined to the SesiDo project root. Generated
artifacts are discoverable as MCP resources and are also linked from tool
results.

`browse_page` accepts URLs, hostnames, and workspace-local `.html` or `.htm`
files. Local paths and `file://` URLs are confined to the project root.
