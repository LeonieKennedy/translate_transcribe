from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from nllb_model import Model, FTLangDetect, Translation
from pydantic import BaseModel

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

model = Model()
lang_detect = FTLangDetect()


@app.get("/get_languages")
def get_languages(shortcode: bool = False) -> list[str]:
    return model.get_languages(shortcode)


@app.post("/language_detection")
def detect_language(text: str, k: int = 1, shortcode: bool = False) -> dict[str, float]:
    return lang_detect.detect_language(text, k, shortcode)


@app.post("/translate", response_model=Translation)
def translate(text: str, target_lang: str = "eng_Latn", source_lang: str = None) -> Translation:
    return model.translate(text, target_lang, source_lang)


@app.get("/language_code_mapping")
def get_language_code_mapping() -> dict[str, str]:
    return model.get_language_code_mapping()
