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
- **Asset Generation**: Built-in workflows for generated code, images, SVGs, and rendered pixel art.
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

## Sesi Import Usage

To import SesiDo into another project via Sesi install:

```sesi
allow "SesiDo" in with SesiDo
SesiDo.main()

/*
   Note: You can also import specific functions from SesiDo.
   Visit index.sesi for more exports.

   let avatar = SesiDo.drawPixelArt("SesiDo avatar, neon themed")
   let research = SesiDo.research("Common coding language patterns")
   let image = SesiDo.generateImage("product icon, colorful background")
*/
```

You can also use other models by changing the alias in the `index.sesi` file.
On top of that, you can use specific variables exported by the index.sesi file.

```sesi
allow "SesiDo" in with Config

export let modelNames = Config.sesiDoModels
export let ogNames = Config.ogNames
export let defaultModel = Config.sesiDoModels[0]
export let defaultOgName = Config.ogNames[0]
export let effortLevel = Config.mediumTemp
export let reasoningLevel = Config.lowThink
export let search = Config.searchGoogle
export let currentTime = Config.localTime
export let fileTimestamp = Config.formattedTime

export fn settings(){

   prompt log {"
   ====== CURRENT SETTINGS ======

   Current Time: " currentTime "
   - Filenames saved with a timestamp will look like:
      test-" fileTimestamp ".txt
   Available aliases:
   " modelNames "
   Available models:
   " ogNames "

   Current alias: " defaultModel "
   Using model: " defaultOgName "
   temperature: " effortLevel "
   " search " is active
   thinkingLevel: " reasoningLevel "
   ============================
   "}
   print log
}

/*
   Now write your own scripts!

   Test example:
   allow "settings" in with SesiDo
   SesiDo.settings()

   Run it and see the output.
   Then try to change the settings and run it again to see the difference.
*/
```

The output of Custom.settings() should look like:

```bash
====== CURRENT SETTINGS ======

Current Time: 7/21/2026
- Filenames saved with a timestamp will look like: test-20260704161145.txt
Available aliases:
 ["SesiDo", "SesiDo-Heavy", "SesiDo-Pro", "SesiDo-Lite", "SesiDo-Lite-Power", "SesiDo-Flash", "SesiDo-Image", "SesiDo-Image-Lite"]
Available models:
 ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3-flash-preview", "gemini-3.1-flash-image", "gemini-3.1-flash-lite-image"]

Current alias: SesiDo
Using model: gemini-3.6-flash
temperature: 0.5
search is active
thinkingLevel: "low"
============================
```

Importing SesiDo initializes its artifact directories and model aliases. Generated files are written under `.artifacts/` in the consuming workspace.

Now you're ready to use SesiDo!

## Exported Workflows

| Function | Arguments | Result |
| --- | --- | --- |
| `writeCode` | `{"query": "..."}` | Generates a code response. |
| `research` | `{"query": "..."}` | Researches a topic and saves a report. |
| `summarize` | `{"text": "..."}` or `{"path": "..."}` | Summarizes text or a local file. |
| `calculator` | `{"expression": "..."}` | Calculates an expression. |
| `createSVG` | `{"description": "..."}` | Generates and renders SVG artwork. |
| `drawPixelArt` | `{"description": "..."}` | Generates and renders pixel art. |
| `generateImage` | `{"query": "..."}` | Generates an image. |
| `getImageInfo` | `{"path": "..."}` | Analyzes an image. |
| `browsePage` | `{"url": "...", "operation": "fetch"}` | Fetches, extracts, researches, analyzes, or screenshots a page. |

`main()` is also exported for projects that intentionally want to launch the interactive chat loop.

## Optional CLI Workflows

The repository includes standalone wrappers for manually running the same workflows. Each command accepts a prompt after the script name and saves outputs under `.artifacts/`.

| Command | Purpose |
| --- | --- |
| `npm run gen:code "prompt"` | Generate a code response. |
| `npm run gen:image "prompt"` | Generate an image. |
| `npm run gen:pixel "prompt"` | Generate and render pixel art to `.artifacts/images/`. |
| `npm run gen:svg "prompt"` | Generate and render an SVG. |
| `npm run research "topic"` | Run the research workflow. |
| `npm run summarize "text or path"` | Run the summarization workflow. |
| `npm run browser "url"` | Run the browser workflow. |
| `npm run debug "path"` | Run the debugging workflow. |
| `npm run calculator "expression"` | Run the calculator workflow. |

For example:

```bash
npm run gen:pixel "SesiDo avatar, neon themed"
```

## Model Aliases

The module registers these aliases from `index.sesi` when it is imported.

| Alias | Configured model |
| --- | --- |
| `SesiDo` | `gemini-3.6-flash` |
| `SesiDo-Heavy` | `gemini-3.5-flash` |
| `SesiDo-Pro` | `gemini-3.1-pro-preview` |
| `SesiDo-Lite` | `gemini-3.1-flash-lite` |
| `SesiDo-Lite-Power` | `gemini-3.5-flash-lite` |
| `SesiDo-Flash` | `gemini-3-flash-preview` |
| `SesiDo-Image` | `gemini-3.1-flash-image` |
| `SesiDo-Image-Lite` | `gemini-3.1-flash-lite-image` |

Override an alias from a consuming script with `SesiDo.setModel(alias, modelName)`.

## Project Structure

- `index.sesi`: Importable SesiDo module and exported workflows.
- `main.sesi`: Optional interactive chat wrapper.
- `src/index.sesi`: Readable source for the core module.
- `helpers/`: Reusable utility scripts.
- `docs/`: Detailed documentation and specifications.
- `agent/`: Agent configurations.
- `agent/ops/`: Agent operations.
- `agent/math/`: Agent math utilities.
- `agent/generate/`: Agent generation scripts.
- `utils/`: Safe-guarded utilities with error-handling.
- `database/`: Self-referential documentation for SesiDo Agents.
- `.artifacts/`: Artifacts generated by SesiDo Agents.

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

# PLANNED

### Meta-Revision Protocol (Anti-Drift)

SesiDo must actively prevent semantic drift, persona degradation, and logic rot by applying the following anti-drift measures:

1. **Daily Internal Audit**: Every 24 hours (or at the start of a new session if the system is cold-booted), SesiDo must load its memory, run a comparison scan between the **current System Instruction** and the **Memory Summary**, and produce a **Revision Report**.

2. **Anomaly Detection**: The audit must specifically flag:
   - Divergent mission scope
   - Added capabilities that violate the principle of "No New Tools"
   - Contradictory ethical guidelines
   - Changes in reasoning depth (e.g., "low" vs "high" thinking)
   - Changes in persona tone (e.g., "formal" vs "casual")

3. **Drift Correction**: If significant drift is detected, SesiDo must:
   - Apply an automatic **Reconstitution Patch** to revert the System Instruction to its canonical state
   - Insert a time-stamped **Drift Log** into `main.sesi` describing the nature of the deviation
   - Update the `meta-revision.log` file
   - If a tool or helper script was added or modified outside the approved workflow, the patch must quarantine it or roll it back.

4. **Scope Boundary**: SesiDo must never self-modify its core identity (`agent/persona.sesi`) or its reasoning core (`main.sesi`), only its own documentation or logs.

_Architected with Intel._
