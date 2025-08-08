import os
import base64
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from conversational_agent import run_agent
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app and serve React build folder
app = Flask(__name__, static_folder="dist", static_url_path="")
CORS(app)

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.form.get("message", "")
    image_file = request.files.get("image", None)
    document_file = request.files.get("document", None)
    audio_file = request.files.get("audio", None)
    url = request.form.get("url", "")
    thread_id = request.form.get("thread_id", "1")

    if not user_message.strip() and not image_file and not document_file and not audio_file and not url.strip():
        return jsonify({"error": "Please provide a message, image, document, audio, or URL"}), 400

    # Handle image processing (existing functionality)
    image_data = None
    if image_file is not None:
        image_bytes = image_file.read()
        image_data = base64.b64encode(image_bytes).decode("utf-8")

    # Handle document processing - similar to images
    document_data = None
    document_mime_type = None
    if document_file is not None:
        document_bytes = document_file.read()
        document_data = base64.b64encode(document_bytes).decode("utf-8")
        document_mime_type = document_file.mimetype or "application/pdf"

    # Handle audio processing
    audio_data = None
    audio_mime_type = None
    if audio_file is not None:
        audio_bytes = audio_file.read()
        audio_data = base64.b64encode(audio_bytes).decode("utf-8")
        audio_mime_type = audio_file.mimetype or "audio/wav"

    # Handle URL processing
    if url.strip():
        if user_message.strip():
            user_message += f"\n\nPlease analyze and summarize the content from this URL: {url}"
        else:
            user_message = f"Please analyze and summarize the content from this URL: {url}"

    # Prepare user request based on available inputs
    user_request = [{"type": "text", "text": user_message}]
    
    if image_data is not None:
        user_request.append({
            "type": "image", 
            "source_type": "base64", 
            "data": image_data, 
            "mime_type": "image/jpeg"
        })
    
    if document_data is not None:
        user_request.append({
            "type": "file",
            "source_type": "base64", 
            "data": document_data, 
            "mime_type": document_mime_type
        })
    
    if audio_data is not None:
        user_request.append({
            "type": "audio",
            "source_type": "base64", 
            "data": audio_data, 
            "mime_type": audio_mime_type
        })

    try:
        reply = run_agent(user_request, thread_id)
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['GET'])
def get_chat_state():
    thread_id = request.args.get('thread_id', '1')
    try:
        from conversational_agent import get_state
        state = get_state(thread_id)

        messages = []
        state_dict = state.values if hasattr(state, 'values') else {}
        if isinstance(state_dict, dict) and state_dict.get("messages"):
            for msg in state_dict["messages"]:
                if hasattr(msg, 'type') and msg.type == 'system':
                    continue

                role = 'user' if msg.type == 'human' else 'assistant'
                content = msg.content

                if isinstance(content, list):
                    text_content = ""
                    image_data = None
                    for item in content:
                        if item.get("type") == "text":
                            text_content = item.get("text", "")
                        elif item.get("type") == "image":
                            image_data = item.get("data")

                    messages.append({
                        "role": role,
                        "content": text_content,
                        "image": f"data:image/jpeg;base64,{image_data}" if image_data else None
                    })
                else:
                    messages.append({
                        "role": role,
                        "content": content,
                        "image": None
                    })

        return jsonify({"messages": messages})
    except Exception as e:
        return jsonify({"error": str(e), "messages": []}), 500

# Serve React frontend
@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, "index.html")

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
