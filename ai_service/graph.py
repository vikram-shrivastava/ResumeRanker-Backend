from typing_extensions import TypedDict
from typing import List, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain.chat_models import init_chat_model
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, START, END
from dotenv import load_dotenv
import os

load_dotenv()

class State(TypedDict):
    resume_text: str
    job_description: str
    job_title: str
    ats_score: float
    improvements: List[str]
    keywords_matched: List[str]
    keywords_missing: List[str]
    summary: str
    role_detected: str

class ResumeAnalysisOutput(BaseModel):
    total_score: float = Field(description="The calculated ATS score out of 100")
    improvement_points: List[str] = Field(description="List of specific improvements")
    detected_role: str = Field(description="The role detected (Tech/Non-Tech)")
    matched_keywords: List[str] = Field(description="List of at max top 5 matching keywords found")
    missing_keywords: List[str] = Field(description="List of at max top 5 missing keywords that should be included")
    summary: str = Field(description="Summary of the resume analysis")

llm = init_chat_model(model_provider="openai", model="gpt-4.1")
structured_llm = llm.with_structured_output(ResumeAnalysisOutput)

# 4. Define the Node Logic
def resumeanalyzer(state: State):
    # Construct the prompt securely
    system_text = """You are an expert hiring manager specializing in evaluating resumes.
    Analyze the resume based on the job description and title provided.
    
    Follow these scoring rules:
    1. Check if user is applying for Tech vs Non-Tech and Intern vs Full-time.
    2. Check for necessary sections (Score /30).
    3. Extract keywords from JD and compare (Score /50).
    4. Evaluate formatting and length (Score /10).
    5. Assess professionalism (Score /10).
    
    Sum these for the Total Score.
    """

    user_content = f"""
    RESUME TEXT:
    {state['resume_text']}
    
    JOB DESCRIPTION:
    {state['job_description'] or "Not Provided"}
    
    JOB TITLE:
    {state['job_title'] or "Not Provided"}
    """

    messages = [
        SystemMessage(content=system_text),
        HumanMessage(content=user_content)
    ]

    # Invoke LLM with structured output
    # This automatically parses the JSON and handles the format
    response = structured_llm.invoke(messages)

    # Update State
    return {
        "ats_score": response.total_score,
        "improvements": response.improvement_points,
        "role_detected": response.detected_role,
        "keywords_matched": response.matched_keywords,
        "keywords_missing": response.missing_keywords,
        "summary": response.summary
    }

# 5. Build Graph
graph_builder = StateGraph(State)

# We only need one node because the LLM has all the data it needs
graph_builder.add_node("resumeanalyzer", resumeanalyzer)

graph_builder.add_edge(START, "resumeanalyzer")
graph_builder.add_edge("resumeanalyzer", END)

graph = graph_builder.compile()