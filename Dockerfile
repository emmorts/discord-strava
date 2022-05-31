# syntax=docker/dockerfile:1

FROM node:alpine

# Install Puppeteer

## Installs latest Chromium (100) package.
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

## Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

## Puppeteer v13.5.0 works with Chromium 100.
# RUN npm install puppeteer@13.5.0

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

## Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser -S -G pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
USER pptruser

# Setup app

# WORKDIR /app

# COPY ["package.json", "package-lock.json*", "./"]
RUN npm install

COPY . .

CMD [ "npm", "start" ]