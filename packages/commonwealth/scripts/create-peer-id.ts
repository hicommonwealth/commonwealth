import { logger } from '@hicommonwealth/core';
import { generateKeyPair, privateKeyToProtobuf } from '@libp2p/crypto/keys';
import { peerIdFromPrivateKey } from '@libp2p/peer-id';

const log = logger(import.meta);

const privateKey = await generateKeyPair('Ed25519');

const peerId = peerIdFromPrivateKey(privateKey);

log.info(`# ${peerId}`);
log.info(
  `PEER_ID=${Buffer.from(privateKeyToProtobuf(privateKey)).toString('base64')}`,
);
