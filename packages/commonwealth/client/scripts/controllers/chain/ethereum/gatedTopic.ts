import BN from 'bn.js';
import ITokenAdapter from '../../../models/ITokenAdapter';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';
import Topic from 'models/Topic';

export default class TopicGateCheck {
  public static isGatedTopic(topicName: string): boolean {
    if (ITokenAdapter.instanceOf(app.chain) && topicName) {
      // TODO getByName
      const data = queryClient.getQueryData<Topic[]>([
        ApiEndpoints.BulkTopics,
        app.chain.id,
      ]);

      const tokenPostingThreshold: BN = data.find(
        (el) => el.name === topicName
      )?.tokenThreshold;

      return (
        tokenPostingThreshold &&
        tokenPostingThreshold.gt(app.chain.tokenBalance)
      );
    }
    return false;
  }

  public static getTopicThreshold(topicName: string): BN {
    if (ITokenAdapter.instanceOf(app.chain) && topicName) {
      // TODO getByName
      const data = queryClient.getQueryData<Topic[]>([
        ApiEndpoints.BulkTopics,
        app.chain.id,
      ]);

      return data.find((el) => el.name === topicName)?.tokenThreshold;
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
