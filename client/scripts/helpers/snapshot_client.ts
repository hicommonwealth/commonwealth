import Client from '@snapshot-labs/snapshot.js/src/client';

const hubUrl = process.env.SNAPSHOT_HUB_URL || 'https://testnet.snapshot.org';
const snapshotClient = new Client(hubUrl);

export default snapshotClient;
