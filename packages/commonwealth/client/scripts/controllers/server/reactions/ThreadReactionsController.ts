import axios from 'axios';
import type { AssociatedReaction } from '../../../models/Thread';
import type Thread from '../../../models/Thread';
import app from '../../../state';
import { notifyError } from '../../app/notifications';

class ThreadReactionsController {
  private _threadIdToReactions: Map<number, AssociatedReaction[]> = new Map<
    number,
    AssociatedReaction[]
  >();

  public refreshReactionsFromThreads(threads: Thread[]) {
    threads.forEach((t) => {
      this._threadIdToReactions.set(t.id, t.associatedReactions);
    });
  }

  public getByThreadId(threadId: number): AssociatedReaction[] {
    return this._threadIdToReactions.get(threadId);
  }

  public async createOnThread(
    address: string,
    thread: Thread,
    reaction: string
  ) {
    const options = {
      author_chain: app.user.activeAccount.chain.id,
      chain: app.chain.id,
      thread_id: thread.id,
      address,
      reaction,
      jwt: app.user.jwt
    };

    try {
      const response = (
        await axios.post(`${app.serverUrl()}/createReaction`, options)
      ).data;

      const existingReactions = this._threadIdToReactions.get(thread.id);
      if (!existingReactions) {
        this._threadIdToReactions.set(thread.id, [response.result]);
      } else {
        this._threadIdToReactions.set(thread.id, [
          ...existingReactions,
          {
            id: response.result.id,
            type: response.result.reaction,
            address: response.result.address,
          },
        ]);
      }
      return response.result;
    } catch (err) {
      notifyError('Failed to save reaction');
    }
  }

  public async deleteOnThread(thread: Thread, reaction_id: number) {
    try {
      await axios.post(`${app.serverUrl()}/deleteReaction`, {
        jwt: app.user.jwt,
        reaction_id
      });

      this._threadIdToReactions.set(
        thread.id,
        this._threadIdToReactions
          .get(thread.id)
          .filter((r) => r.id !== reaction_id)
      );
    } catch (e) {
      console.error(e);
      notifyError('Failed to update reaction count');
    }
  }
}

export default ThreadReactionsController;