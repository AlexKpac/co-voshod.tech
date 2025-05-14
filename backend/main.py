# backend/main.py
import os
import requests
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
from typing import Optional, List, Dict
import tempfile
from PIL import Image
import pytesseract
import io
import base64
import json
import re

# Загружаем переменные окружения (API-ключи)
load_dotenv()
deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
gemini_api_key = os.getenv("GEMINI_API_KEY")

if not deepseek_api_key:
    raise ValueError("Не найден DEEPSEEK_API_KEY в переменных окружения.")
if not gemini_api_key:
    raise ValueError("Не найден GEMINI_API_KEY в переменных окружения.")

# Настраиваем Gemini
genai.configure(api_key=gemini_api_key)
gemini_model = genai.GenerativeModel('gemini-2.5-pro-exp-03-25')
gemini_vision_model = genai.GenerativeModel('gemini-2.5-pro-exp-03-25')

# URL для DeepSeek API
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

# Создаем FastAPI приложение
app = FastAPI()

# Настраиваем CORS (Cross-Origin Resource Sharing)
# Это позволяет фронтенду (работающему на другом порту) общаться с бэкендом
origins = [
    "https://co-voshod.tech",
    "https://www.co-voshod.tech",
    "http://localhost:5173",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Модель для входящего запроса
class PromptRequest(BaseModel):
    prompt: str
    use_gemini: bool = False
    file_content: Optional[str] = None

# Модель для ответа (отправляем JSON с полем "response")
class GenerateResponse(BaseModel):
    response: str

# Глобальная переменная для хранения истории диалога
chat_history: List[Dict[str, str]] = []

def get_chat_context() -> str:
    """Формирует контекст диалога из истории"""
    if not chat_history:
        return ""
    
    context = "Предыдущий диалог:\n"
    for message in chat_history[-5:]:  # Берем последние 5 сообщений
        context += f"{message['role']}: {message['content']}\n"
    return context

def extract_text_from_image(image_data: bytes) -> str:
    """Извлекает текст из изображения с помощью Tesseract OCR"""
    image = Image.open(io.BytesIO(image_data))
    return pytesseract.image_to_string(image, lang='rus+eng')

def clean_gemini_response(text: str) -> str:
    """Очищает ответ Gemini от служебных тегов"""
    # Удаляем теги <think> и их содержимое
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    # Удаляем множественные переносы строк
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()

async def process_file(file: UploadFile) -> str:
    try:
        print(f"Получен файл типа: {file.content_type}")
        
        # Получаем контекст диалога
        context = get_chat_context()
        
        if file.content_type.startswith('image/'):
            print("Обработка изображения...")
            contents = await file.read()
            
            image = {
                "mime_type": file.content_type,
                "data": base64.b64encode(contents).decode('utf-8')
            }
            
            # Добавляем контекст в промпт
            prompt = (
                f"{context}\n\n"
                
            )
            
            response = await gemini_vision_model.generate_content_async([prompt, image])
            result = clean_gemini_response(response.text)
            
            # Добавляем в историю
            chat_history.append({"role": "user", "content": "Загружено изображение"})
            chat_history.append({"role": "assistant", "content": result})
            
            return result
            
        elif file.content_type == 'text/plain':
            print("Обработка текстового файла...")
            contents = await file.read()
            text = contents.decode('utf-8')
            
            # Добавляем контекст в промпт
            prompt = (
                f"{context}\n\n"
              
            )
            
            response = await gemini_model.generate_content_async(prompt)
            result = clean_gemini_response(response.text)
            
            # Добавляем в историю
            chat_history.append({"role": "user", "content": f"Загружен текстовый файл: {text}"})
            chat_history.append({"role": "assistant", "content": result})
            
            return result
            
        else:
            print(f"Неподдерживаемый тип файла: {file.content_type}")
            raise HTTPException(status_code=400, detail="Неподдерживаемый тип файла")
            
    except Exception as e:
        print(f"Ошибка при обработке файла: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка при обработке файла: {str(e)}")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        print("Начало загрузки файла...")
        content = await process_file(file)
        print("Файл успешно обработан")
        return {"content": content}
    except Exception as e:
        print(f"Ошибка при загрузке файла: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate", response_model=GenerateResponse)
async def generate_text(request: PromptRequest):
    """
    Эндпоинт для генерации текста с использованием DeepSeek или Gemini.
    Принимает POST-запрос с JSON {"prompt": "Ваш текст", "use_gemini": false, "file_content": "содержимое файла"}
    Возвращает JSON {"response": "Сгенерированный текст"}
    """
    try:
        if not request.prompt and not request.file_content:
            raise HTTPException(status_code=400, detail="Промпт или содержимое файла не может быть пустым")

        # Получаем контекст диалога
        context = get_chat_context()
        
        if request.use_gemini:
            if request.file_content:
                prompt = (
                    f"{context}\n\n"
                    f"Проанализируй следующий текст и ответь на вопрос: {request.prompt}\n\n"
                    f"Текст для анализа:\n{request.file_content}"
                )
            else:
                prompt = f"{context}\n\n{request.prompt}"
                
            response = gemini_model.generate_content(prompt)
            generated_text = response.text
            
            # Добавляем в историю
            chat_history.append({"role": "user", "content": request.prompt})
            chat_history.append({"role": "assistant", "content": generated_text})
            
        else:
            # Используем DeepSeek API
            headers = {
                "Authorization": f"Bearer {deepseek_api_key}",
                "Content-Type": "application/json"
            }
            
            # Формируем сообщения с учетом контекста
            messages = []
            
            # Добавляем контекст, если он есть
            if context:
                messages.append({
                    "role": "system",
                    "content": f"Предыдущий диалог:\n{context}\n\nОтвечай на русском языке."
                })
            
            # Добавляем текущий запрос
            if request.file_content:
                messages.append({
                    "role": "system",
                    "content": f"Проанализируй следующий текст:\n{request.file_content}"
                })
            
            messages.append({
                "role": "user",
                "content": request.prompt
            })

            data = {
                "model": "deepseek-chat",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1000
            }

            response = requests.post(DEEPSEEK_API_URL, headers=headers, json=data)
            
            if response.status_code != 200:
                error_detail = response.json().get('error', {}).get('message', 'Неизвестная ошибка')
                raise HTTPException(status_code=response.status_code, detail=error_detail)

            response_data = response.json()
            generated_text = response_data['choices'][0]['message']['content']
            
            # Добавляем в историю
            chat_history.append({"role": "user", "content": request.prompt})
            chat_history.append({"role": "assistant", "content": generated_text})

        return GenerateResponse(response=generated_text)

    except Exception as e:
        print(f"Ошибка при вызове API: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {e}")

@app.post("/clear_history")
async def clear_history():
    """Очищает историю диалога"""
    global chat_history
    chat_history = []
    return {"message": "История диалога очищена"}

@app.get("/")
def read_root():
    return {"message": "DeepSeek FastAPI Backend готов к работе!"}

# Если вы хотите запустить сервер напрямую через python main.py (менее предпочтительно для разработки)
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)