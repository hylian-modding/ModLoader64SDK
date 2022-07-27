FROM node:16

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./yarn.lock

RUN npm install -g pkg
RUN npm install -g ts-node
RUN npm install -g asar
RUN yarn

COPY . .

RUN git submodule update --init --recursive

CMD ["yarn", "docker"]