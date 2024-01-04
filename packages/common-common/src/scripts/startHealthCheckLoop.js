'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.startHealthCheckLoop = exports.ServiceKey = void 0;
const statsd_1 = require('../../src/statsd');
const logging_1 = require('../../src/logging');
const log = logging_1.factory.getLogger(
  (0, logging_1.formatFilename)(__filename),
);
const PING_INTERVAL = 1_000 * 20;
var ServiceKey;
(function (ServiceKey) {
  ServiceKey['Commonwealth'] = 'commonwealth';
  ServiceKey['CommonwealthConsumer'] = 'commonwealth-consumer';
  ServiceKey['DiscordBotListener'] = 'discord-bot-listener';
  ServiceKey['DiscordBotConsumer'] = 'discord-bot-consumer';
  ServiceKey['ChainEventsApp'] = 'chain-events-app';
  ServiceKey['ChainEventsConsumer'] = 'chain-events-consumer';
  ServiceKey['ChainEventsSubscriber'] = 'chain-events-subscriber';
  ServiceKey['SnapshotListener'] = 'snapshot-listener';
})(ServiceKey || (exports.ServiceKey = ServiceKey = {}));
function startHealthCheckLoop({ enabled = true, service, checkFn }) {
  if (!enabled) {
    return;
  }
  log.info(`starting health check loop for ${service}`);
  const stat = `service.health.${service}`;
  // perform a loop that invokes 'checkFn' and sends status to StatsD
  const loop = async () => {
    const nextCheckAt = Date.now() + PING_INTERVAL;
    let status = 0;
    try {
      await checkFn();
      status = 1;
    } catch (err) {
      log.error(err);
    }
    statsd_1.StatsDController.get().gauge(stat, status);
    const durationUntilNextCheck = nextCheckAt - Date.now();
    setTimeout(loop, durationUntilNextCheck);
  };
  loop();
}
exports.startHealthCheckLoop = startHealthCheckLoop;
