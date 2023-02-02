ARG PORT

FROM node:18.13.0-alpine

WORKDIR /commonwealth

COPY . .

RUN yarn --ignore-engines

EXPOSE $PORT

RUN yarn start &

HEALTHCHECK --interval=5m --timeout=3s \
  CMD curl -f http://localhost/$PORT || exit 1