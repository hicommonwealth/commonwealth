/* eslint-disable no-restricted-syntax */
import _ from 'lodash';
import { DiscussionDraft, OffchainAttachment } from 'models';

import $ from 'jquery';
import app from 'state';
import DraftStore from '../../stores/DraftStore';

const modelFromServer = (draft) => {
  const attachments = draft.OffchainAttachments
    ? draft.OffchainAttachments.map((a) => new OffchainAttachment(a.url, a.description))
    : [];
  return new DiscussionDraft(
    draft.Address.address,
    draft.id,
    draft.community,
    draft.chain,
    draft.title,
    draft.body,
    draft.tag,
    attachments,
  );
};

class DraftsController {
  private _store = new DraftStore();

  public get store() { return this._store; }

  private _initialized = false;

  public get initialized() { return this._initialized; }

  public async create(
    title: string,
    body: string,
    tagName: string,
    attachments?: string[],
  ) {
    try {
      const response = await $.post(`${app.serverUrl()}/drafts`, {
        'address': app.user.activeAccount.address,
        'author_chain': app.user.activeAccount.chain.id,
        'chain': app.activeChainId(),
        'community': app.activeCommunityId(),
        'title': title,
        'body': body,
        'tag': tagName,
        'attachments[]': attachments,
        'jwt': app.user.jwt,
      });
      const result = modelFromServer(response.result);
      this._store.add(result);
      return result;
    } catch (err) {
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to create draft');
    }
  }

  public async edit(
    id: number,
    title: string,
    body: string,
    tagName: string,
    attachments?: string[],
  ) {
    // Todo: handle attachments
    try {
      const response = await $.ajax(`${app.serverUrl()}/drafts`, {
        type: 'PATCH',
        data: {
          'address': app.user.activeAccount.address,
          'author_chain': app.user.activeAccount.chain.id,
          'community': app.activeCommunityId(),
          'chain': app.activeChainId(),
          'id': id,
          'title': title,
          'body': body,
          'tag': tagName,
          'attachments[]': attachments,
          'jwt': app.user.jwt
        }
      });
      const result = modelFromServer(response.result);
      if (this._store.getById(result.id)) {
        this._store.remove(this._store.getById(result.id));
      }
      this._store.add(result);
      return result;
    } catch (err) {
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to edit draft');
    }
  }

  public async delete(id: number) {
    try {
      const response = await $.ajax(`${app.serverUrl()}/drafts`, {
        type: 'DELETE',
        data: {
          'address': app.user.activeAccount.address,
          'author_chain': app.user.activeAccount.chain.id,
          'community': app.activeCommunityId(),
          'chain': app.activeChainId(),
          'id': id,
          'jwt': app.user.jwt,
        }
      });
      console.log(response);
      console.log(response.status);
      if (response.status !== 200) {
        throw new Error(`${response.status} error: Failed to delete draft`);
      }
      const draft = this._store.getById(id);
      this._store.remove(draft);
    } catch (err) {
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to delete draft');
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
          console.error('OffchainThread missing address');
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
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Error loading discussion drafts');
    }
  }

  public deinit() {
    this._initialized = false;
    this._store.clear();
  }
}

export default DraftsController;
