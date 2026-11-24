# HisaabKitaab AI backend, for Hugging Face Spaces (Docker SDK).
# Settings (GROQ_API_KEY, FIREBASE_PROJECT_ID, ENV, ...) are NOT in this image.
# Add them in the Space: Settings > Variables and secrets.
FROM python:3.12-slim

# Hugging Face runs the container as a non-root user with uid 1000.
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1

WORKDIR /home/user/app

# Install packages first so Docker can reuse this layer when only the code changes.
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Then the code (.dockerignore keeps .env, tests and other junk out).
COPY --chown=user . .

# Hugging Face Spaces expects the app on port 7860.
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
