FROM builder

WORKDIR /packages/commonwealth

COPY . .

RUN apk add --update --no-cache python3 build-base gcc && ln -sf \
/usr/bin/python3 /usr/bin/python

RUN yarn --ignore-engines && apk add git && apk add curl && apk add postgresql-client && yarn install && yarn build 

CMD ["yarn", "start"]
EXPOSE 8080
