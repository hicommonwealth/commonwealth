import app from 'state';
import BN from 'bn.js';
import { ITokenAdapter } from 'models';

export default class TopicGateCheck {  

    // TODO do something with address
    public static async isGatedTopic(topicName: string, tokenBalance: string, address?: string): Promise<boolean> {
        if (ITokenAdapter.instanceOf(app.chain) && topicName) {
          let tokenPostingThreshold: BN = app.topics.getByName(
            topicName,
            app.activeId()
          )?.tokenThreshold;
          return tokenPostingThreshold && tokenPostingThreshold.gt(tokenBalance);
        }
        return false; 
    };

    public static async getTopicThreshold(topicName: string): Promise<BN> {
        if (ITokenAdapter.instanceOf(app.chain) && topicName) {
          return app.topics.getByName(
            topicName,
            app.activeId()
          )?.tokenThreshold;
        }
        return new BN('0', 10);
    };
}
