FROM node:carbon
WORKDIR /usr/workspace

COPY package*.json ./
RUN npm install && npm install -g nodemon
COPY . .

EXPOSE 4000

CMD [ "npm", "start" ]
