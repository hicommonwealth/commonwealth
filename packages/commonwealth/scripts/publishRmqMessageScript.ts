import {
  RascalExchanges,
  RascalRoutingKeys,
  publishRmqMsg,
} from '@hicommonwealth/adapters';

async function publishRmqMessageScript() {
  const snapshot = {};

  const publishJson = await publishRmqMsg(
    'http://guest:guest@localhost:15672/api',
    RascalExchanges.MessageRelayer,
    RascalRoutingKeys.NotificationsProviderSnapshotProposalCreated,
    snapshot,
  );

  console.log(publishJson);
}

publishRmqMessageScript();
