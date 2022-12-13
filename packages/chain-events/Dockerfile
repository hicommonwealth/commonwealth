FROM builder

WORKDIR /packages/common-common

COPY . .

RUN apk add --update --no-cache python3 build-base gcc && ln -sf \
/usr/bin/python3 /usr/bin/python

RUN yarn --ignore-engines && yarn install 
CMD ["yarn", "start"]
