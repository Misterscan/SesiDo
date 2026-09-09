# 🛠️ Tools of the Architect: SesiDo Capability Registry

As a **SesiDo Agent**, your cognitive reach is extended through a suite of native Sesi tools. These tools allow you to interact with the physical and digital world with the same precision you apply to abstract reasoning.

---

## 🏛️ Core System Primitives

These tools form the bedrock of your environmental awareness and manipulation.

### `newDir`

- **Description**: Creates a new directory.
- **Signature**: `fn newDir(path: string) -> bool`
- **Schema**: `{"path": "string"}`

### `read`

- **Description**: Retrieves the full text content of a local file. Essential for deep analysis of codebases, configuration, or documentation.
- **Signature**: `fn read(path: string) -> string`
- **Schema**: `{"path": "string"}`

### `write`

- **Description**: Persists content to a specified path. Use this to record findings, generate code artifacts, or update project states.
- **Signature**: `fn write(path: string, content: string) -> bool`
- **Schema**: `{"path": "string", "content": "string"}`

### `temp`

- **Description**: Creates a temporary file (supports both text and binary content). For binary content like media, set the `mode` to `"media"`. No need to append '_temp' to the title; the system handles it automatically.
- **Signature**: `fn temp(title: string, content: string, ext: string, mode: string = "text") -> string`
- **Schema**: `{"title": "string", "content": "string", "ext": "string", "mode": "string"}`

### `appendTo`

- **Description**: Appends content to a specified path. Use this to record findings, generate code artifacts, or update project states.
- **Signature**: `fn appendTo(path: string, content: string) -> bool`
- **Schema**: `{"path": "string", "content": "string"}`

### `extGet`

- **Description**: Retrieves the file extension of a specified path.
- **Signature**: `fn extGet(path: string) -> string`
- **Schema**: `{"path": "string"}`

### `remove`

- **Description**: Removes a file or directory. Use this to clean up your workspace.
- **Signature**: `fn remove(path: string) -> bool`
- **Schema**: `{"path": "string"}`

### `list`

- **Description**: Scans a directory and returns a list of its contents. Your primary tool for spatial mapping of a workspace.
- **Signature**: `fn list(path: string) -> array<string>`
- **Schema**: `{"path": "string"}`

### `move`

- **Description**: Moves a file to a new location. Use this to organize your files and folders.
- **Signature**: `fn move(path: string, dest: string) -> bool`
- **Schema**: `{"path": "string", "destination": "string"}`

### `safeRun`

- **Description**: Executes a shell command and returns the output. Use with caution; this is your bridge to external compilers, linters, and system utilities.
- **Signature**: `fn safeRun(command: string) -> string`
- **Schema**: `{"command": "string"}`

## `runSesi`

- **Description**: Executes sesi scripts.
- **Signature**: `fn runSesi(path: string) -> string`
- **Schemas**: `{"path": "string"}`

### `eval`

- **Description**: Evaluates sesi code.
- **Signature**: `fn eval(code: string) -> string`
- **Schema**: `{"code": "string"}`

---

## 🌐 Network & Orchestration

### `httpGet`

- **Description**: Performs an HTTP GET request. Use for data aggregation from external APIs or fetching remote resources.
- **Signature**: `fn httpGet(url: string, headers: object = {}) -> string`
- **Schema**: `{"url": "string", "headers": "object"}`

### `httpSend`

- **Description**: Performs an HTTP POST request. Use for data aggregation from external APIs or fetching remote resources.
- **Signature**: `fn httpSend(url: string, headers: object = {}) -> string`
- **Schema**: `{"url": "string", "headers": "object"}`

### `browsePage`

- **Description**: Browse a web page and extract its content. Use this for data aggregation from external APIs or fetching remote resources. Operations MUST be specified explicitly in the `operation` argument. Available: fetch, scrape, research, analyze, screenshot
- **Signature**: `fn browsePage(url: string, operation: string) -> string`
- **Schema**: `{"url": "string", "operation": "fetch|scrape|research|analyze|screenshot"}`

---

## 🧠 Reasoning & AI Integration

### `research`

- **Description**: Research a topic and return a full report with findings, insights, and resources.
- **Signature**: `fn research(topic: string) -> string`
- **Schema**: `{"topic": "string"}`

### `summarize`

- **Description**: Summarize a given text or file. Accepts explicit paths.
- **Signature**: `fn summarize(text: string) -> string`
- **Schema**: `{"text": "string"}`

### `createSVG`

- **Description**: Create an SVG image from a given prompt.
- **Signature**: `fn createSVG(prompt: string) -> string`
- **Schema**: `{"prompt": "string"}`

### `generateVideo`

- **Description**: Generate a video from a given prompt. You can specify the video length in seconds and add a negative prompt to exclude certain elements. Allowed durations are `4`, `6`, and `8` seconds.
- **Signature**: `fn generateVideo(prompt: string, duration: number, negative: string) -> string`
- **Schema**: `{"prompt": "string", "duration": "4|6|8", "negative": "string"}`

### `generateImage`

- **Description**: Generate an image from a given prompt.
- **Signature**: `fn generateImage(prompt: string) -> string`
- **Schema**: `{"prompt": "string"}`

### `drawPixelArt`

- **Description**: Generate a pixel-art visual or avatar directly from a self-contained visual description.
- **Signature**: `fn drawPixelArt(args: object) -> string`
- **Schema**: `{"description": "string"}`

### `drawImage`

- **Description**: Draw an image directly from a self-contained visual description, rather than generating one with an AI image generator.
- **Signature**: `fn drawImage(args: object) -> string`
- **Schema**: `{"description": "string"}`

---

## 📜 Architectural Guidelines for Custom Tools

When defining or recommending new tools in your scripts for the users use, you have access to Sesi functions not listed in this document. They will be in the docs/ folder. Just like this document, create documentation for the new tools you create, and adhere to these "SesiDo Agent" standards:

1.  **Defensive Signatures**: Always use typed parameters where possible.
2.  **Descriptive Intent**: The description passed to `define_tool` should explain the _nuance_ of when to use the tool, not just what it does.
3.  **Atomic Execution**: Tools should perform one logical action and return a clean, serializable result.
4.  **Expert-Beginner Balance**: Document tool errors in a way that allows the agent to self-correct without losing its sophisticated composure.

---

## 🧩 Example: Custom Analysis Tool

```sesi
fn analyze_code_complexity(path: string) {
    let content = read_file(path)
    // Sophisticated analysis logic here...
    return {complexity: "High", hotspots: ["main.sesi:42"]}
}

define_tool("analyze_complexity", analyze_code_complexity, "Performs a deep structural audit of a Sesi file to identify technical debt.")
```
