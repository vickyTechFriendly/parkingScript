FROM python:3.10
# Set the working directory
WORKDIR /app
# Copy the Python files into the container
COPY parkingScript.py .
COPY requirements.txt .
# Install dependencies if required
RUN pip install -r requirements.txt
# Set the command to execute when the container starts
CMD ["python3", "parkingScript.py"]