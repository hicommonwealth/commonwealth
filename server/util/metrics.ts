import StatsD from 'node-statsd';
const { HG_API_KEY, STATSD_URL } = process.env;

let statsDInstance;
export const getStatsDInstance = () => {
  if (!statsDInstance && HG_API_KEY && STATSD_URL) {
    statsDInstance = new StatsD({ host: STATSD_URL, prefix: HG_API_KEY });
  }
  return statsDInstance;
};
