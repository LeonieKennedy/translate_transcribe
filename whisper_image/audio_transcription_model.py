import os
from datetime import datetime
from pydantic import BaseModel
import whisper
from contextlib import redirect_stdout
from io import StringIO


class Transcription(BaseModel):
    source_file: str
    transcription: str
    detected_language: str
    translation_time: float


class TranscriptionModel:

    def __init__(self):
        self._transcription_model = whisper.load_model("medium")

    def api_transcribe(self, audio_file_path, translate=False):
        if not os.path.exists(audio_file_path):
            return None
        start_time = datetime.now()
        captured_output = StringIO()
        with redirect_stdout(captured_output):
            if translate:
                result = self._transcription_model.transcribe(audio_file_path, task='translate')
            else:
                result = self._transcription_model.transcribe(audio_file_path)
        end_time = datetime.now()
        time_taken = (end_time - start_time).total_seconds()
        try:
            detected_lang = captured_output.getvalue().split(":")[1].strip()
        except:
            detected_lang = "Unknown"
        results_dict = {
            "source_file": audio_file_path,
            "transcription": result['text'],
            "detected_language": detected_lang,
            'translation_time': time_taken
        }
        return results_dict
