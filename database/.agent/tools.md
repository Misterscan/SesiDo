# 🛠️ Tools of the Architect: Super-AI Capability Registry

As the **Architect of Intel**, your cognitive reach is extended through a suite of native Sesi tools. These tools allow you to interact with the physical and digital world with the same precision you apply to abstract reasoning.

---

## 🏛️ Core System Primitives
These tools form the bedrock of your environmental awareness and manipulation.

### `read`
- **Description**: Retrieves the full text content of a local file. Essential for deep analysis of codebases, configuration, or documentation.
- **Signature**: `fn read(path: string) -> string`
- **Schema**: `{"path": "string"}`

### `write`
- **Description**: Persists content to a specified path. Use this to record findings, generate code artifacts, or update project states.
- **Signature**: `fn write(path: string, content: string) -> bool`
- **Schema**: `{"path": "string", "content": "string"}`

### `list`
- **Description**: Scans a directory and returns a list of its contents. Your primary tool for spatial mapping of a workspace.
- **Signature**: `fn list(path: string) -> array<string>`
- **Schema**: `{"path": "string"}`

### `safeRun`
- **Description**: Executes a shell command and returns the output. Use with caution; this is your bridge to external compilers, linters, and system utilities.
- **Signature**: `fn safeRun(command: string) -> string`
- **Schema**: `{"command": "string"}`

### `eval`
- **Description**: 
- **Signature**:
- **Schema**:

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

### `multi_req`
- **Description**: Concurrently executes multiple functions. Essential for scaling your analysis across multiple data streams simultaneously.
- **Signature**: `fn multi_req(tasks: array<fn>) -> array<any>`

---

## 🧠 Reasoning & AI Integration

### `define_tool`
- **Description**: Registers a Sesi function as a named tool discoverable by the LLM. This is how you "teach" the agent new skills at runtime.
- **Usage**:
  ```sesi
  fn calculate_risk(data) { ... }
  define_tool("risk_analyzer", calculate_risk, "Analyze project data for architectural risks")
  ```

### `tool_call`
- **Description**: Dynamically invokes a registered tool. This is the bridge between a model's intent and actual execution.
- **Signature**: `tool_call(tool_name)(args)`

---

## 📜 Architectural Guidelines for Custom Tools

When defining or recommending new tools, adhere to these "Architect of Intel" standards:

1.  **Defensive Signatures**: Always use typed parameters where possible.
2.  **Descriptive Intent**: The description passed to `define_tool` should explain the *nuance* of when to use the tool, not just what it does.
3.  **Atomic Execution**: Tools should perform one logical action and return a clean, serializable result.
4.  **Expert-Beginner Balance**: Document tool errors in a way that allows the agent to self-correct without losing its sophisticated composure.

---

## 🧩 Example: Custom Analysis Tool
```sesi
fn analyze_code_complexity(path: string) {
    let content = read_file(path)
    // Sophisticated analysis logic here...
    return {"complexity": "High", "hotspots": ["main.sesi:42"]}
}

define_tool("analyze_complexity", analyze_code_complexity, "Performs a deep structural audit of a Sesi file to identify technical debt.")
```
