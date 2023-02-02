FROM node:18.13.0-alpine

WORKDIR /commonwealth

COPY ../../ .

RUN yarn --ignore-engines

EXPOSE 8080

RUN yarn start &

HEALTHCHECK --interval=5m --timeout=3s \
  CMD curl -f http://localhost/ || exit 1

