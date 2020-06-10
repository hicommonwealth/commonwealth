/* eslint-disable no-restricted-syntax */
import _ from 'lodash';
import moment from 'moment-twitter';
import { ProposalStore, TagsStore } from 'stores';
import { DiscussionDraft, OffchainAttachment, OffchainTag, CommunityInfo } from 'models';

import $ from 'jquery';
import app from 'state';
import { notifyError } from 'controllers/app/notifications';

const modelFromServer = (draft) => {
  const attachments = draft.OffchainAttachments
    ? draft.OffchainAttachments.map((a) => new OffchainAttachment(a.url, a.description))
    : [];
  return new DiscussionDraft(
    draft.Address.address,
    draft.id,
    moment(draft.created_at),
    draft.community,
    draft.chain,
    decodeURIComponent(draft.title),
    decodeURIComponent(draft.body),
    draft.tag,
    attachments,
  );
};

class DraftsController {
  // private _store = new ProposalStore<OffchainThread>();

  // public get store() { return this._store; }

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
    const timestamp = moment();
    try {
      const response = await $.post(`${app.serverUrl()}/drafts`, {
        'author_chain': app.vm.activeAccount.chain.id,
        'chain': chainId,
        'community': communityId,
        'address': address,
        'title': encodeURIComponent(title),
        'body': encodeURIComponent(body),
        'attachments[]': attachments,
        'tag_name': tagName,
        'jwt': app.login.jwt,
      });
      const result = modelFromServer(response.result);
      // this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to create draft');
      throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
        : 'Failed to create draft');
    }
  }

  public async edit(
    draft: DiscussionDraft,
    title?: string,
    body?: string,
    tagName?: string,
    attachments?: string[],
  ) {
    const newBody = body || draft.body;
    const newTitle = title || draft.title;
    const newTag = tagName || draft.tag;
    // Todo: handle attachments
    try {
      const response = await $.post(`${app.serverUrl()}/editDraft`, {
        'draft_id': draft.id,
        'body': encodeURIComponent(newBody),
        'title': encodeURIComponent(newTitle),
        'tag': newTag,
        'attachments[]': attachments,
        'jwt': app.login.jwt
      });
      const result = modelFromServer(response.result);
      // if (this._store.getByIdentifier(result.id)) {
      //   this._store.remove(this._store.getByIdentifier(result.id));
      // }
      // this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to edit draft');
      throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
        : 'Failed to edit draft');
    }
  }

  public async delete(draft) {
    const _this = this;
    return new Promise((resolve, reject) => {
      $.post(`${app.serverUrl()}/deleteDraft`, {
        'jwt': app.login.jwt,
        'draft_id': draft.id,
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

  // Todo: handle refresh/refreshAll if necessary

  public deinit() {
    this._initialized = false;
    // this.store.clear();
  }
}

export default DraftsController;
