FROM node:18-alpine

# Installer wget pour le healthcheck
RUN apk add --no-cache wget

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3020

CMD ["npm", "start"]