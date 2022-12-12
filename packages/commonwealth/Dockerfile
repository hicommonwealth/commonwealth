FROM builder

COPY . .

RUN apk add --update --no-cache python3 build-base gcc && ln -sf \
/usr/bin/python3 /usr/bin/python && apk add postgresql-client

ENV WAIT_VERSION 2.7.2

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/$WAIT_VERSION/wait /wait

RUN chmod +x /wait

RUN yarn --ignore-engines && apk add git && yarn build \

EXPOSE 8080

CMD /wait && yarn start

