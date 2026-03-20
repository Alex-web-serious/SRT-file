from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import os
import re
import tempfile
from groq import Groq
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def validate_srt(text: str) -> bool:
    pattern = r'\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\n.+'
    return bool(re.search(pattern, text.strip()))

@app.post("/transcribe-audio")
async def transcribe_audio(file: UploadFile = File(...)):
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    if ext not in ['mp3', 'm4a', 'aac']:
        raise HTTPException(status_code=400, detail="Unsupported format. Please upload mp3, m4a, or aac.")
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        
        with open(tmp_path, "rb") as audio_file:
            transcription = groq_client.audio.transcriptions.create(
                file=(file.filename, audio_file.read()),
                model="whisper-large-v3",
                response_format="srt"
            )
        os.remove(tmp_path)
        
        if not validate_srt(transcription):
            raise HTTPException(status_code=500, detail="Transcription failed. Please try again.")
            
        return PlainTextResponse(transcription)
    except Exception as e:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise HTTPException(status_code=500, detail="Transcription failed. Please try again.")

class SRTRequest(BaseModel):
    srt: str

@app.post("/style-srt")
async def style_srt(req: SRTRequest):
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = "You are a subtitle editor. Improve the readability of the following SRT subtitles.\nRules:\n- Do NOT change any timestamps\n- Do NOT change subtitle numbering or segmentation\n- Add punctuation where missing\n- Capitalize the first word of each subtitle\n- Use ALL CAPS for important or emphasis words\n- Return ONLY valid SRT format, nothing else\n\n" + req.srt
        response = model.generate_content(prompt)
        result = response.text
        
        if not validate_srt(result):
            raise HTTPException(status_code=500, detail="Styling failed. Original content preserved.")
            
        return PlainTextResponse(result)
    except Exception:
        raise HTTPException(status_code=500, detail="Styling failed. Original content preserved.")

@app.post("/convert-hinglish")
async def convert_hinglish(req: SRTRequest):
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = "You are a transliteration tool. Convert all Hindi text (Devanagari script) in the following SRT subtitles to Hinglish (Hindi words written in English/Roman letters).\nRules:\n- Do NOT translate the meaning\n- Do NOT change timestamps\n- Do NOT change subtitle numbering or segmentation\n- Only convert Devanagari script to Roman letters phonetically\n- Leave any text already in English as-is\n- Return ONLY valid SRT format, nothing else\n\n" + req.srt
        response = model.generate_content(prompt)
        result = response.text
        
        if not validate_srt(result):
            raise HTTPException(status_code=500, detail="Conversion failed. Original content preserved.")
            
        return PlainTextResponse(result)
    except Exception:
        raise HTTPException(status_code=500, detail="Conversion failed. Original content preserved.")
