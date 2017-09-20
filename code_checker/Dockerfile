FROM ubuntu:latest

RUN apt-get update
RUN apt-get install --yes nodejs
RUN apt-get install --yes build-essential
RUN apt-get install --yes npm
RUN apt-get install --yes ruby-dev
RUN apt-get install --yes rubygems
RUN apt-get install --yes git
RUN apt-get install --yes subversion
RUN apt-get install --yes language-pack-en-base
RUN locale-gen en_US.UTF-8


#RUN mkdir -p /usr/src/app
#WORKDIR /usr/src/app

#ADD . /usr/src/app/
#RUN npm install

#FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN export LC_ALL=C.UTF-8
RUN export LANG=en_US.UTF-8
RUN export LANGUAGE=en_US.UTF-8

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

RUN gem install specific_install
RUN gem specific_install -l git://github.com/riv-dev/code_checker.git

# Bundle app source
COPY . /usr/src/app

#CMD ["npm","test"]
CMD ["nodejs","patch.js"]