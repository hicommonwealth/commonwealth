import moment from 'moment';
import type Thread from '../models/Thread';
import { orderDiscussionsbyLastComment } from '../views/pages/discussions/helpers';
import IdStore from './IdStore';

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

class RecentListingStore extends IdStore<Thread> {
  private _threads = new Array<Thread>();
  public get threads() {
    return this._threads;
  }

  private _fetchState: IListingFetchState = this._resetFetchState();

  public add(thread: Thread) {
    const existingThread = this.getById(thread.id);
    if (existingThread) this.remove(existingThread);

    super.add(thread);
    this._threads.push(thread);
    return this;
  }

  public remove(thread: Thread) {
    const existingThread = this.getById(thread.id);
    if (!existingThread) return;
    const proposalIndex = this._threads.indexOf(existingThread);
    if (proposalIndex === -1) return;

    super.remove(thread);
    this._threads.splice(proposalIndex, 1);
    return this;
  }

  public clear() {
    super.clear();
    this._threads = [];
    this._fetchState = this._resetFetchState();
  }

  // Getters

  public getThreads(params: IListingParams): Thread[] {
    const { topicName, stageName, pinned } = params;

    let unsortedThreads;
    if (topicName) {
      unsortedThreads = this._threads.filter(
        (t) => t.topic?.name === topicName && t.pinned === pinned
      );
    } else if (stageName) {
      unsortedThreads = this._threads.filter(
        (t) => t.stage === stageName && t.pinned === pinned
      );
    } else {
      unsortedThreads = this._threads.filter((t) => t.pinned === pinned);
    }

    return unsortedThreads
      .filter((t) => this._isBeforeCutoff(params, t))
      .sort(orderDiscussionsbyLastComment);
  }

  public getPinnedThreads(): Thread[] {
    return this._threads
      .filter((t) => t.pinned)
      .sort(orderDiscussionsbyLastComment);
  }

  // Initialization, i.e. "Have we begun fetching threads of this type?"

  public isInitialized(params: IListingParams): boolean {
    const { topicName, stageName } = params;
    if (topicName) {
      return this._fetchState.topicInitialized[topicName];
    } else if (stageName) {
      return this._fetchState.stageInitialized[stageName];
    } else {
      return this._fetchState.allThreadsInitialized;
    }
  }

  public initializeListing(params: IListingParams) {
    const { topicName, stageName } = params;
    if (topicName) {
      this._fetchState.topicInitialized[topicName] = true;
    } else if (stageName) {
      this._fetchState.stageInitialized[stageName] = true;
    } else {
      this._fetchState.allThreadsInitialized = true;
    }
  }

  // Subpage depletion status, i.e. "Have all threads of this type been fetched?"

  public isDepleted(params: IListingParams): boolean {
    const { topicName, stageName } = params;
    if (topicName) {
      return this._fetchState.topicDepleted[topicName];
    } else if (stageName) {
      return this._fetchState.stageDepleted[stageName];
    } else {
      return this._fetchState.allThreadsDepleted;
    }
  }

  public depleteListing(params: IListingParams) {
    const { topicName, stageName } = params;
    if (topicName) {
      this._fetchState.topicDepleted[topicName] = true;
    } else if (stageName) {
      this._fetchState.stageDepleted[stageName] = true;
    } else {
      this._fetchState.allThreadsDepleted = true;
    }
  }

  // Cutoff date, i.e. "Up to what archival point have threads been fetched?"

  public getCutoffDate(params: IListingParams): moment.Moment {
    const { topicName, stageName } = params;

    if (topicName) {
      return this._fetchState.topicCutoffDate[topicName];
    } else if (stageName) {
      return this._fetchState.stageCutoffDate[stageName];
    } else {
      return this._fetchState.allThreadsCutoffDate;
    }
  }

  public setCutoffDate(params: IListingParams, cutoffDate: moment.Moment) {
    const { topicName, stageName } = params;
    if (topicName) {
      this._fetchState.topicCutoffDate[topicName] = cutoffDate;
    } else if (stageName) {
      this._fetchState.stageCutoffDate[stageName] = cutoffDate;
    } else {
      this._fetchState.allThreadsCutoffDate = cutoffDate;
    }
  }

  // Filter function to determine inclusion of threads on listing page

  private _isBeforeCutoff(params: IListingParams, thread: Thread): boolean {
    const { topicName, stageName, pinned } = params;
    const listingCutoff = topicName
      ? this._fetchState.topicCutoffDate[topicName]
      : stageName
      ? this._fetchState.stageCutoffDate[stageName]
      : this._fetchState.allThreadsCutoffDate;
    const lastUpdate = thread.lastCommentedOn || thread.createdAt;
    return (pinned && thread.pinned) || +lastUpdate >= +listingCutoff;
  }

  // When topics are deleted, the threads associated with them must be updated

  public removeTopic(topicName: string) {
    delete this._fetchState.topicInitialized[topicName];
    delete this._fetchState.topicCutoffDate[topicName];
    delete this._fetchState.topicDepleted[topicName];
    this._threads
      .filter((t) => {
        return t.topic?.name === topicName;
      })
      .forEach((t) => {
        t.topic = null;
      });
  }

  // Helper function

  private _resetFetchState(): IListingFetchState {
    return {
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
  }
}

export default RecentListingStore;
