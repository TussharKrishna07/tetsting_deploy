import os
import base64
import httpx
from PIL import Image
from io import BytesIO
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from conversational_agent import run_agent
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
load_dotenv()
# Serve React build folder
app = Flask(__name__, static_folder="../frontend/build", static_url_path="/")
CORS(app)

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.form.get("message", "")
    image_file = request.files.get("image", None)
    thread_id = request.form.get("thread_id", "1")

    if not user_message.strip() and not image_file:
        return jsonify({"error": "Message and image both are empty"}), 400

    image_data = None
    mime_type = None
    if image_file is not None:
        image_bytes = image_file.read()
        image_data = base64.b64encode(image_bytes).decode("utf-8")
        mime_type = image_file.mimetype

    if image_data is None:
        user_request = [
            {"type": "text", "text": user_message},
        ]
    else:
        user_request = [
            {"type": "text", "text": user_message},
            {"type": "image", "source_type": "base64", "data": image_data, "mime_type": "image/jpeg"},
        ]

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
        if state.values.get("messages"):
            for msg in state.values["messages"]:
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
@app.route('/')
def serve_react():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
