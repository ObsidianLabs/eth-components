FROM node:14-alpine

RUN apk add --no-cache docker-cli

RUN npm -g config set user root && npm i -g hardhat@2.5.0 && npm cache clean --force
