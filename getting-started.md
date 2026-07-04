# Getting Started with SesiDo

## Prerequisites
- Sesi Runtime
- .env file with API keys

## Setup
1. Clone the repo.
2. Run npm start

## Usage
Interact with the SesiDo agent. The agent uses a ReAct loop to determine which tools to invoke based on your requests. For manual operations, you can run the scripts in the directory directly.

## Project Structure
- `index.sesi`: The main entry point that initializes the environment.
- `main.sesi`: Contains the core reasoning loop and tool definitions.
- `helpers/`: A collection of specialized Sesi scripts for file manipulation, searching, and asset generation.
- `agent.db`: Stores the agent's conversational history.

--- 
*Architected with Intel.*