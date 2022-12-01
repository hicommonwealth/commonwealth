FROM node:14-alpine

WORKDIR /monorepo

COPY ./packages/commonwealth/package.json 

RUN npm i -g yarn
RUN yarn install --dev

COPY ./packages/commonwealth/build ./packages/server/build

WORKDIR ./packages/server

ENV NODE_ENV=development

EXPOSE 8080

CMD ["node", "build/index.js"]
