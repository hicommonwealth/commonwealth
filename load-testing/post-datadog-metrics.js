const dgram = require('dgram');
const { client, v2 } = require('@datadog/datadog-api-client');
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
const tags = ['env:dev', 'reporterType:datadog-agent'];

const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  const message = msg.toString();
  if (message.startsWith(prefix)) {
    const [metricName, metricValue, metricType] = message.split(':');

    const params = {
      body: {
        series: [
          {
            metric: metricName,
            points: [[Date.now() / 1000, parseInt(metricValue)]],
            type: metricType,
            tags: tags,
          },
        ],
      },
    };

    metricsApi
      .submitMetrics(params)
      .then((data) => {
        console.log(`Metrics posted successfully for ${metricName}:`, data);
      })
      .catch((error) => {
        console.error(`Error posting metrics for ${metricName}:`, error);
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
