from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import os
import re
import tempfile
from groq import Groq
import google.generativeai as genai
from dotenv import load_dotenv

# Load env
load_dotenv()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ENV variables
groq_api_key = os.getenv("GROQ_API_KEY")
google_api_key = os.getenv("GOOGLE_API_KEY")

if not groq_api_key:
    raise Exception("GROQ_API_KEY not found")

if not google_api_key:
    raise Exception("GOOGLE_API_KEY not found")

groq_client = Groq(api_key=groq_api_key)
genai.configure(api_key=google_api_key)


# ---------- SRT HELPERS ----------

def format_time(seconds: float) -> str:
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hrs:02}:{mins:02}:{secs:02},{millis:03}"


def json_to_srt(segments):
    srt = ""
    for i, seg in enumerate(segments, start=1):
        start = format_time(seg['start'])
        end = format_time(seg['end'])
        text = seg['text'].strip()
        srt += f"{i}\n{start} --> {end}\n{text}\n\n"
    return srt


def validate_srt(text: str) -> bool:
    pattern = r'\d+\n\d{2}:\d{2}:\d{2},\d{3} -->'
    return bool(re.search(pattern, text.strip()))


# ---------- TRANSCRIBE ----------

@app.post("/transcribe-audio")
async def transcribe_audio(file: UploadFile = File(...)):
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''

    if ext not in ['mp3', 'm4a', 'aac']:
        raise HTTPException(status_code=400, detail="Unsupported format")

    tmp_path = None

    try:
        # Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Call Groq API (FIXED)
        with open(tmp_path, "rb") as audio_file:
            response = groq_client.audio.transcriptions.create(
                file=(file.filename, audio_file.read()),
                model="whisper-large-v3",
                response_format="verbose_json"
            )

        # Convert JSON → SRT
        segments = response.segments
        srt_text = json_to_srt(segments)

        if not validate_srt(srt_text):
            print("WARNING: SRT validation failed")

        return PlainTextResponse(srt_text)

    except Exception as e:
        print("TRANSCRIPTION ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


# ---------- REQUEST MODEL ----------

class SRTRequest(BaseModel):
    srt: str


# ---------- STYLE SRT ----------

@app.post("/style-srt")
async def style_srt(req: SRTRequest):
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')

        prompt = (
            "You are a subtitle editor. Improve readability of SRT subtitles.\n"
            "Rules:\n"
            "- Do NOT change timestamps\n"
            "- Do NOT change numbering\n"
            "- Add punctuation\n"
            "- Capitalize sentences\n"
            "- Use ALL CAPS for emphasis\n"
            "- Return ONLY valid SRT\n\n"
            + req.srt
        )

        response = model.generate_content(prompt)
        result = response.text

        return PlainTextResponse(result)

    except Exception as e:
        print("STYLE ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ---------- CONVERT HINGLISH ----------

@app.post("/convert-hinglish")
async def convert_hinglish(req: SRTRequest):
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')

        prompt = (
            "Convert Hindi (Devanagari) text to Hinglish.\n"
            "Rules:\n"
            "- Do NOT translate meaning\n"
            "- Do NOT change timestamps\n"
            "- Do NOT change numbering\n"
            "- Only transliterate Hindi\n"
            "- Return ONLY valid SRT\n\n"
            + req.srt
        )

        response = model.generate_content(prompt)
        result = response.text

        return PlainTextResponse(result)

    except Exception as e:
        print("HINGLISH ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
