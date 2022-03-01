# syntax=docker/dockerfile:1

FROM alpine:latest

ENV NODE_ENV=production
WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]
RUN npm install

COPY . .

CMD [ "npm", "start" ]