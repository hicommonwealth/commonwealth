FROM node:18.13.0-alpine

WORKDIR /usr/src/app

COPY . .

# git needed for yarn, rest needed for node-gyp to build (dependency yarn installs)
RUN apk --no-cache add git python3 make gcc g++

RUN yarn --ignore-engines

# tells commonwealth server what to use for PORT, RABBITMQ_URI, REDIS_URL, DATABASE_URL
ARG PORT
ENV PORT=$PORT
ARG RABBITMQ_URI
ENV RABBITMQ_URI=$RABBITMQ_URI
ARG REDIS_URL
ENV REDIS_URL=$REDIS_URL
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

EXPOSE $PORT

CMD ["yarn", "start"]