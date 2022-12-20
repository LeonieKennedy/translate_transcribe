# Duplicate Image Detector

---
## Files
- nllb_image/
    - *identify language in text and translate text*
    - Dockerfile
    - main.py
        - nllb_image api
    - nllb_model.py
        - processes input from main and returns final result to main
    - requirements.txt
 

- ui/
    - *User interface*
    - Dockerfile
    - requirements.txt
    - src/Components/App.js
      - ui which gets the user inputs and sends them to the relevant api


- whisper_image/
    - *transcribes and translates audio files*
    - requirements.tx
    - Dockerfile
    - audio_transcription_model.py
        - processes inputs from main and requrns final result to main
    - main.py
        - whisper_image api
    - requirements.txt
---
## How to run
**Spin up containers:**

    sudo docker compose up --build

**Go to url:**

ui: http://0.0.0.0:3000

nllb_api: http://0.0.0.0:8000/docs

whisper_api: http://0.0.0.0:8001/docs

---
## Output
**Translate text**
- Translation
 
**Identify text:**
- Identified language
- Score

**Transcribe audio:**   
- Transcribed audio file (translated/not translated)
