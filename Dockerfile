FROM node:18.13.0-alpine

WORKDIR /usr/src/app

COPY . .

# yarn needs git, otherwise it will fail
RUN apk --no-cache add git

RUN yarn --ignore-engines

ARG PORT
ENV PORT=$PORT

EXPOSE $PORT

CMD ["yarn", "start"]