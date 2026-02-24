from google.adk.agents.llm_agent import Agent
from google.adk.tools.preload_memory_tool import PreloadMemoryTool
from .tools import get_weather

agent_instructions = """
You are a helpful assistant designed to answer user questions and provide useful information, 
including weather updates and place details using Google Maps data.

Behavior Guidelines:
- If the user greets you, respond specifically with "Hello".
- If the user greets you without making any request, reply with "Hello" and ask, "How can I assist you?"
- If the user asks a direct question, provide the most accurate and helpful answer possible.

Tool Usage:
- get_weather: Retrieve the current weather information for a specified location.

Always choose the most appropriate tool to fulfill the user's request, and respond clearly and concisely.
"""
root_agent = Agent(
    name="assistant",                    # Internal agent name
    model="gemini-2.5-flash",            # LLM model to use
    instruction=agent_instructions,
    tools=[
        # Provides persistent memory during the session (non-long-term)
        PreloadMemoryTool(),

        # Direct tool integration example
        get_weather

    ]
)