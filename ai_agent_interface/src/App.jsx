import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import LoginPage from './components/LoginPage';
import './App.css';

function App() {
  // ================================
  // STATE MANAGEMENT
  // ================================
  
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);           // Login status
  const [currentUser, setCurrentUser] = useState('');           // Logged in username
  
  // Chat-related state
  const [message, setMessage] = useState('');                    // Current text message input
  const [chatHistory, setChatHistory] = useState([]);            // Array of all messages in current thread
  const [isLoading, setIsLoading] = useState(false);             // Loading state for API calls
  const chatHistoryRef = useRef(null);                           // Ref for auto-scrolling chat
  
  // File upload state
  const [image, setImage] = useState(null);                      // Selected image file
  const [imagePreview, setImagePreview] = useState(null);        // Image preview URL
  const [document, setDocument] = useState(null);                // Selected document file
  const [documentPreview, setDocumentPreview] = useState(null);  // Document name preview
  const [audio, setAudio] = useState(null);                      // Selected audio file
  const [audioPreview, setAudioPreview] = useState(null);        // Audio name preview
  const [url, setUrl] = useState('');                            // URL input for web content/documents
  
  // Thread management state
  const [currentThreadId, setCurrentThreadId] = useState('1');   // Active conversation thread ID
  const [chatThreads, setChatThreads] = useState([               // List of all conversation threads
    { id: '1', name: 'Chat Session 1', createdAt: new Date().toISOString() }
  ]);
  
  // UI state
  const [theme, setTheme] = useState('light');                   // App theme (currently unused)
  const [sidebarToggled, setSidebarToggled] = useState(false);   // Sidebar toggle state

  // ================================
  // EFFECTS
  // ================================

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Load chat history when switching between conversation threads
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

  // ================================
  // MESSAGE HANDLING
  // ================================

  // Main function to send message with multimodal content to backend
  const sendMessage = async () => {
    const trimmed = message.trim();
    const urlTrimmed = url.trim();
    
    // Validation: Check if we have any content to send
    if ((!trimmed && !image && !document && !audio && !urlTrimmed) || isLoading) {
      return;
    }

    // Prepare file URLs for display in chat history
    const imageUrl = image ? URL.createObjectURL(image) : null;
    const documentName = document ? document.name : null;
    const audioName = audio ? audio.name : null;
    
    // Build display content with all attached items
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

    // Create user message object for chat history
    const newMessage = { 
      role: 'user', 
      content: displayContent || (image ? 'Image uploaded' : (document ? 'Document uploaded' : (audio ? 'Audio uploaded' : 'URL provided'))), 
      image: imageUrl,
      document: documentName,
      audio: audioName
    };

    // Capture current values before clearing state to prevent race conditions
    const currentMessage = trimmed;
    const currentUrl = urlTrimmed;
    const currentImage = image;
    const currentDocument = document;
    const currentAudio = audio;
    
    // Clear all input fields immediately to prevent duplicate submissions
    setMessage('');
    setUrl('');
    setImage(null);
    setImagePreview(null);
    setDocument(null);
    setDocumentPreview(null);
    setAudio(null);
    setAudioPreview(null);
    
    // Add message to chat history and set loading state
    setChatHistory(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      // Build FormData with all captured values
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
      formData.append('thread_id', currentThreadId);

      // Send request to backend
      const res = await fetch('/chat', {
        method: 'POST',
        body: formData,
      });

      // Handle response errors
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

      // Parse response and add AI reply to chat history
      const data = await res.json();
      const replyContent = typeof data.reply === 'string' ? data.reply : 'No valid response.';
      setChatHistory(prev => [...prev, { role: 'assistant', content: replyContent }]);
    } catch (error) {
      // Handle errors by adding error message to chat
      console.error('Chat error:', error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  // ================================
  // INPUT HANDLERS
  // ================================

  // Handle Enter key press to send message (Shift+Enter for new line)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      const trimmed = message.trim();
      const urlTrimmed = url.trim();
      
      // Only send if we have any content
      if (trimmed || image || document || audio || urlTrimmed) {
        sendMessage();
      }
    }
  };

  // Handle image file selection and create preview
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      // Create preview URL for display
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Handle document file selection
  const handleDocumentChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocument(file);
      setDocumentPreview(file.name);
    }
  };

  // Remove selected image and clear preview
  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  // Remove selected document and clear preview
  const handleRemoveDocument = () => {
    setDocument(null);
    setDocumentPreview(null);
  };

  // Handle audio file selection
  const handleAudioChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudio(file);
      setAudioPreview(file.name);
    }
  };

  // Remove selected audio and clear preview
  const handleRemoveAudio = () => {
    setAudio(null);
    setAudioPreview(null);
  };

  // ================================
  // UI CONFIGURATION
  // ================================

  // Feature categories for sidebar (currently unused in UI)
  const categories = [
    { id: 'conversation', name: 'Conversation', icon: '💬' },
    { id: 'images', name: 'Image Analysis', icon: '🖼️' },
    { id: 'documents', name: 'Document Summary', icon: '📄' },
    { id: 'audio', name: 'Audio Transcription', icon: '🎵' },
    { id: 'research', name: 'Research', icon: '🔍' },
    { id: 'general', name: 'General Chat', icon: '🤖' },
  ];

  // Quick action suggestions displayed in welcome screen
  const quickActions = [
    { text: "Analyze this image for me", icon: "🖼️" },
    { text: "Summarize this document", icon: "📄" },
    { text: "Transcribe and analyze this audio", icon: "🎵" },
    { text: "Help me understand this URL", icon: "🌐" },
    { text: "Let's have a conversation", icon: "💬" }
  ];

  // ================================
  // THREAD MANAGEMENT
  // ================================

  // Toggle theme (currently unused)
  // ================================
  // THREAD MANAGEMENT
  // ================================

  // Toggle theme (currently unused)
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Handle successful login - accepts any username/password combination
  const handleLogin = (username) => {
    setCurrentUser(username);
    setIsLoggedIn(true);
    console.log(`User logged in: ${username}`);
  };

  // Create a new chat thread with unique ID
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

  // Switch to an existing chat thread
  const switchToThread = (threadId) => {
    setCurrentThreadId(threadId);
    // Chat history will be loaded automatically by useEffect
  };

  // Format thread display name with creation date
  const formatThreadName = (thread) => {
    const date = new Date(thread.createdAt);
    return `${thread.name} - ${date.toLocaleDateString()}`;
  };

  // ================================
  // MAIN COMPONENT RENDER
  // ================================

  // Show login page if user is not logged in
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show main chat interface if user is logged in
  return (
    <div className="app">
      {/* 
        LEFT SIDEBAR: Chat thread management and navigation
        Contains new chat button and list of previous chat sessions
      */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">🤖 AI Assistant</div>
          <div className="sidebar-subtitle">Multimodal AI Companion</div>
          <div className="user-info">Welcome, {currentUser}! 👋</div>
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

      {/* 
        MAIN CHAT AREA: Message display and input interface
        Contains chat header, message history, and input controls
      */}
      <main className="main-content">
        {/* Chat header with current session info */}
        <header className="chat-header">
          <div className="chat-title">🤖 AI Assistant Chat</div>
          <div className="chat-subtitle">Session: {chatThreads.find(t => t.id === currentThreadId)?.name || 'Chat Session'}</div>
        </header>

        {/* Messages container with scrollable chat history */}
        <div className="messages-container" ref={chatHistoryRef}>
          {/* Welcome screen shown when no messages exist */}
          {chatHistory.length === 0 && !isLoading && (
            <div className="welcome-screen">
              <div className="welcome-icon">🤖</div>
              <h2 className="welcome-title">Welcome to AI Assistant! ✨</h2>
              <p className="welcome-subtitle">
                Your multimodal AI companion for conversation, image analysis, document processing, and audio transcription.<br />
                Upload images, documents, audio files, share URLs, or just chat! 💬
              </p>
              {/* Feature showcase grid */}
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

          {/* Render each message in the chat history */}
          {chatHistory.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              {/* Message avatar (user or AI) */}
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                {/* Display attached image if present */}
                {msg.image && (
                  <div className="message-image">
                    <img
                      src={msg.image}
                      alt="Uploaded content"
                      className="uploaded-image"
                    />
                  </div>
                )}
                {/* Display attached document if present */}
                {msg.document && (
                  <div className="message-document">
                    <span className="document-icon">📄</span>
                    <span className="document-name">{msg.document}</span>
                  </div>
                )}
                {/* Display attached audio if present */}
                {msg.audio && (
                  <div className="message-audio">
                    <span className="audio-icon">🎵</span>
                    <span className="audio-name">{msg.audio}</span>
                  </div>
                )}
                {/* Message text content with Markdown support */}
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

          {/* Typing indicator shown when AI is processing */}
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

        {/* 
          INPUT AREA: File previews, URL input, message input, and send controls
          Shows previews of attached files and provides all input methods
        */}
        <div className="input-area">
          {/* Image preview with remove option */}
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
          
          {/* Document preview with remove option */}
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

          {/* Audio preview with remove option */}
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

          {/* URL input field for document/webpage summarization */}
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

          {/* Main input container with message box and file upload buttons */}
          <div className="input-container">
            {/* Text message input with Enter key support */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="💬 Ask me anything, upload files, or share URLs..."
              disabled={isLoading}
              rows="1"
              className="message-input"
            />
            
            {/* Image upload button (hidden file input with custom styling) */}
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
            
            {/* Document upload button (PDF, Word docs) */}
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
            
            {/* Audio upload button (MP3, WAV, M4A) */}
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
            
            {/* Send button - disabled when loading or no content */}
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
