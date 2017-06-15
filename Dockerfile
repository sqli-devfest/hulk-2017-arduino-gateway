FROM hypriot/rpi-node:7.4.0

LABEL Description="Devfest 2017 Arduino Gateway image" Vendor="SQLI" Version="1.0"

RUN apt-get update && apt-get install -y build-essential

ADD application /application

WORKDIR /application

RUN npm install

ENTRYPOINT node arduinogateway.js