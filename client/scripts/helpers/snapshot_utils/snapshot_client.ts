import Snapshot from '@snapshot-labs/snapshot.js';

const hubUrl = process.env.SNAPSHOT_APP_HUB_URL || 'https://testnet.snapshot.org';
const snapshotClient = new Snapshot.Client(hubUrl);

export default snapshotClient;
