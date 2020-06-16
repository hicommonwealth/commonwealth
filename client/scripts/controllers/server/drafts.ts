/* eslint-disable no-restricted-syntax */
import _ from 'lodash';
import moment from 'moment-twitter';
import { ProposalStore, TagStore } from 'stores';
import { DiscussionDraft, OffchainAttachment, OffchainTag, CommunityInfo } from 'models';

import $ from 'jquery';
import app from 'state';
import { notifyError } from 'controllers/app/notifications';
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
    address: string,
    chainId: string,
    communityId: string,
    title?: string,
    body?: string,
    tagName?: string,
    attachments?: string[],
  ) {
    try {
      const response = await $.post(`${app.serverUrl()}/drafts`, {
        'address': app.vm.activeAccount.address,
        'author_chain': app.vm.activeAccount.chain.id,
        'chain': chainId,
        'community': communityId,
        'title': title,
        'body': body,
        'attachments[]': attachments,
        'tag': tagName,
        'jwt': app.login.jwt,
      });
      const result = modelFromServer(response.result);
      this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to create draft');
      throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
        : 'Failed to create draft');
    }
  }

  public async edit(
    draftId: number,
    title?: string,
    body?: string,
    tagName?: string,
    attachments?: string[],
  ) {
    // Todo: handle attachments
    try {
      const response = await $.ajax(`${app.serverUrl()}/drafts`, {
        type: 'PATCH',
        data: {
          'address': app.vm.activeAccount.address,
          'author_chain': app.vm.activeAccount.chain.id,
          'community': app.activeCommunityId(),
          'chain': app.activeChainId(),
          'id': draftId,
          'body': body,
          'title': title,
          'tag': tagName,
          'attachments[]': attachments,
          'jwt': app.login.jwt
        }
      });
      const result = modelFromServer(response.result);
      if (this._store.getById(result.id)) {
        this._store.remove(this._store.getById(result.id));
      }
      this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to edit draft');
      throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
        : 'Failed to edit draft');
    }
  }

  public async delete(draftId: number) {
    return new Promise((resolve, reject) => {
      $.ajax(`${app.serverUrl()}/drafts`, {
        type: 'DELETE',
        data: {
          'address': app.vm.activeAccount.address,
          'author_chain': app.vm.activeAccount.chain.id,
          'community': app.activeCommunityId(),
          'chain': app.activeChainId(),
          'jwt': app.login.jwt,
          'id': draftId,
        }
      }).then((result) => {
        // _this.store.remove(draft);
        resolve(result);
      }).catch((e) => {
        console.error(e);
        notifyError('Could not delete draft');
        reject(e);
      });
    });
  }

  public refreshAll(reset = false) {
    if (!app.login || !app.login.jwt) {
      throw new Error('must be logged in to refresh drafts');
    }
    return $.get(`${app.serverUrl()}/drafts`, {
      'address': app.vm.activeAccount.address,
      'author_chain': app.vm.activeAccount.chain.id,
      'jwt': app.login.jwt
    }).then((response) => {
      if (response.status !== 'Success') {
        throw new Error(`Unsuccessful refresh status: ${response.status}`);
      }
      if (reset) {
        this._store.clear();
      }
      for (const draft of response.result) {
        if (!draft.Address) {
          console.error('OffchainThread missing address');
        }
        const existing = this._store.getById(draft.id);
        if (existing) {
          this._store.remove(existing);
        }
        try {
          this._store.add(modelFromServer(draft));
        } catch (e) {
          console.error(e.message);
        }
      }
      this._initialized = true;
    }, (err) => {
      console.log('failed to load discussion drafts');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Error loading discussion drafts');
    });
  }

  public deinit() {
    this._initialized = false;
    // this.store.clear();
  }
}

export default DraftsController;
