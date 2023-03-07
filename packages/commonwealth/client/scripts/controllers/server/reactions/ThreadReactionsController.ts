import Thread, { AssociatedReaction } from '../../../models/Thread';
import app from '../../../state';
import { notifyError } from '../../app/notifications';

class ThreadReactionsController {
  private _threadIdToReactions: Map<number, AssociatedReaction[]> = new Map<number, AssociatedReaction[]>();

  public refreshReactionsFromThreads(threads: Thread[]) {
    threads.forEach(t => {
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
      chain: app.chain.id,
      thread_id: thread.id,
      address,
      reaction,
      jwt: app.user.jwt,
      canvas_action: action,
      canvas_session: session,
      canvas_hash: hash,
    };

    try {
      const response = await $.post(
        `${app.serverUrl()}/createReaction`,
        options
      );

      const existingReactions = this._threadIdToReactions.get(thread.id);
      if (!existingReactions) {
        this._threadIdToReactions.set(thread.id, [response.result]);
      } else {
        this._threadIdToReactions.set(thread.id,
          [...existingReactions, {
            id: response.result.id,
            type: response.result.reaction,
            address: response.result.address
          }]
        );
      }
    } catch (err) {
      notifyError('Failed to save reaction');
    }
  }

  public async deleteOnThread(address, thread: Thread) {
    const {
      session = null,
      action = null,
      hash = null,
    } = await app.sessions.signDeleteThreadReaction({
      thread_id: thread.canvasHash,
    });

    try {
      await $.post(`${app.serverUrl()}/deleteReaction`, {
        jwt: app.user.jwt,
        reaction_id: thread.associatedReactions.filter(r => r.address === address)[0].id,
        canvas_action: action,
        canvas_session: session,
        canvas_hash: hash,
      });

      this._threadIdToReactions.set(
        thread.id,
        this._threadIdToReactions.get(thread.id).filter(r => r.address !== address)
      );

    } catch (e) {
      console.error(e);
      notifyError('Failed to update reaction count');
    }
  }

}

export default ThreadReactionsController;
