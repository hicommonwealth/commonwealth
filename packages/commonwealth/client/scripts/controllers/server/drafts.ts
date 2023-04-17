/* eslint-disable no-restricted-syntax */
import $ from 'jquery';
import moment from 'moment';
import app from 'state';
import Attachment from '../../models/Attachment';
import DiscussionDraft from '../../models/DiscussionDraft';
import DraftStore from '../../stores/DraftStore';

const modelFromServer = (draft) => {
  const attachments = draft.Attachments
    ? draft.Attachments.map((a) => new Attachment(a.url, a.description))
    : [];
  return new DiscussionDraft(
    draft.Address.address,
    draft.id,
    draft.chain,
    draft.title,
    draft.body,
    draft.topic,
    moment(draft.created_at),
    attachments
  );
};

export type DraftParams = {
  existingDraftId?: number;
  title: string;
  body: string;
  topicName: string;
  attachments?: string[];
};

class DraftsController {
  private _store = new DraftStore();

  public get store() {
    return this._store;
  }

  private _initialized = false;

  public get initialized() {
    return this._initialized;
  }

  public async create(params: DraftParams) {
    const { title, body, topicName, attachments } = params;
    try {
      const response = await $.post(`${app.serverUrl()}/drafts`, {
        address: app.user.activeAccount.address,
        author_chain: app.user.activeAccount.chain.id,
        chain: app.activeChainId(),
        title,
        body,
        topic: topicName,
        'attachments[]': attachments,
        jwt: app.user.jwt,
      });
      const result = modelFromServer(response.result);
      this._store.add(result);
      return result;
    } catch (err) {
      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? err.responseJSON.error
          : 'Failed to create draft'
      );
    }
  }

  // TODO: Handle attachments
  public async edit(params: DraftParams) {
    const { existingDraftId, title, body, topicName, attachments } = params;
    if (!existingDraftId) {
      throw new Error('Must include id of draft being edited.');
    }
    try {
      const response = await $.ajax(`${app.serverUrl()}/drafts`, {
        type: 'PATCH',
        data: {
          address: app.user.activeAccount.address,
          author_chain: app.user.activeAccount.chain.id,
          chain: app.activeChainId(),
          id: existingDraftId,
          title,
          body,
          topic: topicName,
          'attachments[]': attachments,
          jwt: app.user.jwt,
        },
      });
      const result = modelFromServer(response.result);
      if (this._store.getById(result.id)) {
        this._store.remove(this._store.getById(result.id));
      }
      this._store.add(result);
      return result;
    } catch (err) {
      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? err.responseJSON.error
          : 'Failed to edit draft'
      );
    }
  }

  public async delete(id: number) {
    try {
      const response = await $.ajax(`${app.serverUrl()}/drafts`, {
        type: 'DELETE',
        data: {
          address: app.user.activeAccount.address,
          author_chain: app.user.activeAccount.chain.id,
          chain: app.activeChainId(),
          id,
          jwt: app.user.jwt,
        },
      });
      if (response.status !== 'Success') {
        throw new Error(`${response.status} error: Failed to delete draft`);
      }
      const draft = this._store.getById(id);
      this._store.remove(draft);
    } catch (err) {
      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? err.responseJSON.error
          : 'Failed to delete draft'
      );
    }
  }

  public async refreshAll(reset = false) {
    if (!app.user || !app.user.jwt) {
      throw new Error('must be logged in to refresh drafts');
    }
    try {
      const response = await $.get(`${app.serverUrl()}/drafts`, {});
      if (response.status !== 'Success') {
        throw new Error(`Unsuccessful refresh status: ${response.status}`);
      }
      if (reset) {
        this._store.clear();
      }
      for (let draft of response.result) {
        if (!draft.Address) {
          console.error('Thread missing address');
        }
        draft = modelFromServer(draft);
        const existing = this._store.getById(draft.id);
        if (existing) {
          this._store.remove(existing);
        }
        try {
          this._store.add(draft);
        } catch (e) {
          console.error(e.message);
        }
      }
      this._initialized = true;
    } catch (err) {
      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? err.responseJSON.error
          : 'Error loading discussion drafts'
      );
    }
  }

  public deinit() {
    this._initialized = false;
    this._store.clear();
  }
}

export default DraftsController;
