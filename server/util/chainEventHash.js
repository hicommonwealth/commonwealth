const Hash = require('object-hash');

module.exports = function hash(cwEvent) {
  return Hash({ data: cwEvent.data, blockNumber: cwEvent.blockNumber });
};
