FROM ubuntu:latest

RUN apt-get update
RUN apt-get install --yes nodejs
RUN apt-get install --yes npm
RUN apt-get install --yes build-essential

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD . /usr/src/app/
RUN npm install

CMD ["nodejs","app.js"]