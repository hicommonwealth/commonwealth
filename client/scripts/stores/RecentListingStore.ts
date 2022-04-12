import moment, { Moment } from 'moment';
import IdStore from './IdStore';
import { OffchainThread } from '../models';
import { orderDiscussionsbyLastComment } from '../views/pages/discussions/helpers';

interface IListingParams {
  topicName?: string;
  stageName?: string;
  pinned?: boolean;
}

interface IListingFetchState {
  allThreadsInitialized: boolean;
  topicInitialization: { [topicName: string]: boolean };
  stageInitialization: { [stageName: string]: boolean };

  allThreadsCutoffDate: moment.Moment;
  topicCutoffDate: { [topicName: string]: moment.Moment };
  stageCutoffDate: { [stageName: string]: moment.Moment };

  allThreadsDepleted: boolean;
  topicDepletion: { [topicName: string]: boolean };
  stageDepletion: { [stageName: string]: boolean };
}

class RecentListingStore extends IdStore<OffchainThread> {
  private threads = new Array<OffchainThread>();
  private fetchState: IListingFetchState = {
    allThreadsInitialized: false,
    topicInitialization: {},
    stageInitialization: {},

    allThreadsCutoffDate: moment(),
    topicCutoffDate: {},
    stageCutoffDate: {},

    allThreadsDepleted: false,
    topicDepletion: {},
    stageDepletion: {},
  };

  public add(thread: OffchainThread) {
    const matchingThread = this.threads.filter((t) => t.id === thread.id)[0];
    if (matchingThread) {
      this.remove(matchingThread);
    }
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

  public getPinnedThreads(): OffchainThread[] {
    return this.threads
      .filter((t) => t.pinned)
      .sort(orderDiscussionsbyLastComment);
  }

  public getListingThreads(params: IListingParams): OffchainThread[] {
    const { topicName, stageName, pinned } = params;
    console.log({
      params,
      threads: this.threads,
    });
    debugger;
    if (topicName) {
      return this.threads
        .filter((t) => t.topic.name === topicName && t.pinned === pinned)
        .sort(orderDiscussionsbyLastComment);
    } else if (stageName) {
      return this.threads
        .filter((t) => t.stage === stageName && t.pinned === pinned)
        .sort(orderDiscussionsbyLastComment);
    } else {
      return this.threads
        .filter((t) => t.pinned === pinned)
        .sort(orderDiscussionsbyLastComment);
    }
  }

  public getCutoffDate(params: IListingParams): moment.Moment {
    const { topicName, stageName } = params;
    if (topicName) {
      return this.fetchState.topicCutoffDate[topicName];
    } else if (stageName) {
      return this.fetchState.stageCutoffDate[stageName];
    } else {
      return this.fetchState.allThreadsCutoffDate;
    }
  }

  public setCutoffDate(params: IListingParams, cutoffDate: moment.Moment) {
    const { topicName, stageName } = params;
    if (topicName) {
      this.fetchState.topicCutoffDate[topicName] = cutoffDate;
    } else if (stageName) {
      this.fetchState.stageCutoffDate[stageName] = cutoffDate;
    } else {
      this.fetchState.allThreadsCutoffDate = cutoffDate;
    }
  }

  public depleteListing(params: IListingParams) {
    const { topicName, stageName } = params;
    if (topicName) {
      this.fetchState.topicDepletion[topicName] = true;
    } else if (stageName) {
      this.fetchState.stageDepletion[stageName] = true;
    } else {
      this.fetchState.allThreadsDepleted = true;
    }
  }

  public isDepleted(params: IListingParams): boolean {
    const { topicName, stageName } = params;
    if (topicName) {
      return this.fetchState.topicDepletion[topicName];
    } else if (stageName) {
      return this.fetchState.stageDepletion[stageName];
    } else {
      return this.fetchState.allThreadsDepleted;
    }
  }

  public initializeListing(params: IListingParams) {
    const { topicName, stageName } = params;
    if (topicName) {
      this.fetchState.topicInitialization[topicName] = true;
    } else if (stageName) {
      this.fetchState.stageInitialization[stageName] = true;
    } else {
      this.fetchState.allThreadsInitialized = true;
    }
  }

  public isInitialized(params: IListingParams): boolean {
    const { topicName, stageName } = params;
    if (topicName) {
      return this.fetchState.topicInitialization[topicName];
    } else if (stageName) {
      return this.fetchState.stageInitialization[stageName];
    } else {
      return this.fetchState.allThreadsInitialized;
    }
  }

  public removeTopic(topicName: string) {
    this.threads
      .filter((t) => {
        return t.topic?.name === topicName;
      })
      .forEach((t) => {
        t.topic = null;
      });
  }
}

export default RecentListingStore;
