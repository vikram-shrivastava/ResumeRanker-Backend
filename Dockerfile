# Use lightweight Node 20 image
FROM node:20-slim

# Optional: Install LaTeX if your app needs it
RUN apt-get update && \
    apt-get install -y \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-fonts-recommended \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install only production dependencies
RUN npm install

# Copy source code
COPY . .

# Expose backend port
EXPOSE 8000

# Start backend in production mode
CMD ["node", "index.js"]
