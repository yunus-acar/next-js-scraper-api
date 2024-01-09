FROM node:18-alpine


WORKDIR /app

COPY package.json yarn.lock ./


RUN yarn --pure-lockfile

COPY . .

RUN yarn build

EXPOSE 4000

CMD [ "yarn", "start" ]