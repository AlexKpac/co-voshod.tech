import React, { useState, useEffect, useRef } from 'react';
import '../styles/ChatPage.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const BACKEND_URL = 'https://co-voshod.tech/api';

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [useGemini, setUseGemini] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log("Файл не выбран");
      return;
    }

    console.log(`Выбран файл: ${file.name}, тип: ${file.type}`);

    // Проверяем тип файла
    if (!file.type.startsWith('image/') && file.type !== 'text/plain') {
      console.log(`Неподдерживаемый тип файла: ${file.type}`);
      setError('Поддерживаются только изображения и текстовые файлы');
      setShowError(true);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log("Отправка файла на сервер...");
      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Не удалось получить детали ошибки' }));
        console.error(`Ошибка сервера: ${response.status}`, errorData);
        throw new Error(errorData.detail || `Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      console.log("Файл успешно загружен");
      setFileContent(data.content);
      setFileName(file.name);
    } catch (err) {
      console.error("Ошибка при загрузке файла:", err);
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке файла');
      setShowError(true);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() && !fileContent) {
      setError('Нельзя отправить пустой запрос');
      setShowError(true);
      return;
    }

    setIsThinking(true);
    setError('');
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: input + (fileContent ? `\n\n[Прикреплен файл: ${fileName}]` : '')
    }]);
    setInput('');

    try {
      const response = await fetch(`${BACKEND_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: input,
          use_gemini: useGemini,
          file_content: fileContent
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Не удалось получить детали ошибки' }));
        throw new Error(errorData.detail || `Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response
      }]);

      // Очищаем загруженный файл после отправки
      setFileContent(null);
      setFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось связаться с сервером или произошла ошибка.');
      setShowError(true);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div className="chat-page">
      <div className={`chat-container ${messages.length > 0 || isThinking ? 'has-messages' : ''}`}>
        {messages.length === 0 && !isThinking && (
          <div className="welcome-container">
            <div className="welcome-content">
              <div className="welcome-avatar">
                <img src="/assets/chatbot.jpg" alt="Аватар чат-бота" />
              </div>
              <div className="welcome-text">
                <h1 className="welcome-title">Привет, я - Нейросеть технопарка ЦО Восход</h1>
                <p className="welcome-subtitle">Напиши мне запрос, а я помогу тебе</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="messages-container">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}>
              {message.role === 'assistant' && (
                <div className="message-header">
                  <div className="bot-avatar">
                    <img src="/assets/chatbot.jpg" alt="Аватар чат-бота" />
                  </div>
                </div>
              )}
              <div className="message-content">{message.content}</div>
            </div>
          ))}
          {isThinking && (
            <div className="message bot-message">
              <div className="message-header">
                <div className="bot-avatar">
                  <img src="/assets/chatbot.jpg" alt="Аватар чат-бота" />
                </div>
              </div>
              <div className="message-content">
                Думаю<span className="loading-dots"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-panel">
          <form onSubmit={handleSubmit} className="input-form">
            <div className="query-container">
              <div className="textarea-container">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Что ты хочешь узнать?"
                  rows={1}
                  className="message-input"
                />
                <button 
                  type="submit" 
                  className="send-button" 
                  disabled={isThinking}
                  aria-label="Отправить"
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 11L12 4M12 4L19 11M12 4V21" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              </div>
              
              <div className="controls-container">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,.txt"
                  className="file-input"
                  id="file-upload"
                  disabled={!useGemini}
                />
                <label 
                  htmlFor="file-upload" 
                  className={`control-button attach-button ${!useGemini ? 'disabled' : ''}`}
                  aria-label="Прикрепить файл"
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 9V15C10 16.1046 10.8954 17 12 17V17C13.1046 17 14 16.1046 14 15V7C14 4.79086 12.2091 3 10 3V3C7.79086 3 6 4.79086 6 7V15C6 18.3137 8.68629 21 12 21V21C15.3137 21 18 18.3137 18 15V8" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </label>

                <button 
                  type="button" 
                  className={`pro-button ${useGemini ? 'active' : ''}`}
                  onClick={() => setUseGemini(!useGemini)}
                  aria-label="Pro Mode"
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{useGemini ? 'Gemini' : 'Deepseek'}</span>
                </button>
              </div>
            </div>
            {fileName && (
              <div className="file-info">
                <span>Загружен файл: {fileName}</span>
                <button 
                  type="button" 
                  className="remove-file-button"
                  onClick={() => {
                    setFileContent(null);
                    setFileName(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {showError && (
        <div className="error-notification visible">
          <div className="error-notification-header">
            <svg className="error-notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Ошибка</span>
          </div>
          <p className="error-notification-message">{error}</p>
        </div>
      )}
    </div>
  );
}

export default ChatPage; 