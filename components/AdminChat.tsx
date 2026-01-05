'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: string[];
  urls?: string[];
}

interface Document {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  vectorized: boolean;
  urlsExtracted?: string[];
}

export default function AdminChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'training'>('chat');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load chat history
    loadChatHistory();
    // Load documents list
    loadDocuments();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/admin/chat/history');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/admin/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-10) // Last 10 messages for context
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          sources: data.sources,
          urls: data.urls
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'Ошибка: Не удалось получить ответ от AI',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const tempDoc: Document = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        status: 'uploading',
        vectorized: false
      };

      setDocuments(prev => [...prev, tempDoc]);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/admin/documents/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          
          setDocuments(prev => prev.map(doc => 
            doc.id === tempDoc.id 
              ? { ...doc, ...data, status: 'ready', id: data.id }
              : doc
          ));

          // Add system message about document processing
          const systemMessage: Message = {
            id: Date.now().toString(),
            role: 'system',
            content: `📄 Документ "${file.name}" загружен и обработан.\n` +
                    `${data.urlsExtracted?.length ? `🔗 Извлечено ссылок: ${data.urlsExtracted.length}` : ''}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, systemMessage]);

          // Trigger training if URLs found
          if (data.urlsExtracted && data.urlsExtracted.length > 0) {
            triggerUrlTraining(data.id, data.urlsExtracted);
          }
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        setDocuments(prev => prev.map(doc => 
          doc.id === tempDoc.id ? { ...doc, status: 'error' } : doc
        ));
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerUrlTraining = async (documentId: string, urls: string[]) => {
    try {
      const response = await fetch('/api/admin/training/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, urls })
      });

      if (response.ok) {
        const data = await response.json();
        
        const systemMessage: Message = {
          id: Date.now().toString(),
          role: 'system',
          content: `🌐 Начато обучение на ${urls.length} веб-страницах из документа`,
          timestamp: new Date(),
          urls: urls
        };
        setMessages(prev => [...prev, systemMessage]);
      }
    } catch (error) {
      console.error('URL training error:', error);
    }
  };

  const triggerDocumentTraining = async (documentId: string) => {
    try {
      const response = await fetch('/api/admin/training/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId })
      });

      if (response.ok) {
        const systemMessage: Message = {
          id: Date.now().toString(),
          role: 'system',
          content: '✅ Дообучение на документе запущено',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, systemMessage]);
      }
    } catch (error) {
      console.error('Training error:', error);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Удалить документ и его данные из базы знаний?')) return;

    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const clearChat = () => {
    if (!confirm('Очистить историю чата?')) return;
    setMessages([]);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 overflow-hidden h-[calc(100vh-180px)]">
      {/* Tabs */}
      <div className="flex border-b border-white/20 bg-white/5">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 px-6 py-4 font-semibold transition-colors ${
            activeTab === 'chat'
              ? 'bg-blue-500/30 text-white border-b-2 border-blue-400'
              : 'text-gray-300 hover:bg-white/10'
          }`}
        >
          💬 AI Chat
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 px-6 py-4 font-semibold transition-colors ${
            activeTab === 'documents'
              ? 'bg-blue-500/30 text-white border-b-2 border-blue-400'
              : 'text-gray-300 hover:bg-white/10'
          }`}
        >
          📚 Documents ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('training')}
          className={`flex-1 px-6 py-4 font-semibold transition-colors ${
            activeTab === 'training'
              ? 'bg-blue-500/30 text-white border-b-2 border-blue-400'
              : 'text-gray-300 hover:bg-white/10'
          }`}
        >
          🎓 Training Status
        </button>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="flex flex-col h-full">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 py-12">
                <div className="text-6xl mb-4">🤖</div>
                <p className="text-lg">AI Chat готов к работе</p>
                <p className="text-sm mt-2">Загрузите документы или начните диалог</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.role === 'system'
                      ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/20 text-xs text-gray-300">
                      📄 Источники: {message.sources.join(', ')}
                    </div>
                  )}
                  
                  {message.urls && message.urls.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/20 text-xs">
                      {message.urls.slice(0, 3).map((url, idx) => (
                        <div key={idx} className="text-blue-300 hover:underline truncate">
                          🔗 {url}
                        </div>
                      ))}
                      {message.urls.length > 3 && (
                        <div className="text-gray-400">
                          ... и еще {message.urls.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-1 text-xs text-gray-400">
                    {new Date(message.timestamp).toLocaleTimeString('ru-RU')}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/20 text-white rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>AI думает...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/20 p-4 bg-white/5">
            <div className="flex items-center gap-2 mb-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                accept=".pdf,.txt,.doc,.docx,.md"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded-lg transition-colors border border-green-500/30 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Загрузить документ
              </button>

              <button
                onClick={clearChat}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors border border-red-500/30"
              >
                Очистить чат
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Напишите сообщение..."
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Отправить
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="p-6 overflow-y-auto h-full">
          <div className="mb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Загрузить новый документ
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              accept=".pdf,.txt,.doc,.docx,.md"
              className="hidden"
            />
          </div>

          {documents.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-lg">Нет загруженных документов</p>
              <p className="text-sm mt-2">Загрузите документы для обучения AI</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white/10 border border-white/20 rounded-lg p-4 hover:bg-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-2xl">
                          {doc.status === 'ready' ? '✅' : doc.status === 'error' ? '❌' : '⏳'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{doc.name}</h3>
                          <p className="text-sm text-gray-400">
                            {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleString('ru-RU')}
                          </p>
                        </div>
                      </div>

                      {doc.status === 'processing' && (
                        <div className="mt-2">
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {doc.urlsExtracted && doc.urlsExtracted.length > 0 && (
                        <div className="mt-2 text-sm text-blue-300">
                          🔗 Извлечено ссылок: {doc.urlsExtracted.length}
                        </div>
                      )}

                      {doc.vectorized && (
                        <div className="mt-2 text-sm text-green-300">
                          ✓ Векторизовано и готово к использованию
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {doc.status === 'ready' && !doc.vectorized && (
                        <button
                          onClick={() => triggerDocumentTraining(doc.id)}
                          className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded text-sm border border-green-500/30"
                        >
                          🎓 Обучить
                        </button>
                      )}
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded text-sm border border-red-500/30"
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Training Tab */}
      {activeTab === 'training' && (
        <div className="p-6 overflow-y-auto h-full text-white">
          <div className="space-y-4">
            <div className="bg-white/10 border border-white/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">📊 Статистика обучения</h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-sm text-gray-400">Документов обработано</div>
                  <div className="text-2xl font-bold">{documents.filter(d => d.vectorized).length}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Ссылок извлечено</div>
                  <div className="text-2xl font-bold">
                    {documents.reduce((sum, doc) => sum + (doc.urlsExtracted?.length || 0), 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-blue-200">
              <h3 className="font-semibold mb-2">ℹ️ Как работает система</h3>
              <ul className="space-y-2 text-sm">
                <li>📄 <strong>Загрузка документов</strong> - PDF, TXT, DOCX, MD автоматически обрабатываются</li>
                <li>🔍 <strong>Извлечение текста</strong> - Весь текст индексируется для быстрого поиска</li>
                <li>🔗 <strong>Анализ ссылок</strong> - Все URL автоматически извлекаются из документов</li>
                <li>🌐 <strong>Веб-скрапинг</strong> - Контент по ссылкам загружается и добавляется в базу знаний</li>
                <li>🧠 <strong>Векторизация</strong> - Текст преобразуется в векторы для RAG поиска</li>
                <li>🎓 <strong>Дообучение</strong> - Модель Ollama обучается на новых данных</li>
                <li>💬 <strong>Контекстный ответ</strong> - AI использует загруженные документы для ответов</li>
              </ul>
            </div>

            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-green-200">
              <h3 className="font-semibold mb-2">✅ Возможности</h3>
              <ul className="space-y-1 text-sm">
                <li>• Мультиязычная поддержка (Hebrew, Russian, English)</li>
                <li>• RAG (Retrieval-Augmented Generation) для точных ответов</li>
                <li>• Автоматическая обработка документов</li>
                <li>• Извлечение и обучение на веб-контенте</li>
                <li>• История чата с контекстом</li>
                <li>• Указание источников в ответах</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
