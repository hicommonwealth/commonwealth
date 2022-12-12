FROM builder

WORKDIR /packages/commonwealth

COPY . .

RUN yarn --ignore-engines && apk add git && yarn install && yarn build 

CMD ["yarn", "start"]
EXPOSE 8080
