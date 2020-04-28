/* eslint-disable dot-notation */
/* eslint-disable no-restricted-syntax */
import { default as $ } from 'jquery';
import { default as _ } from 'lodash';
import { default as moment } from 'moment-twitter';

import app from 'state';
import { uniqueIdToProposal } from 'identifiers';

import { ReactionsStore } from 'stores';
import { OffchainReaction, IUniqueId, AnyProposal, OffchainComment, OffchainThread } from 'models';
import { notifyError } from 'controllers/app/notifications';

const modelFromServer = (reaction) => {
  return new OffchainReaction(
    reaction.id,
    reaction.Address.address,
    reaction.chain,
    reaction.community,
    reaction.reaction,
    reaction.thread_id,
    reaction.comment_id,
    reaction.Address.chain,
  );
};

class ReactionsController {
  private _store: ReactionsStore = new ReactionsStore();
  public get store() { return this._store; }

  public getByPost(post: OffchainThread | OffchainComment<any>) {
    return this._store.getByPost(post);
  }

  public async create(address: string, post: any, reaction: string, chainId: string, communityId: string) {
    const options = {
      author_chain: app.vm.activeAccount.chain.id,
      chain: chainId,
      community: communityId,
      address,
      reaction,
      jwt: app.login.jwt,
    };
    if (post instanceof OffchainThread) options['thread_id'] = (post as OffchainThread).id;
    else if (post instanceof OffchainComment) options['comment_id'] = (post as OffchainComment<any>).id;

    try {
      const response = await $.post(`${app.serverUrl()}/createReaction`, options);
      const { result } = response;
      this._store.add(modelFromServer(result));
    } catch (err) {
      console.log('Failed to create reaction');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to create reaction');
    }
  }

  public async refresh(post: any, chainId: string, communityId: string) {
    const options = {
      chain: chainId,
      community: communityId,
    };
    if (post instanceof OffchainThread) options['thread_id'] = (post as OffchainThread).identifier;
    else if (post instanceof OffchainComment) options['comment_id'] = (post as OffchainComment<any>).id;

    try {
      const response = await $.get(`${app.serverUrl()}/viewReactions`, options);
      if (response.status !== 'Success') {
        throw new Error(`got unsuccessful status: ${response.status}`);
      }
      const identifier = this._store.getPostIdentifier(response.result[0]);
      this._store.clearPost(identifier);
      for (const reaction of response.result) {
        // TODO: Reactions should always have a linked Address
        if (!reaction.Address) console.error('Reaction missing linked address');
        try {
          this._store.add(modelFromServer(reaction));
        } catch (e) {
          // console.error(e.message);
        }
      }
    } catch (err) {
      console.log('Failed to load reactions');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Error loading reactions');
    }
  }

  public async delete(reaction) {
    const _this = this;
    return new Promise((resolve, reject) => {
      $.post(`${app.serverUrl()}/deleteReaction`, {
        jwt: app.login.jwt,
        reaction_id: reaction.id,
      }).then((result) => {
        _this.store.remove(reaction);
        resolve(result);
      }).catch((e) => {
        console.error(e);
        notifyError('Could not delete reaction');
        reject(e);
      });
    });
  }

  public async refreshAll(chainId: string, communityId: string, reset = false) {
    try {
      const response = await $.get(`${app.serverUrl()}/bulkReactions`, {
        chain: chainId,
        community: communityId,
      });
      if (response.status !== 'Success') {
        throw new Error(`got unsuccessful status: ${response.status}`);
      }
      if (reset) {
        this._store.clear();
      }
      for (const reaction of response.result) {
        // TODO: Reactions should always have a linked Address
        if (!reaction.Address) {
          console.error('Reaction missing linked address');
        }
        // TODO: check `response` against store and update store iff `response` is newer
        const existing = this._store.getById(reaction.id);
        if (existing) {
          this._store.remove(existing);
        }
        try {
          this._store.add(modelFromServer(reaction));
        } catch (e) {
          // console.error(e.message);
        }
      }
    } catch (err) {
      console.log('failed to load bulk reactions');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Error loading reactions');
    }
  }

  public deinit() {
    this.store.clear();
  }
}

export default ReactionsController;
