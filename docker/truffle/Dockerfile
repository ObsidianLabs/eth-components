FROM node:12-alpine

RUN apk add --no-cache docker-cli

RUN npm -g config set user root && npm i -g truffle@5.1.61 && npm cache clean --force
