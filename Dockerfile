# =========================
# Node + LaTeX Full Build
# =========================
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install LaTeX + required tools in one layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        texlive-latex-base \
        texlive-latex-recommended \
        texlive-fonts-recommended \
        texlive-latex-extra && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/*

# Copy package files first for caching
COPY package*.json ./

# Install Node dependencies
RUN npm install --production

# Copy app source code
COPY . .

# Expose backend port
EXPOSE 8000

# Start backend
CMD ["node", "index.js"]
