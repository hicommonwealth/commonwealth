import {
  RascalExchanges,
  RascalRoutingKeys,
  publishRmqMsg,
} from '@hicommonwealth/common-common';
import { RABBITMQ_API_URI } from '../server/config';

async function publishRmqMessageScript() {
  const snapshot = {};

  const publishJson = await publishRmqMsg(
    RABBITMQ_API_URI,
    RascalExchanges.SnapshotListener,
    RascalRoutingKeys.SnapshotListener,
    snapshot,
  );

  console.log(publishJson);
}

publishRmqMessageScript();
