FROM hypriot/rpi-node:8.1.3

LABEL Description="Devfest 2017 Arduino Gateway image" Vendor="SQLI" Version="1.0"

RUN apt-get update && apt-get install -y build-essential

ADD . /application

WORKDIR /application

RUN yarn

ENTRYPOINT node application/arduinogateway.js