FROM ghcr.io/techknowkraftai/node AS build

WORKDIR /usr/src/app

COPY . .

RUN npm install

EXPOSE 5002

CMD [ "npm", "start" ]