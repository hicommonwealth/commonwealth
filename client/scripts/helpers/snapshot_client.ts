import Client from '@snapshot-labs/snapshot.js/src/client';

const hubUrl = 'https://testnet.snapshot.org';
const snapshotClient = new Client(hubUrl);

export default snapshotClient;
