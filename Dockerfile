# =========================
# Stage 1: Build stage
# =========================
FROM node:20-slim AS build

# Set working directory
WORKDIR /app

# Install LaTeX and clean caches in one layer
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

# Install dependencies
RUN npm install --production

# Copy app source code
COPY . .

# =========================
# Stage 2: Runtime stage
# =========================
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy only what is needed from build stage
COPY --from=build /app /app

# Expose backend port
EXPOSE 8000

# Start backend in production mode
CMD ["node", "index.js"]
