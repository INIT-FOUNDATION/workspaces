FROM ghcr.io/techknowkraftai/node AS build

WORKDIR /usr/src/app

RUN npm install

COPY . .

EXPOSE 5002

CMD [ "npm", "start" ]