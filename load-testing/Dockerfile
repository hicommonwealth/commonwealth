FROM node:18.16.1-alpine3.18
WORKDIR /load-testing

COPY app /load-testing/app
COPY post-datadog-metrics.js /load-testing
COPY package.json /load-testing
RUN yarn install
COPY load-test.sh /load-testing
RUN chmod +x load-test.sh

CMD ["./load-test.sh"]