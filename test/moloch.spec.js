const MolochDAO = require('../build/client/scripts/controllers/chain/ethereum/moloch/adapter');
const { NodeInfo } = require('../build/client/scripts/models/models');
const MolochV1 = artifacts.require('MolochV1');

contract('MolochDAO', (accounts) => {
  it('should set up a MolochDAO controller', async () => {
    const moloch = await MolochV1.deployed();
    const n = NodeInfo.fromJSON({
      id: 'moloch',
      chain: 'Moloch',
      url: 'ws://127.0.0.1:9545',
      address: moloch.address,
    });
    console.log(moloch, n);
  });
});
