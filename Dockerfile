# syntax=docker/dockerfile:1

FROM node:alpine

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]
RUN npm install

COPY . .

CMD [ "npm", "start" ]