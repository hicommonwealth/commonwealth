import subscribeEdgewareEvents from './shared/events/edgeware/index';

const url = process.env.NODE_URL || undefined;
subscribeEdgewareEvents(url);
