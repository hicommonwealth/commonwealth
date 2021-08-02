import StatsD from 'node-statsd';
const { HG_API_KEY, STATSD_URL } = process.env;

let statsDInstance;
export const getStatsDInstance = () => {
  if (!statsDInstance) {
    statsDInstance = new StatsD(STATSD_URL,  8125, HG_API_KEY);
  }
  return statsDInstance;
};
