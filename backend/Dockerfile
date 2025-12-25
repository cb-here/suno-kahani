# Use Node.js 20 on Debian slim
FROM node:20-slim

# Install required dependencies for Piper
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Download and install Piper TTS for Linux
RUN wget -q https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && rm piper_linux_x86_64.tar.gz \
    && chmod +x piper/piper

# Download voice models
RUN mkdir -p /app/piper \
    && wget -q -O /app/piper/hi_IN-rohan-medium.onnx \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/rohan/medium/hi_IN-rohan-medium.onnx \
    && wget -q -O /app/piper/hi_IN-rohan-medium.onnx.json \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/rohan/medium/hi_IN-rohan-medium.onnx.json \
    && wget -q -O /app/piper/hi_IN-priyamvada-medium.onnx \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium.onnx \
    && wget -q -O /app/piper/hi_IN-priyamvada-medium.onnx.json \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium.onnx.json \
    && wget -q -O /app/piper/hi_IN-pratham-medium.onnx \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx \
    && wget -q -O /app/piper/hi_IN-pratham-medium.onnx.json \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx.json \
    && wget -q -O /app/piper/en_US-ryan-medium.onnx \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx \
    && wget -q -O /app/piper/en_US-ryan-medium.onnx.json \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx.json \
    && wget -q -O /app/piper/en_US-kristin-medium.onnx \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kristin/medium/en_US-kristin-medium.onnx \
    && wget -q -O /app/piper/en_US-kristin-medium.onnx.json \
       https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/kristin/medium/en_US-kristin-medium.onnx.json

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY server.js worker.js pool.js ./

# Create tmp directory
RUN mkdir -p /app/tmp

# Set environment variable for Piper path
ENV PIPER_PATH=/app/piper/piper

# Expose port
EXPOSE 4000

CMD ["node", "server.js"]
