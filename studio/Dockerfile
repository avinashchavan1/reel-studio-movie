# Reel Studio: one container with the UI, API, renderer (Chromium + ffmpeg).
# Build from the REPO ROOT:  docker build -f studio/Dockerfile -t reel-studio .
FROM mcr.microsoft.com/playwright:v1.49.1-noble

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY engine ./engine
COPY fonts ./fonts
COPY studio/package.json studio/package-lock.json ./studio/
WORKDIR /app/studio
RUN npm ci && npm i --no-save playwright@1.49.1
COPY studio ./
RUN npm run build

ENV NODE_ENV=production STUDIO_PORT=8080
EXPOSE 8080
# data/ (project + media + private) should be a persistent volume mounted at /app/studio/data
CMD ["sh", "-c", "[ -f data/project.json ] || node server/seed.js; node server/index.js"]
