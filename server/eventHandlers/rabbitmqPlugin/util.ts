// TODO: generalize this for any config file at any path
// returns either the RabbitMQ config specified by the filepath or the default config
import fs from 'fs';
import config from './RabbitMQconfig.json';

export function getRabbitMQConfig(filepath?: string) {
  if (!filepath) return config;
  try {
    const raw = fs.readFileSync(filepath);
    return JSON.parse(raw.toString());
  } catch (error) {
    console.error(`Failed to load the configuration file at: ${filepath}`);
    console.warn('Using default RabbitMQ configuration');
    return config;
  }
}
