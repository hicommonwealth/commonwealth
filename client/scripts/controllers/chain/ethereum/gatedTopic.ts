import app from 'state';
import BN from 'bn.js';
import { ITokenAdapter } from 'models';

export default class TopicGateCheck {

    // TODO do something with address
    public static isGatedTopic(topicName: string, address?: string): boolean {
        if (ITokenAdapter.instanceOf(app.chain) && topicName) {
          const tokenPostingThreshold: BN = app.topics.getByName(
            topicName,
            app.activeId()
          )?.tokenThreshold;
          return tokenPostingThreshold && tokenPostingThreshold.gt(app.chain.tokenBalance);
        }
        return false;
    }

    public static getTopicThreshold(topicName: string): BN {
        if (ITokenAdapter.instanceOf(app.chain) && topicName) {
          return app.topics.getByName(
            topicName,
            app.activeId()
          )?.tokenThreshold;
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
