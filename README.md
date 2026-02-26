# Atlas Playground:  my-atlas-playground
An end-to-end single-agent application using ADK and AG-UI

## Overview
Atlas Playground is a full-stack application that 
provides users with both real-time weather information and geographic context. To support real-time interactions, our agents are equipped with tools that retrieve live weather data and interact with the Google Maps API. Built with Python and Next.js, the application demonstrates how to integrate AG-UI with ADK to create engaging, agentic user experiences.
This demo app is based on a blog post by Henry Ruiz shown [here](https://medium.com/google-cloud/building-interactive-agentic-applications-using-adk-and-ag-ui-protocol-3a49ae6d3dc9)

### Backend
- **Language**: Python (>=3.12)
- **Framework**: FastAPI
- **Libraries & tools**: 
  - `ag-ui-adk`: Agent Development Kit for AG-ui integration
  - `google-genai`: Google Generative AI SDK
  - `googlemaps`: Google Maps Services
  - `google-adk`: Google Agent Development Kit
  - `uv`: Python package manager

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4
- **Libraries**:
  - `@ag-ui/client`: Client-side AG-UI integration
  - `@copilotkit/react-core`: CopilotKit AG-UI components
  - `@vis.gl/react-google-maps`: Google Maps react components.

## Prerequisites
- Python 3.12 or higher
- Node.js and npm
- Google Cloud API Keys (Maps, GenAI)

## Setup
After cloning the repository you will have: 

### 1. Backend Setup
The backend is located in the root directory.

1.  **Install Dependencies**:
    This project uses `pyproject.toml`. You can install dependencies using `uv` or `pip`.
    ```bash
    # Using uv (recommended)
    uv sync

    # Or using pip
    pip install .
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root directory and configure necessary API keys (e.g., `GOOGLE_API_KEY` for GenAI, `GOOGLE_MAPS_API_KEY`).

3.  **Run the Server**:
    ```bash
    python main.py
    ```
    The backend API will start at `http://localhost:8000`.

### 2. Frontend Setup
The frontend code is located in the `ui` directory.

1.  **Navigate to the UI directory**:
    ```bash
    cd ui
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    
    # or using yarn
    yarn install
    ```
3.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:3000`.

## Project Structure
- `agents/`: Contains the logic for the AI agents (e.g., `atlas_agent`).
- `ui/`: The Next.js frontend application.
- `main.py`: The entry point for the FastAPI backend server.
- `pyproject.toml`: Python project configuration and dependencies.

## Run with uv
Per [adk-docs](https://google.github.io/adk-docs/)
Agent Development Kit (ADK) is a flexible and modular framework for developing and deploying AI agents. While optimized for Gemini and the Google ecosystem, ADK is model-agnostic, deployment-agnostic, and is built for compatibility with other frameworks.
It runs under LLMLite

```bash
adk web --reload --port=8001
```

Use ADK from the project root and point it at the `agents` folder (the parent directory of your agent packages):

```bash
cd <your_proyect_root>
uv run adk web agents
```

Alternative (run from inside `agents`):

```bash
cd <your_proyect_root>/agents
uv run adk web
```

## Why "Failed to load agents" happens

`adk web` expects an **agents directory** where each subfolder is one agent and contains `__init__.py` and `agent.py`.

In this project:
- agents directory: `agents`
- agent package: `agents/atlas_agent`

If you run from `agents/atlas_agent` (or point ADK at the wrong folder), the UI may show "Failed to load agents".

## Quick check

To verify the agent loads correctly in CLI mode:

```bash
cd  <your_proyect_root>
uv run adk run agents/atlas_agent
```


