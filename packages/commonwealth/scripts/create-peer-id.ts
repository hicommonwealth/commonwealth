#!/usr/bin/env npx tsx
import { generateKeyPair, privateKeyToProtobuf } from '@libp2p/crypto/keys';
import { peerIdFromPrivateKey } from '@libp2p/peer-id';

const privateKey = await generateKeyPair('Ed25519');
const peerId = peerIdFromPrivateKey(privateKey);

console.log(`# ${peerId}`);
console.log(
  `LIBP2P_PRIVATE_KEY=${Buffer.from(privateKeyToProtobuf(privateKey)).toString('base64')}`,
);
