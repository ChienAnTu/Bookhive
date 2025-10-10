# Use Python 3.11 slim image as the base (lightweight)
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Copy requirements.txt first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install -r requirements.txt

# Copy the entire project source code into the container
COPY . .

# Run the FastAPI application with Uvicorn
# Assumes your FastAPI instance is called "app" in main.py
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]