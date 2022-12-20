FROM python:latest
RUN apt update && apt full-upgrade -y
RUN apt install -y ffmpeg
RUN apt install -y git
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
RUN pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu116
RUN pip install git+https://github.com/openai/whisper.git
COPY . .
EXPOSE 8000
ENTRYPOINT ["uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
