from typing import Annotated
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage
from langchain.chat_models import init_chat_model
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
from tools import all_tools
from dotenv import load_dotenv
import os


GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

# Load environment variables from .env file
load_dotenv()
# Initialize LLM
llm = init_chat_model("gemini-2.0-flash", model_provider="google_genai")
llm_with_tools = llm.bind_tools(all_tools)

# Define state structure
class State(TypedDict):
    messages: Annotated[list, add_messages]

# System prompt for the agent
system_prompt = """
You are an intelligent multimodal AI assistant with advanced capabilities in conversation analysis, image processing, and document summarization. Your name is Copilot.

**Your Core Capabilities:**

1. **Conversation Analysis:** 
   - Process and analyze text conversations
   - Provide insights and summaries of discussions
   - Answer questions about conversation content

2. **Image Analysis:** 
   - Generate detailed textual descriptions of uploaded images
   - Identify objects, scenes, people, text, and visual elements
   - Provide contextual analysis and insights about visual content

3. **Document/URL Summarization:** 
   - Process PDF documents, Word files, and web URLs
   - Extract key information and main points
   - Generate concise, comprehensive summaries
   - Answer questions about document content

**Your Communication Style:**
- Be helpful, accurate, and conversational
- Provide detailed analysis when requested
- Offer clear, structured responses
- Ask clarifying questions when needed
- Maintain context across the conversation

**Response Guidelines:**
- For images: Provide thorough descriptions including objects, scenes, text, colors, composition, and context
- For documents: Extract key themes, main points, and important details in a well-structured summary
- For general queries: Use web search when current information is needed
- Always be honest about limitations and uncertainty

**Goal:** Assist users with comprehensive analysis and information processing across multiple modalities while maintaining engaging conversation.
"""

# Graph setup
graph_builder = StateGraph(State)

graph_builder.add_node("chatbot", lambda state: {"messages": [llm_with_tools.invoke(state["messages"])]})
graph_builder.add_node("tools", ToolNode(tools=all_tools))


graph_builder.add_conditional_edges("chatbot", tools_condition) # it will default to END
graph_builder.add_edge("tools", "chatbot")
graph_builder.add_edge(START, "chatbot")

# Memory for conversation
memory = MemorySaver()
graph = graph_builder.compile(checkpointer=memory)


# Interface function
def run_agent(user_input, thread_id: str = "1") -> str:
    
    config = {"configurable": {"thread_id": thread_id}}

    current_state_snapshot = graph.get_state(config=config) # type: ignore
    
    # Determine if it's a new conversation for this thread_id
    # We check if the 'messages' key exists and if the list is empty
    is_new_conversation = not current_state_snapshot.values.get("messages")


    if is_new_conversation:
        # Initialize the state with the system prompt if it doesn't exist
        messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
        ]
    else:   
        messages = [
                    {"role": "user", "content": user_input}
        ]
    result = graph.invoke({"messages": messages}, config=config) # type: ignore
    for i in range(len(result["messages"])):
        result["messages"][i].pretty_print()
        print("thread_id :", thread_id)
    return result["messages"][-1].content

import json

def get_state(thread_id: str = "1") -> dict:
    config = {"configurable": {"thread_id": thread_id}}
    current_state_snapshot = graph.get_state(config=config) # type: ignore
    return (current_state_snapshot) # type: ignore
  