FROM ghcr.io/techknowkraftai/node:12.22 AS build
ARG ENVIRONMENT=dev
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build:$ENVIRONMENT

# Stage 2: Create a lightweight image to serve the app
FROM ghcr.io/techknowkraftai/nginx:1.17.1-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]