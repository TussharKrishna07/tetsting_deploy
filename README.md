# 🤖 Multimodal AI Assistant

A powerful, modern web application that provides intelligent analysis across multiple modalities - text, images, documents, audio, and web content. Built with React frontend and Flask backend, powered by Google's Gemini AI.

## ✨ Features

### 🔍 **Multimodal Analysis**
- **💬 Conversation Analysis**: Intelligent chat with context awareness
- **🖼️ Image Analysis**: Detailed visual content description and analysis
- **📄 Document Summarization**: Extract insights from PDFs, Word documents, and web URLs
- **🎵 Audio Transcription & Diarization**: Transcribe speech and identify up to 2 speakers
- **🌐 Web Content Analysis**: Summarize content from any URL

### 🚀 **Advanced Capabilities**
- **Speaker Diarization**: Automatically identify and separate multiple speakers in audio
- **Document URL Processing**: Analyze documents directly from URLs without downloading
- **Real-time Chat**: Persistent conversation threads with memory
- **Multi-format Support**: Images (JPEG, PNG), Documents (PDF, DOC, DOCX), Audio (MP3, WAV, M4A)
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Technology Stack

### Frontend
- **React 18** with Hooks
- **Vite** for fast development and building
- **CSS3** with modern design system
- **React Markdown** for rich text rendering

### Backend
- **Flask** web framework
- **LangChain** for AI orchestration
- **LangGraph** for conversation state management
- **Google Gemini 2.0 Flash** AI model
- **DuckDuckGo Search** integration

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **Git**
- **Google AI API Key** (for Gemini access)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/TussharKrishna07/tetsting_deploy.git
cd tetsting_deploy
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Environment Configuration
Create a `.env` file in the `backend` directory:
```bash
# backend/.env
GOOGLE_API_KEY=your_google_ai_api_key_here
```

> **📝 Note**: Get your Google AI API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

#### Start the Backend Server
```bash
python app.py
```
The backend will run on `http://localhost:5000`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd ../ai_agent_interface
npm install
```

#### Start the Development Server
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`

### 4. Access the Application
Open your browser and navigate to `http://localhost:5173`

## 📁 Project Structure

```
tetsting_deploy/
├── backend/                    # Flask backend
│   ├── app.py                 # Main Flask application
│   ├── conversational_agent.py # AI agent logic with LangGraph
│   ├── tools.py               # AI tools and utilities
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
├── ai_agent_interface/        # React frontend
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── App.css           # Styling
│   │   └── main.jsx          # React entry point
│   ├── package.json          # Node.js dependencies
│   └── vite.config.js        # Vite configuration
└── README.md                 # This file
```

## 🎯 Usage Guide

### 💬 Text Conversations
Simply type your message and press Enter or click the send button to start a conversation.

### 🖼️ Image Analysis
1. Click the 📸 button to upload an image
2. Add an optional text message
3. Send to get detailed image analysis

### 📄 Document Processing
**Upload Method:**
1. Click the 📄 button to upload a PDF or Word document
2. Add an optional message describing what you want to know
3. Send to get document summary and insights

**URL Method:**
1. Paste a direct document URL in the URL field (e.g., `https://example.com/document.pdf`)
2. Send to analyze the document directly from the URL

### 🎵 Audio Transcription
1. Click the 🎵 button to upload an audio file
2. Send to get:
   - **Transcript**: Complete transcription of the audio
   - **Diarization**: Speaker identification (up to 2 speakers)
   - **Analysis**: Insights about the conversation

### 🌐 Web Content Analysis
1. Paste any website URL in the URL input field
2. Send to get a summary of the webpage content

### 📱 Multiple Inputs
You can combine different input types in a single message:
- Text + Image + Document + Audio + URL

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Google AI API key for Gemini access | Yes |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat` | POST | Send message with multimodal content |
| `/chat?thread_id=<id>` | GET | Retrieve chat history for a thread |
| `/` | GET | Serve the React frontend |

## 🏗️ Building for Production

### Frontend Build
```bash
cd ai_agent_interface
npm run build
```

### Backend Production
The Flask app is configured to serve the built React app:
```bash
cd backend
python app.py
```

For production deployment, consider using:
- **Gunicorn** for Python WSGI server
- **Nginx** for reverse proxy
- **Docker** for containerization

## 🔧 Development

### Adding New Features
1. **Backend**: Modify `conversational_agent.py` for AI logic, `tools.py` for new capabilities
2. **Frontend**: Update `App.jsx` for UI changes, `App.css` for styling

### API Integration
The application uses Google's Gemini 2.0 Flash model through LangChain. The model supports:
- Text generation
- Image analysis
- Document processing (PDF, DOC)
- Audio transcription and analysis

## 🐛 Troubleshooting

### Common Issues

**Backend not starting:**
- Ensure Python dependencies are installed: `pip install -r requirements.txt`
- Check if `.env` file exists with valid `GOOGLE_API_KEY`
- Verify Python version (3.8+)

**Frontend not loading:**
- Ensure Node.js dependencies are installed: `npm install`
- Check if backend is running on port 5000
- Verify proxy configuration in `vite.config.js`

**API Key Issues:**
- Verify your Google AI API key is valid
- Check API quotas and usage limits
- Ensure the key has access to Gemini models

**File Upload Issues:**
- Check file size limits (varies by provider)
- Verify supported file formats
- Ensure proper MIME type detection

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

---

**Built with ❤️ using React, Flask, and Google Gemini AI**
