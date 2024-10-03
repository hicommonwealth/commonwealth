import { logger } from '@hicommonwealth/core';
import { createEd25519PeerId, exportToProtobuf } from '@libp2p/peer-id-factory';

const log = logger(import.meta);

const id = await createEd25519PeerId();
log.info(`# ${id}`);
log.info(`PEER_ID=${Buffer.from(exportToProtobuf(id)).toString('base64')}`);
