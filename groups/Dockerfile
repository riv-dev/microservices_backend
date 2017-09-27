#FROM ubuntu:latest

#RUN apt-get update
#RUN apt-get install --yes nodejs
#RUN apt-get install --yes npm
#RUN apt-get install --yes build-essential

#RUN mkdir -p /usr/src/app
#WORKDIR /usr/src/app

#ADD . /usr/src/app/
#RUN npm install

FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

#CMD ["npm","test"]
CMD ["node","app.js"]