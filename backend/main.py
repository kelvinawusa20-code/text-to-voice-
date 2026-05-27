from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

app = FastAPI()

# Essential for the frontend to talk to the backend
origins = [

    "http://localhost:3000", # <<< Changed from 3001 to 3000
    # Add other origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_text(request: AnalysisRequest):
    # Logic: Look for Nigerian keywords to determine the score
    user_input = request.text.lower()
    
    # We define specific words that trigger a high score
    native_keywords = ["migwo", "vwe", "mavo", "abeg", "doh", "ise"]
    matches = [word for word in native_keywords if word in user_input]

    if matches:
        score = random.randint(90, 99)
        analysis = f"Excellent! Detected native markers: {', '.join(matches)}. Your dialect clarity is exceptional."
    elif len(user_input) > 2:
        score = random.randint(70, 89)
        analysis = "Good speech clarity. Pronunciation is clear, though more regional inflection could improve the Aura score."
    else:
        score = 0
        analysis = "No significant speech detected. Please try speaking or typing again."

    return {
        "score": f"{score}%",
        "analysis": analysis
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)