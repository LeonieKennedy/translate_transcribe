from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from audio_transcription_model import TranscriptionModel, Transcription
import shutil
from pathlib import Path
from tempfile import NamedTemporaryFile

app = FastAPI()

# Added by L
origins = [
    "http://localhost:8001",
    "http://localhost:8000",
    "http://localhost:3000",
    "http://0.0.0.0:8001",
    "http://0.0.0.0:8000",
    "http://0.0.0.0:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"])

model = TranscriptionModel()


@app.post("/transcribe", response_model=Transcription)
def transcribe(audio_file: UploadFile, translate: bool = False) -> Transcription:
    tmp_path = save_upload_file_tmp(audio_file)
    result = model.api_transcribe(str(tmp_path), translate)
    tmp_path.unlink()
    return result


def save_upload_file_tmp(upload_file: UploadFile) -> Path:
    try:
        suffix = Path(upload_file.filename).suffix
        with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(upload_file.file, tmp)
            tmp_path = Path(tmp.name)
    finally:
        upload_file.file.close()
    return tmp_path
