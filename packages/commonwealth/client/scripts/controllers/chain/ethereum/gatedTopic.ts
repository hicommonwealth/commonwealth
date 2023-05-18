import BN from 'bn.js';
import ITokenAdapter from '../../../models/ITokenAdapter';
import app from 'state';
// import { queryClient } from 'state/api/config';

export default class TopicGateCheck {
  public static isGatedTopic(topicName: string): boolean {
    if (ITokenAdapter.instanceOf(app.chain) && topicName) {
      const tokenPostingThreshold: BN = app.topics.getByName(
        topicName,
        app.activeChainId()
      )?.tokenThreshold;
      return (
        tokenPostingThreshold &&
        tokenPostingThreshold.gt(app.chain.tokenBalance)
      );
    }
    return false;
  }

  public static getTopicThreshold(topicName: string): BN {
    // const here = queryClient.getQueryData(['bulkTopics', app.activeChainId()]);

    if (ITokenAdapter.instanceOf(app.chain) && topicName) {
      return app.topics.getByName(topicName, app.activeChainId())
        ?.tokenThreshold;
    }
    return new BN('0', 10);
  }

  public static getUserBalance(): BN {
    if (ITokenAdapter.instanceOf(app.chain)) {
      return new BN(app.chain.tokenBalance, 10);
    }
    return new BN('0', 10);
  }
}
