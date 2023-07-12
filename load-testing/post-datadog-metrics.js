const dgram = require('dgram');
const { client, v2 } = require('@datadog/datadog-api-client');

const metricTypes = {
  UNSPECIFIED: 0,
  COUNT: 1,
  RATE: 2,
  GAUGE: 3,
};

const configurationOpts = {
  authMethods: {
    apiKeyAuth: process.env.DD_API_KEY,
    appKeyAuth: process.env.DD_APP_KEY,
  },
};

const configuration = client.createConfiguration(configurationOpts);

client.setServerVariables(configuration, {
  site: process.env.DD_SITE,
});

const metricsApi = new v2.MetricsApi(configuration);
const prefix = 'artillery.publish_metrics_plugin.';
const tags = [
  `env:${process.env.ENV}`,
  'reporterType:datadog-api',
  `testTool:artillery`,
  `testLocation:${process.env.TEST_LOCATION}`,
  `testId:${process.env.TEST_ID}`,
  `testName:${process.env.TEST_NAME}`,
];

console.log(`Tags: ${tags}`);
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  const message = msg.toString();
  if (message.includes('Finished: Artillery.io Test')) {
    server.close();
    console.log('====Server closed====');
  }
  console.log(`server got: ${message} from ${rinfo.address}:${rinfo.port}`);
  if (message.startsWith(prefix)) {
    let metricType;
    let [metricName, metricValue] = message.split(':');
    [metricValue, metricType] = metricValue.split('|');
    if (metricType == 'g') {
      metricType = metricTypes.GAUGE;
    } else if (metricType == 'c') {
      metricType = metricTypes.COUNT;
    } else if (metricType == 'r') {
      metricType = metricTypes.RATE;
    } else {
      metricType = metricTypes.UNSPECIFIED;
    }

    metricValue = parseInt(metricValue);

    const params = {
      body: {
        series: [
          {
            metric: metricName,
            points: [
              {
                timestamp: Math.round(new Date().getTime() / 1000),
                value: metricValue,
              },
            ],
            type: metricType,
            tags: tags,
          },
        ],
      },
    };

    // https://docs.datadoghq.com/api/latest/metrics/#submit-metrics
    metricsApi
      .submitMetrics(params)
      .then((data) => {
        console.log(
          `Metrics posted successfully for ${metricName} ${metricType} ${metricValue}:`,
          data
        );
      })
      .catch((error) => {
        console.error(`Error posting metrics for ${message}:`, error);
      });
  }
});

server.on('listening', () => {
  const address = server.address();
  console.log(
    `Listening for StatsD events on ${address.address}:${address.port}`
  );
});

server.bind(8125);
