import axios from 'axios';
import type { AssociatedReaction } from '../../../models/Thread';
import type Thread from '../../../models/Thread';
import app from '../../../state';

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
    // TODO: use canvas id
    const like = reaction === 'like';
    const {
      session = null,
      action = null,
      hash = null,
    } = await app.sessions.signThreadReaction({
      thread_id: thread.id,
      like,
    });

    const options = {
      author_chain: app.user.activeAccount.chain.id,
      thread_id: thread.id,
      chain: app.chain.id,
      address,
      reaction,
      jwt: app.user.jwt,
      canvas_action: action,
      canvas_session: session,
      canvas_hash: hash,
    };

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
  }

  public async deleteOnThread(thread: Thread, reaction_id: number) {
    const {
      session = null,
      action = null,
      hash = null,
    } = await app.sessions.signDeleteThreadReaction({
      thread_id: thread.id,
    });

    await axios.post(`${app.serverUrl()}/deleteReaction`, {
      jwt: app.user.jwt,
      reaction_id,
      canvas_action: action,
      canvas_session: session,
      canvas_hash: hash,
    });

    this._threadIdToReactions.set(
      thread.id,
      this._threadIdToReactions
        .get(thread.id)
        ?.filter((r) => r.id !== reaction_id)
    );
  }
}

export default ThreadReactionsController;
