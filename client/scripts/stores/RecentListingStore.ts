import moment from 'moment';
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
  topicInitialized: { [topicName: string]: boolean };
  stageInitialized: { [stageName: string]: boolean };

  allThreadsCutoffDate: moment.Moment;
  topicCutoffDate: { [topicName: string]: moment.Moment };
  stageCutoffDate: { [stageName: string]: moment.Moment };

  allThreadsDepleted: boolean;
  topicDepleted: { [topicName: string]: boolean };
  stageDepleted: { [stageName: string]: boolean };
}

class RecentListingStore extends IdStore<OffchainThread> {
  private threads = new Array<OffchainThread>();
  private fetchState: IListingFetchState = {
    allThreadsInitialized: false,
    topicInitialized: {},
    stageInitialized: {},

    allThreadsCutoffDate: moment(),
    topicCutoffDate: {},
    stageCutoffDate: {},

    allThreadsDepleted: false,
    topicDepleted: {},
    stageDepleted: {},
  };

  public add(thread: OffchainThread) {
    const existingThread = this.getById(thread.id);
    if (existingThread) this.remove(existingThread);

    super.add(thread);
    this.threads.push(thread);
    return this;
  }

  public remove(thread: OffchainThread) {
    const existingThread = this.getById(thread.id);
    if (!existingThread) return;
    const proposalIndex = this.threads.indexOf(existingThread);
    if (proposalIndex === -1) return;

    super.remove(thread);
    this.threads.splice(proposalIndex, 1);
    return this;
  }

  public clear() {
    super.clear();
    this.threads = [];
  }

  public getById(id) {
    return this.threads.find((t) => t.id === id);
  }

  public getThreads(params: IListingParams): OffchainThread[] {
    const { topicName, stageName, pinned } = params;

    let unsortedThreads;
    if (topicName) {
      unsortedThreads = this.threads.filter(
        (t) => t.topic.name === topicName && t.pinned === pinned
      );
    } else if (stageName) {
      unsortedThreads = this.threads.filter(
        (t) => t.stage === stageName && t.pinned === pinned
      );
    } else {
      unsortedThreads = this.threads.filter((t) => t.pinned === pinned);
    }

    return unsortedThreads.sort(orderDiscussionsbyLastComment);
  }

  public getPinnedThreads(): OffchainThread[] {
    return this.threads
      .filter((t) => t.pinned)
      .sort(orderDiscussionsbyLastComment);
  }

  // Initialization, i.e. "Have we begun fetching threads of this type?"

  public isInitialized(params: IListingParams): boolean {
    const { topicName, stageName } = params;
    if (topicName) {
      return this.fetchState.topicInitialized[topicName];
    } else if (stageName) {
      return this.fetchState.stageInitialized[stageName];
    } else {
      return this.fetchState.allThreadsInitialized;
    }
  }

  public initializeListing(params: IListingParams) {
    const { topicName, stageName } = params;
    if (topicName) {
      this.fetchState.topicInitialized[topicName] = true;
    } else if (stageName) {
      this.fetchState.stageInitialized[stageName] = true;
    } else {
      this.fetchState.allThreadsInitialized = true;
    }
  }

  // Subpage depletion status, i.e. "Have all threads of this type been fetched?"

  public isDepleted(params: IListingParams): boolean {
    const { topicName, stageName } = params;
    if (topicName) {
      return this.fetchState.topicDepleted[topicName];
    } else if (stageName) {
      return this.fetchState.stageDepleted[stageName];
    } else {
      return this.fetchState.allThreadsDepleted;
    }
  }

  public depleteListing(params: IListingParams) {
    const { topicName, stageName } = params;
    if (topicName) {
      this.fetchState.topicDepleted[topicName] = true;
    } else if (stageName) {
      this.fetchState.stageDepleted[stageName] = true;
    } else {
      this.fetchState.allThreadsDepleted = true;
    }
  }

  // Cutoff date, i.e. "Up to what archival point have threads been fetched?"

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

  // When topics are deleted, the threads associated with them must be updated

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
