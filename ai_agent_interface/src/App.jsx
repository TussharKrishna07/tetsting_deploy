import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatHistoryRef = useRef(null);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [document, setDocument] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [audio, setAudio] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [url, setUrl] = useState('');
  const [currentThreadId, setCurrentThreadId] = useState('1');
  const [chatThreads, setChatThreads] = useState([
    { id: '1', name: 'Chat Session 1', createdAt: new Date().toISOString() }
  ]);
  const [theme, setTheme] = useState('light');
  const [sidebarToggled, setSidebarToggled] = useState(false);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Load chat history when thread changes
  useEffect(() => {
    const restoreChatHistory = async () => {
      try {
        const res = await fetch(`/chat?thread_id=${currentThreadId}`, {
          method: 'GET',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            // Convert base64 images back to object URLs for display
            const restoredMessages = data.messages.map(msg => {
              if (msg.image && msg.image.startsWith('data:image')) {
                // Convert base64 to blob URL for consistent display
                const byteCharacters = atob(msg.image.split(',')[1]);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'image/jpeg' });
                const imageUrl = URL.createObjectURL(blob);
                
                return { ...msg, image: imageUrl };
              }
              return msg;
            });
            setChatHistory(restoredMessages);
          } else {
            setChatHistory([]);
          }
        }
      } catch (error) {
        console.error('Failed to restore chat history:', error);
        setChatHistory([]);
      }
    };

    restoreChatHistory();
  }, [currentThreadId]);

  const sendMessage = async () => {
    const trimmed = message.trim();
    const urlTrimmed = url.trim();
    
    // Check if we have any content to send
    if ((!trimmed && !image && !document && !audio && !urlTrimmed) || isLoading) {
      return;
    }

    // Store the file URLs for display
    const imageUrl = image ? URL.createObjectURL(image) : null;
    const documentName = document ? document.name : null;
    const audioName = audio ? audio.name : null;
    
    // Prepare display message
    let displayContent = trimmed;
    if (urlTrimmed) {
      displayContent += `\n\nURL: ${urlTrimmed}`;
    }
    if (documentName) {
      displayContent += `\n\nDocument: ${documentName}`;
    }
    if (audioName) {
      displayContent += `\n\nAudio: ${audioName}`;
    }

    // Create message object
    const newMessage = { 
      role: 'user', 
      content: displayContent || (image ? 'Image uploaded' : (document ? 'Document uploaded' : (audio ? 'Audio uploaded' : 'URL provided'))), 
      image: imageUrl,
      document: documentName,
      audio: audioName
    };

    // Clear inputs immediately to prevent duplicate submissions
    const currentMessage = trimmed;
    const currentUrl = urlTrimmed;
    const currentImage = image;
    const currentDocument = document;
    const currentAudio = audio;
    
    setMessage('');
    setUrl('');
    setImage(null);
    setImagePreview(null);
    setDocument(null);
    setDocumentPreview(null);
    setAudio(null);
    setAudioPreview(null);
    
    setChatHistory(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      if (currentMessage) {
        formData.append('message', currentMessage);
      }
      if (currentImage) {
        formData.append('image', currentImage);
      }
      if (currentDocument) {
        formData.append('document', currentDocument);
      }
      if (currentAudio) {
        formData.append('audio', currentAudio);
      }
      if (currentUrl) {
        formData.append('url', currentUrl);
      }
      // Add thread_id to form data
      formData.append('thread_id', currentThreadId);

      const res = await fetch('/chat', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let errorText = 'Network error';
        try {
          const errorData = await res.json();
          errorText = errorData.error || errorText;
        } catch {
          errorText = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorText);
      }

      const data = await res.json();
      const replyContent = typeof data.reply === 'string' ? data.reply : 'No valid response.';
      setChatHistory(prev => [...prev, { role: 'assistant', content: replyContent }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      const trimmed = message.trim();
      const urlTrimmed = url.trim();
      
      // Only send if we have content
      if (trimmed || image || document || audio || urlTrimmed) {
        sendMessage();
      }
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleDocumentChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocument(file);
      setDocumentPreview(file.name);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleRemoveDocument = () => {
    setDocument(null);
    setDocumentPreview(null);
  };

  const handleAudioChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudio(file);
      setAudioPreview(file.name);
    }
  };

  const handleRemoveAudio = () => {
    setAudio(null);
    setAudioPreview(null);
  };

  const categories = [
    { id: 'conversation', name: 'Conversation', icon: '💬' },
    { id: 'images', name: 'Image Analysis', icon: '🖼️' },
    { id: 'documents', name: 'Document Summary', icon: '📄' },
    { id: 'audio', name: 'Audio Transcription', icon: '🎵' },
    { id: 'research', name: 'Research', icon: '🔍' },
    { id: 'general', name: 'General Chat', icon: '🤖' },
  ];

  const quickActions = [
    { text: "Analyze this image for me", icon: "🖼️" },
    { text: "Summarize this document", icon: "📄" },
    { text: "Transcribe and analyze this audio", icon: "🎵" },
    { text: "Help me understand this URL", icon: "🌐" },
    { text: "Let's have a conversation", icon: "💬" }
  ];

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const createNewChat = () => {
    // Generate new thread ID by incrementing the highest existing ID
    const existingIds = chatThreads.map(thread => parseInt(thread.id));
    const newThreadId = (Math.max(...existingIds) + 1).toString();
    
    // Create new chat thread
    const newThread = {
      id: newThreadId,
      name: `Chat Session ${newThreadId}`,
      createdAt: new Date().toISOString()
    };
    
    // Add to threads list
    setChatThreads(prev => [...prev, newThread]);
    
    // Switch to new thread
    setCurrentThreadId(newThreadId);
    
    // Clear current chat history (will be loaded from backend in useEffect)
    setChatHistory([]);
  };

  const switchToThread = (threadId) => {
    setCurrentThreadId(threadId);
    // Chat history will be loaded automatically by useEffect
  };

  const formatThreadName = (thread) => {
    const date = new Date(thread.createdAt);
    return `${thread.name} - ${date.toLocaleDateString()}`;
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">🤖 AI Assistant</div>
          <div className="sidebar-subtitle">Multimodal AI Companion</div>
        </div>
        
        <button className="new-chat-button" onClick={createNewChat}>
          💬 New Chat Session
        </button>
        
        <div className="chat-history">
          {chatThreads.map((thread) => (
            <div
              key={thread.id}
              className={`history-item ${currentThreadId === thread.id ? 'active' : ''}`}
              onClick={() => switchToThread(thread.id)}
            >
              {formatThreadName(thread)}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="main-content">
        <header className="chat-header">
          <div className="chat-title">🤖 AI Assistant Chat</div>
          <div className="chat-subtitle">Session: {chatThreads.find(t => t.id === currentThreadId)?.name || 'Chat Session'}</div>
        </header>

        <div className="messages-container" ref={chatHistoryRef}>
          {chatHistory.length === 0 && !isLoading && (
            <div className="welcome-screen">
              <div className="welcome-icon">🤖</div>
              <h2 className="welcome-title">Welcome to AI Assistant! ✨</h2>
              <p className="welcome-subtitle">
                Your multimodal AI companion for conversation, image analysis, document processing, and audio transcription.<br />
                Upload images, documents, audio files, share URLs, or just chat! 💬
              </p>
              <div className="feature-grid">
                <div className="feature-card">
                  <span className="feature-icon">💬</span>
                  <div className="feature-title">Conversation Analysis</div>
                  <div className="feature-description">Intelligent chat and conversation insights</div>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">🖼️</span>
                  <div className="feature-title">Image Analysis</div>
                  <div className="feature-description">Detailed visual content analysis and descriptions</div>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">📄</span>
                  <div className="feature-title">Document Summarization</div>
                  <div className="feature-description">Extract insights from PDFs, docs, and web content</div>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">🎵</span>
                  <div className="feature-title">Audio Transcription & Diarization</div>
                  <div className="feature-description">Transcribe speech and identify up to 2 speakers</div>
                </div>
              </div>
            </div>
          )}

          {chatHistory.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                {msg.image && (
                  <div className="message-image">
                    <img
                      src={msg.image}
                      alt="Uploaded content"
                      className="uploaded-image"
                    />
                  </div>
                )}
                {msg.document && (
                  <div className="message-document">
                    <span className="document-icon">📄</span>
                    <span className="document-name">{msg.document}</span>
                  </div>
                )}
                {msg.audio && (
                  <div className="message-audio">
                    <span className="audio-icon">🎵</span>
                    <span className="audio-name">{msg.audio}</span>
                  </div>
                )}
                <div className="message-text">
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => (
                        <a target="_blank" rel="noopener noreferrer" className="product-link" {...props} />
                      )
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="typing-indicator">
              <div className="message-avatar">🤖</div>
              <div className="typing-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}
        </div>

        <div className="input-area">
          {imagePreview && (
            <div className="image-preview">
              <div className="preview-header">
                <span className="preview-label">🖼️ Image attached</span>
                <button onClick={handleRemoveImage} className="remove-image-btn">
                  ✕
                </button>
              </div>
              <img src={imagePreview} alt="Preview" />
            </div>
          )}
          
          {documentPreview && (
            <div className="document-preview">
              <div className="preview-header">
                <span className="preview-label">📄 Document attached: {documentPreview}</span>
                <button onClick={handleRemoveDocument} className="remove-document-btn">
                  ✕
                </button>
              </div>
            </div>
          )}

          {audioPreview && (
            <div className="audio-preview">
              <div className="preview-header">
                <span className="preview-label">🎵 Audio attached: {audioPreview}</span>
                <button onClick={handleRemoveAudio} className="remove-audio-btn">
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* URL Input */}
          <div className="url-input-container">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="🌐 Enter URL to summarize (optional)"
              disabled={isLoading}
              className="url-input"
            />
          </div>

          <div className="input-container">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="💬 Ask me anything, upload files, or share URLs..."
              disabled={isLoading}
              rows="1"
              className="message-input"
            />
            <label className="file-input-btn" title="Upload image">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isLoading}
                style={{ display: 'none' }}
              />
              📸
            </label>
            <label className="file-input-btn" title="Upload document (PDF, Word)">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleDocumentChange}
                disabled={isLoading}
                style={{ display: 'none' }}
              />
              📄
            </label>
            <label className="file-input-btn" title="Upload audio (MP3, WAV, M4A)">
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                disabled={isLoading}
                style={{ display: 'none' }}
              />
              🎵
            </label>
            <button
              onClick={sendMessage}
              disabled={isLoading || (!message.trim() && !image && !document && !audio && !url.trim())}
              className="send-button"
              title="Send message"
            >
              {isLoading ? '⏳' : '🚀'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
