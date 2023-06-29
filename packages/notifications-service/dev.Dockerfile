FROM node:18.12.1

WORKDIR /root

ENTRYPOINT ["yarn", "dev"]
