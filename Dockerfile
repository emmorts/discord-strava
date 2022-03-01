# syntax=docker/dockerfile:1

FROM node:alpine

ENV NODE_ENV=production
WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]
RUN npm install && npm run build

COPY . .

CMD [ "npm", "run start:prod" ]