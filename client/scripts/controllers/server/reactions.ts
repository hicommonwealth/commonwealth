/* eslint-disable no-restricted-syntax */
import { default as $ } from 'jquery';
import { default as _ } from 'lodash';
import { default as moment } from 'moment-twitter';

import app from 'state';
import { uniqueIdToProposal } from 'identifiers';

import { ReactionsStore } from 'stores';
import { OffchainReaction, IUniqueId, AnyProposal, OffchainComment, OffchainThread } from 'models';
import { notifyError } from 'controllers/app/notifications';

const modelFromServer = (reaction, proposal?) => {
  return new OffchainReaction(
    reaction.chain,
    reaction.Address.address,
    decodeURIComponent(reaction.reaction),
    uniqueIdToProposal(decodeURIComponent(reaction.thread_id)),
    uniqueIdToProposal(decodeURIComponent(reaction.comment_id)),
    reaction.id,
    reaction.community,
  );
};

class ReactionsController {
  private _store: ReactionsStore = new ReactionsStore();
  public get store() { return this._store; }

  public getByPost(post: AnyProposal | OffchainThread | OffchainComment<any>) {
    return this._store.getByPost(post);
  }

  public create<T extends IUniqueId>(address: string, post: any, reaction: string, chainId: string, communityId: string) {
    return $.post(`${app.serverUrl()}/createReaction`, {
      author_chain: app.vm.activeAccount.chain.id,
      chain: chainId,
      community: communityId,
      address,
      thread_id: encodeURIComponent((post as OffchainThread).identifier),
      comment_id: encodeURIComponent((post as OffchainComment<any>).id),
      reaction: encodeURIComponent(reaction),
      jwt: app.login.jwt,
    }).then((response) => {
      console.log('Created reaction');
      return this.refresh(post, chainId, communityId);
    }, (err) => {
      console.log('Failed to create reaction');
      throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
        : 'Failed to create reaction');
    });
  }

  public refresh<T extends IUniqueId>(post: any, chainId: string, communityId: string) {
    return $.get(`${app.serverUrl()}/viewReactions`, {
      chain: chainId,
      community: communityId,
      thread_id: encodeURIComponent((post as OffchainThread).identifier),
      comment_id: encodeURIComponent((post as OffchainComment<any>).id),
    }).then((response) => {
      if (response.status !== 'Success') {
        throw new Error(`got unsuccessful status: ${response.status}`);
      }
      this._store.clearProposal(post);
      for (const reaction of response.result) {
        // TODO: Reactions should always have a linked Address
        if (!reaction.Address) console.error('Reaction missing linked address');
        try {
          this._store.add(modelFromServer(reaction, post));
        } catch (e) {
          // console.error(e.message);
        }
      }
    }, (err) => {
      console.log('Failed to load reactions');
      throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
        : 'Error loading reactions');
    });
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
      })
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
