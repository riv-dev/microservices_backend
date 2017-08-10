#FROM node:8.1.2
FROM ubuntu:latest

RUN apt-get update
RUN apt-get install --yes nodejs
RUN apt-get install --yes npm
RUN apt-get install --yes build-essential

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD . /usr/src/app/
RUN mkdir -p /usr/src/app/node_modules
RUN chmod -R 700 /usr/src/app/node_modules
RUN npm install

#CMD ["npm", "test"]
CMD ["nodejs", "app.js"]