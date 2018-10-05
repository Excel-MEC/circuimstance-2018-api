FROM node:8.9.2-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run tsc

EXPOSE 4000

CMD ["npm", "start"]