FROM builder

WORKDIR /packages/commonwealth

COPY . .

RUN apk add --update --no-cache python3 build-base gcc && ln -sf \
/usr/bin/python3 /usr/bin/python

ADD https://raw.githubusercontent.com/nickjj/wait-until/v0.2.0/wait-until /usr/local/bin

RUN chmod +x /usr/local/bin/wait-until

RUN yarn --ignore-engines && apk add git && yarn build \
&& yarn migrate-db

EXPOSE 8080

CMD ["yarn", "start"]

