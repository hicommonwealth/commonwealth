import IdStore from './IdStore';
import { OffchainThread } from '../models';
import { ALL_PROPOSALS_KEY } from '../views/pages/discussions';

class RecentListingStore extends IdStore<OffchainThread> {
  private threads = new Array<OffchainThread>();

  public add(
    thread: OffchainThread,
  ) {
    super.add(thread);
    this.threads.push(thread);
    return this;
  }

  public remove(thread: OffchainThread) {
    // TODO: Assess reliable inter-store id strategies, e.g. super.getById(thread.id);
    super.remove(thread);
    const matchingThread = this.threads.filter((t) => t.id === thread.id)[0];
    if (!matchingThread) return;
    const proposalIndex = this.threads.indexOf(matchingThread);
    if (proposalIndex === -1) return;
    this.threads.splice(proposalIndex, 1);
    
    return this;
  }

  public clear() {
    super.clear();
    this.threads = [];
  }

  public getByTopic(
    topicName: string,
  ): Array<OffchainThread> {
    return this.threads.filter((t) => t.topic.name === topicName);
  }

  public getByStage(
    stageName: string,
  ): Array<OffchainThread> {
    return this.threads.filter((t) => t.stage === stageName);
  }

  public removeTopic(topicName: string) {
    this.threads.filter((t) => {
      return (t.topic?.name === topicName);
    }).forEach((t) => {

      t.topic = null;
    })
  }
}

export default RecentListingStore;
