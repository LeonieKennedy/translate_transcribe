FROM python:latest
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
RUN pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu116

RUN apt update
RUN apt install npm -y

COPY . .
EXPOSE 3000
ENTRYPOINT ["npm", "start", "--host", "0.0.0.0", "--port", "3000"]
