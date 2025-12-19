# backend/Dockerfile
FROM node:20-slim

# Install LaTeX
RUN apt-get update && \
    apt-get install -y \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-fonts-recommended \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8000
CMD ["npm", "run", "dev"]
