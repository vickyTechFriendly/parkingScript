#dockerfile for node server
FROM node:12
# Create app directory
WORKDIR /usr/src/app
# Install app dependencies
COPY package*.json ./
RUN npm install
# Bundle app source
COPY . .
# ejecutar los scripts
CMD ["sh", "-c", "node token.js & node parkingScript.js"] 