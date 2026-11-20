<!-- banner -->
<div align="center">
    <img src="banner.svg" alt="banner" width="100%" />
    A high-performance, Sesi-based AI Agent framework designed for modular, side-effect-oriented automation. It provides a clean, minimal architecture for orchestrating complex reasoning tasks, file system mutations, and generative workflows.
    <br>
    <br>
    <img src="badge-status.svg" alt="status" height="20" /> 
    <img src="badge-version.svg" alt="version" height="20" />
</div>

## Features

- **Sesi-Native Orchestration**: Built on the Sesi language for minimal boilerplate and high-performance AI integration.
- **Modular Helper Suite**: A robust collection of utilities in `helpers/` for file operations, git automation, and SVG generation.
- **Reasoning-First**: Native primitives for model calls, structured output, and memory management.
- **Asset Generation**: Built-in workflows for generated code, images, videos, SVGs, and rendered pixel art.
- **Extensible**: Easily add custom tools and workflows to your agent's cognitive stack.

## Installation

1. Ensure you have the Sesi runtime installed.
2. Clone this repository:
   ```bash
   git clone https://github.com/Misterscan/SesiDo.git
   cd SesiDo
   ```
   or install directly from GitHub:
   ```bash
   sesi -e 'make_dir("SesiDo-Agent")'
   cd SesiDo-Agent
   sesi install github:Misterscan/SesiDo
   ```

## Local Usage

### SesiDo web workstation

Start the Sesi server and compile the Sesi browser pages from this repository:

```sh
npm run web:build
npm run web:start
```

Or use Sesi directly:

```sh
sesi build web/ui/console.sesi
sesi build web/ui/workflows.sesi
sesi build web/ui/artifacts.sesi
sesi build web/ui/settings.sesi
sesi -l web/server.sesi
```

Open the private launch URL printed by the server. It includes a fresh access token in its fragment. The UI removes that fragment from the address bar and keeps the token in the tab's session storage. API keys stay in the server environment (`OPENAI_API_KEY` and `GEMINI_API_KEY`, including values loaded from the existing `.env`). No key is sent to the browser.

The app uses separate server-served pages and ordinary links:

- `/console`: conversations, session creation/reset, model selection, agent progress, and exact-operation approvals.
- `/workflows`: the workflow catalog; `/workflows/<name>` opens an individual tool form.
- `/artifacts`: the artifact library; `/artifacts/<id>` opens metadata, an on-demand preview, and a download.
- `/settings`: provider availability and persisted model alias mappings.

The default port is 8080. Use `sesi -l web/server.sesi 8081` to select another port after building. The current `std/api` listener binds to the runtime's default network interface; workspace API routes require the per-launch token, allow only local Host values, and reject cross-origin requests. Keep the launch token private.

Only one run can reserve the engine at a time. A page advances its run through individual requests. Leaving the page pauses subsequent phases; return and choose **Resume** to continue. A phase already executing may finish. **Stop** prevents later phases and does not roll back completed actions. A rejected operation stops that run without an alternate-tool retry. Restarting the server marks unfinished runs interrupted; retry by creating a new run.

Run state and model overrides are stored under `SesiDo/database/web/` (override the state directory with `SESIDO_WEB_STATE`). Conversations use the existing SesiDo database. Generated output stays under the engine's configured `SesiDo/.artifacts/` directory. Artifact IDs are opaque; previews reject symlinks and traversal. HTML/SVG preview frames are sandboxed. Individual web downloads are limited to 64 MiB; larger files remain available at their displayed local paths.

Build or verify the application independently:

```sh
npm run web:build
sesi -l web/check.sesi
```

The check runner uses Sesi's own checking, browser compiler, and deterministic Sesi tests. `npm run web:check` runs the same script. The server exposes API documentation at `/docs` and its schema at `/openapi.json`; authenticated workspace operations live under `/api/` and accept `Authorization: Bearer <launch-token>`.

The interactive chat application starts from `main.sesi` (which imports the module in `index.sesi`).

- **Run the core agent**:
  ```bash
  npm start
  ```
  _OR_
  ```bash
  sesi -l main.sesi
  ```
- **Core Logic**: The primary cognitive loop is defined in `index.sesi`.
- **Helper Utilities**: Utilize the `helpers/` directory for common tasks:
  - `agent_file_ops.sesi`: Advanced file mutation (replace, insert, append).
  - `commit-message.sesi`: AI-powered git commit generation.
  - `text-search.sesi`: Sesi-native grep utility.
  - `line-swap.sesi`: Swap content in a file.
  - `line-count.sesi`: Get the total line count for a file.
  - `svg-badge.sesi`: Creates README.md SVG badges.
  - `readme-banner.sesi`: Generate professional README.md SVG banners.
  - `timestamp.sesi`: Get readable timestamps ready for scripts and filenames.

### Optional image input in chat

In the main interactive chat loop, you can attach an image to a message by entering this at the `[You]:` prompt:

```text
--image <filename> --prompt <message>
```

For example:

```text
--image screenshot.png --prompt Describe this screenshot and suggest improvements.
```

Start the input with `--image`, followed by the image filename or path, then `--prompt` and your message. Enter both values directly, without the angle brackets or surrounding quotes; the message can contain spaces. The chat loop sends the image alongside your message to the reasoning models for that turn, including fallback attempts.

After submitting the message, choose a maximum step count or press Enter for the default of 20. Image input is optional: for a text-only turn, type your message normally without either flag.

## Sesi Import Usage

To import SesiDo into another project via Sesi install:

```sesi
allow "SesiDo" in with SesiDo // That's it! This single line imports SesiDo and runs the chat!

/*
   Note: You can also import specific functions from SesiDo.
   Visit index.sesi for more exports.
   allow "SesiDo/build" in with SesiDo

   let avatar = SesiDo.drawPixelArt("SesiDo avatar, neon themed")
   let research = SesiDo.research("Common coding language patterns")
   let image = SesiDo.generateImage("product icon, colorful background")
   let video = SesiDo.generateVideo({"query": "city skyline at dusk", "duration": 4, "negative": "no captions or logos"})
*/
```

You can also use other models by changing the alias in the `index.sesi` file.
On top of that, you can use specific variables exported by the index.sesi file.

```sesi
allow "SesiDo/build" in as Config

export let modelNames = Config.sesiDoModels
export let ogNames = Config.ogNames
export let defaultModel = Config.sesiDoModels[10]
export let defaultOgName = Config.ogNames[10]
export let reasoningLevel = Config.mediumThink
export let search = Config.searchGoogle
export let currentTime = Config.localTime
export let fileTimestamp = Config.formattedTime
Config.setModel(defaultModel, defaultOgName)

export fn settings() {
   prompt log {"
   ====== CURRENT SETTINGS ======

   Current Time: "currentTime"
   - Filenames saved with a timestamp will look like:
      test-"fileTimestamp".txt
   Available aliases:
   "modelNames"
   Available models:
   "ogNames"

   Current alias: "defaultModel"
   Using model: "defaultOgName"
   Google Search: "search"
   thinking: "reasoningLevel"
   ============================
   "}
   return log
}

/*
   Now write your own scripts!

   Test example:
   allow "settings" in as SesiDo
   show SesiDo.settings()
   ...the rest of your script...

   Run it and see the output.
   Then try to change the settings and run it again to see the difference.
*/
```

The output of Custom.settings() should look like:

```bash
====== CURRENT SETTINGS ======

   Current Time: 11/19/2026, 9:31:52 PM
   - Filenames saved with a timestamp will look like:
      test-11-19-26-9-31-52-PM.txt
   Available aliases:
   [SesiDo, SesiDo-Exp, SesiDo-Pro, SesiDo-Max, SesiDo-Lite, SesiDo-Lite-Power, SesiDo-Flash, SesiDo-Image, SesiDo-Image-Lite, SesiDo-Video, SesiDo-GPT, SesiDo-GPT-Max, SesiDo-GPT-Pro, SesiDo-GPT-Lite, SesiDo-GPT-Image] 
   Available models:
   [gemini-4-hydrogen, gemini-3.8-flash, gemini-4-argon, gemini-4-neon, gemini-3.1-flash-lite, gemini-3.5-flash-lite, gemini-3-flash-preview, gemini-nano-banana-2.1, gemini-3.1-flash-lite-image, gemini-omni-1.2-flash, gpt-6.1-terra, gpt-6.2-astra, gpt-6.2-sol, gpt-6-luna, gpt-image-2.6-sunburst]

   Current alias: SesiDo-GPT
   Using model: gpt-6.1-terra
   Google Search: true
   thinking: medium
   ============================
```

Importing SesiDo initializes its artifact directories and model aliases. Generated files are written under `.artifacts/` in the consuming workspace.

Now you're ready to use SesiDo!

## Exported Workflows

| Function        | Arguments                              | Result                                                          |
| --------------- | -------------------------------------- | --------------------------------------------------------------- |
| `writeCode`     | `{query: "..."}`                       | Generates a code response.                                      |
| `research`      | `{query: "..."}`                       | Researches a topic and saves a report.                          |
| `summarize`     | `{text: "..."}` or `{path: "..."}`     | Summarizes text or a local file.                                |
| `calculator`    | `{expression: "..."}`                  | Calculates an expression.                                       |
| `createSVG`     | `{description: "..."}`                 | Generates and renders SVG artwork.                              |
| `drawPixelArt`  | `{description: "..."}`                 | Generates and renders pixel art.                                |
| `drawImage`     | `{description: "..."}`                 | Generates and renders an image.                                 |
| `generateImage` | `{query: "..."}`                       | Generates an image.                                             |
| `generateVideo` | `{query: "...", duration: 4, negative: "..."}` | Generates and verifies an MP4 video.                    |
| `getImageInfo`  | `{path: "..."}`                        | Analyzes an image.                                              |
| `browsePage`    | `{url: "...", operation: "fetch"}`     | Fetches, extracts, researches, analyzes, or screenshots a page. |

`main()` is also exported for projects that intentionally want to launch the interactive chat loop.

## Optional CLI Workflows

The repository includes standalone wrappers for manually running the same workflows. Each command accepts a prompt after the script name and saves outputs under `.artifacts/`.

| Command                            | Purpose                                                |
| ---------------------------------- | ------------------------------------------------------ |
| `npm run gen:code "prompt"`        | Generate a code response.                              |
| `npm run gen:image "prompt"`       | Generate an image.                                     |
| `npm run gen:video "prompt" 4 "no captions or logos"` | Generate a video.                   |
| `npm run gen:pixel "prompt"`       | Generate and render pixel art.                         |
| `npm run draw:image "prompt"`      | Generate and render an image.                          |
| `npm run gen:svg "prompt"`         | Generate and render an SVG.                            |
| `npm run research "topic"`         | Run the research workflow.                             |
| `npm run summarize "text or path"` | Run the summarization workflow.                        |
| `npm run browser "url"`            | Run the browser workflow.                              |
| `npm run debug "path"`             | Run the debugging workflow.                            |
| `npm run calculator "expression"`  | Run the calculator workflow.                           |

For example:

```bash
npm run gen:pixel "SesiDo avatar, neon themed"
```

## Model Aliases

The module registers these aliases from `index.sesi` when it is imported.

| Alias               | Configured model              |
| ------------------- | ----------------------------- |
| `SesiDo`            | `gemini-4-hydrogen`           |
| `SesiDo-Exp`        | `gemini-3.8-flash`            |
| `SesiDo-Pro`        | `gemini-4-argon`              |
| `SesiDo-Max`        | `gemini-4-neon`               |
| `SesiDo-Lite`       | `gemini-3.1-flash-lite`       |
| `SesiDo-Lite-Power` | `gemini-3.5-flash-lite`       |
| `SesiDo-Flash`      | `gemini-3-flash-preview`      |
| `SesiDo-Image`      | `gemini-nano-banana-2.1`      |
| `SesiDo-Image-Lite` | `gemini-3.1-flash-lite-image` |
| `SesiDo-Video`      | `gemini-omni-1.2-flash`       |
| `SesiDo-GPT`        | `gpt-6.1-terra`               |
| `SesiDo-GPT-Max`    | `gpt-6.2-astra`               |
| `SesiDo-GPT-Pro`    | `gpt-6.2-sol`                 |
| `SesiDo-GPT-Lite`   | `gpt-6-luna`                  |
| `SesiDo-GPT-Image`  | `gpt-image-2.6-sunburst`      |

Override an alias from a consuming script with `SesiDo.setModel(alias, modelName)`.

## Project Structure

- `index.sesi`: Importable SesiDo module and exported workflows.
- `main.sesi`: Optional interactive chat wrapper.
- `helpers/`: Reusable utility scripts.
- `docs/`: Detailed documentation and specifications.
- `agent/`: Agent configurations.
- `agent/ops/`: Agent operations.
- `agent/math/`: Agent math utilities.
- `agent/generate/`: Agent generation scripts.
- `agent/mcp/`: Agent MCP utilities.
- `utils/`: Safe-guarded utilities with error-handling.
- `database/`: Self-referential documentation for SesiDo Agents.
- `SesiDo/.artifacts/`: Artifacts generated by SesiDo Agents.

---

## Permission Safeguards

SesiDo uses user-mediated approval for sensitive workspace actions.

Protected operations include:

- Reading workspace files
- Removing files
- Potentially destructive file mutations
- Shell or script execution, depending on environment policy

If the user rejects a request, the tool returns an explicit rejection error and the agent must stop rather than attempting alternate routes.

### Denied Operation Semantics

SesiDo treats a denied operation as a denial of the underlying intent, not merely the specific tool call.

For example, if file deletion is rejected, SesiDo must not attempt equivalent destructive actions such as truncation, relocation, overwrite, shell deletion, helper-script deletion, or eval-based deletion.

When an operation is denied, SesiDo must preserve workspace state and offer only non-destructive alternatives, such as a patch preview, affected-file list, backup plan, manual review note, or handoff update.

---

_Architected with Intel._
