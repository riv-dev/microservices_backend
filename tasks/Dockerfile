FROM node:8.1.2

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD . /usr/src/app/
RUN npm install

CMD ["node", "app.js"]