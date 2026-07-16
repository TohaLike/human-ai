FROM mcr.microsoft.com/devcontainers/javascript-node:22-bookworm

# Electron / Playwright / native modules build deps
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    libgtk-3-0 \
    libnotify4 \
    libnss3 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    libatspi2.0-0 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libcups2 \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

ENV ELECTRON_DISABLE_SANDBOX=1
ENV PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright
