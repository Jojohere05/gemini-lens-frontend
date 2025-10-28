from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import librosa
import tempfile
import os
import traceback
import google.genai as genai
import gdown  # ✅ for Google Drive model download

# ----------------- Flask App Setup -----------------
app = Flask(__name__)
CORS(app)
load_dotenv()
# ----------------- Google Drive Model Links -----------------
AUDIO_MODEL_DRIVE_URL = "https://drive.google.com/uc?id=14GfEnrtUh32DYIIBcQekDNdUwCkliu0A"
TEXT_MODEL_DRIVE_URL = "https://drive.google.com/uc?id=1C2oX3nDfGFc-26KSLfFKPUwja8JPdy_e"

# ----------------- Temporary Download Paths -----------------
TEMP_DIR = tempfile.gettempdir()
MODEL_AUDIO_PATH = os.path.join(TEMP_DIR, "deception_logistic_regression_model.pkl")
MODEL_TEXT_PATH = os.path.join(TEMP_DIR, "text_deception_svm_model.pkl")

# ----------------- Helper: Download models if not present -----------------
def download_model_from_drive(url, save_path):
    if not os.path.exists(save_path):
        print(f"⬇️ Downloading model from {url} ...")
        gdown.download(url, save_path, quiet=False)
    else:
        print(f"✅ Model already cached: {save_path}")

# ----------------- Download & Load Models -----------------
try:
    download_model_from_drive(AUDIO_MODEL_DRIVE_URL, MODEL_AUDIO_PATH)
    download_model_from_drive(TEXT_MODEL_DRIVE_URL, MODEL_TEXT_PATH)

    model_audio = joblib.load(MODEL_AUDIO_PATH)
    model_text = joblib.load(MODEL_TEXT_PATH)
    print("✅ Models loaded successfully from Google Drive")
except Exception as e:
    print("❌ Error loading models:", e)
    model_audio, model_text = None, None

# ----------------- Gemini Configuration -----------------
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

# ----------------- Audio Feature Extraction -----------------
def extract_audio_features(file_path):
    y, sr = librosa.load(file_path, sr=16000, mono=True)
    y = y / np.max(np.abs(y)) if np.max(np.abs(y)) > 0 else y
    if len(y) < 2048:
        y = np.pad(y, (0, 2048 - len(y)), mode="reflect")

    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_mean = np.mean(mfcc, axis=1)
    return mfcc_mean

# ----------------- Audio Prediction Endpoint -----------------
@app.route("/audio-predict", methods=["POST"])
def audio_predict():
    try:
        if model_audio is None:
            return jsonify({"error": "Audio model not loaded"}), 500

        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        audio_file = request.files["file"]
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_path = temp_audio.name
            audio_file.save(temp_path)

        features = extract_audio_features(temp_path)
        os.remove(temp_path)

        pred = model_audio.predict([features])[0]
        prob = model_audio.predict_proba([features])[0][int(pred)]
        label = "Deceptive" if pred == 1 else "Truthful"

        return jsonify({"prediction": label, "confidence": float(prob)})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ----------------- Text Prediction Endpoint -----------------
@app.route("/predict", methods=["POST"])
def text_predict():
    try:
        if model_text is None:
            return jsonify({"error": "Text model not loaded"}), 500

        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "No text provided"}), 400

        text = data["text"]
        pred = model_text.predict([text])[0]

        try:
            probas = model_text.predict_proba([text])[0]
            confidences = {
                "Truthful": float(probas[0]),
                "Deceptive": float(probas[1])
            }
            confidence = max(confidences.values())
        except AttributeError:
            confidence = 1.0
            confidences = {
                "Truthful": 1.0 if pred == 0 else 0.0,
                "Deceptive": 1.0 if pred == 1 else 0.0
            }

        label = "Deceptive" if pred == 1 else "Truthful"

        return jsonify({
            "prediction": label,
            "confidence": confidence,
            "probabilities": confidences
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ----------------- Explanation Endpoint (Gemini 2.5 Flash) -----------------
@app.route("/explain", methods=["POST"])
def explain():
    try:
        data = request.get_json()
        if not data or "transcript" not in data:
            return jsonify({"error": "No transcript provided"}), 400

        transcript = data["transcript"]

        prompt = f"""
You are a linguistic and psychological analysis expert tasked with evaluating human statements for truthfulness or deception.

Analyze the following transcript carefully:

'''{transcript}'''

Provide a detailed explanation describing linguistic cues, tone, detail level, and logical consistency that indicate whether this statement is likely to be truthful or deceptive.

Structure your response clearly with bullet points or numbered reasons, and conclude with an overall assessment.
"""

        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return jsonify({"explanation": response.text})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ----------------- Health Check -----------------
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "Backend active"})

# ----------------- Run Flask -----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
