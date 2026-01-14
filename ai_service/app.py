from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
# Assuming the second file is named 'graph.py'
from graph import graph 
import os
import uvicorn

load_dotenv()
app = FastAPI()

class ResumeRequest(BaseModel):
    resume_text: str
    job_description: str = None
    job_title: str = None

@app.get("/")
async def root():
    return {"message": "Resume Ranker AI Service is running."}

@app.post("/analyze_resume")
async def analyze_resume(request: ResumeRequest):
    initial_state = {
        "resume_text": request.resume_text,
        "job_description": request.job_description or "",
        "job_title": request.job_title or "",
        # Initialize defaults
        "ats_score": 0.0,
        "improvements": [],
        "role_detected": "",
        "keywords_matched": [],
        "keywords_missing": [],
        "summary": ""
    }
    try:
        # Invoke the graph
        result = graph.invoke(initial_state)
        
        return {
            "ats_score": result.get("ats_score"),
            "improvements": result.get("improvements"),
            "role_detected": result.get("role_detected"),
            "keywords_matched": result.get("keywords_matched"),
            "keywords_missing": result.get("keywords_missing"),
            "summary": result.get("summary")
        }
    except Exception as e:
        print(f"Error: {e}") # helpful for debugging logs
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)