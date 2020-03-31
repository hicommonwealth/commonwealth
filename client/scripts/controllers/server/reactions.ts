import { default as $ } from 'jquery';
import { default as _ } from 'lodash';
import { default as moment } from 'moment-twitter';

import app from 'state';
import { uniqueIdToProposal } from 'identifiers';

import { ReactionsStore } from 'models/stores';
import { OffchainReaction, IUniqueId } from 'models/models';
import { notifyError } from 'controllers/app/notifications';

const modelFromServer = (reaction, proposal?) => {
  return new OffchainReaction(
    reaction.chain,
    reaction.Address.address,
    decodeURIComponent(reaction.reaction),
    proposal ? proposal : uniqueIdToProposal(decodeURIComponent(reaction.object_id)),
    reaction.id,
    reaction.community,
  );
};

class ReactionsController {
  private _store: ReactionsStore = new ReactionsStore();
  public get store() { return this._store; }

  public getByProposal<T extends IUniqueId>(proposal: T) {
    return this._store.getByProposal(proposal);
  }

  public create<T extends IUniqueId>(address: string, proposal: T, reaction: string, chainId: string, communityId: string) {
    return $.post(`${app.serverUrl()}/createReaction`, {
      author_chain: app.vm.activeAccount.chain.id,
      chain: chainId,
      community: communityId,
      address: address,
      object_id: encodeURIComponent(proposal.uniqueIdentifier),
      reaction: encodeURIComponent(reaction),
      jwt: app.login.jwt,
    }).then((response) => {
        console.log('Created reaction');
      return this.refresh(proposal, chainId, communityId);
      }, (err) => {
        console.log('Failed to create reaction');
        throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error :
          'Failed to create reaction');
      });
  }

  public refresh<T extends IUniqueId>(proposal: T, chainId: string, communityId: string) {
    return $.get(`${app.serverUrl()}/viewReactions`, {
      chain: chainId,
      community: communityId,
      object_id: encodeURIComponent(proposal.uniqueIdentifier),
    }).then((response) => {
      if (response.status !== 'Success') {
        throw new Error('got unsuccessful status: ' + response.status);
      }
      this._store.clearProposal(proposal);
      for (const reaction of response.result) {
        // TODO: Reactions should always have a linked Address
        if (!reaction.Address) {
          console.error('Reaction missing linked address');
          continue;
        }
        try {
          this._store.add(modelFromServer(reaction, proposal));
        } catch (e) {
          //console.error(e.message);
        }
      }
    }, (err) => {
      console.log('Failed to load reactions');
      throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error :
        'Error loading reactions');
    });
  }

  public async delete(reaction) {
    const _this = this;
    return new Promise((resolve, reject) => {
      $.post(app.serverUrl() + '/deleteReaction', {
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

  public refreshAll(chainId: string, communityId: string, reset = false) {
    return $.get(`${app.serverUrl()}/bulkReactions`, {
      chain: chainId,
      community: communityId,
    })
      .then((response) => {
        if (response.status !== 'Success') {
          throw new Error('got unsuccessful status: ' + response.status);
        }
        if (reset) {
          this._store.clear();
        }
        for (const reaction of response.result) {
          // TODO: Reactions should always have a linked Address
          if (!reaction.Address) {
            console.error('Reaction missing linked address');
            continue;
          }
          // TODO: check `response` against store and update store iff `response` is newer
          const existing = this._store.getById(reaction.id);
          if (existing) {
            this._store.remove(existing);
          }
          try {
            this._store.add(modelFromServer(reaction));
          } catch (e) {
            //console.error(e.message);
          }
        }
      }, (err) => {
        console.log('failed to load bulk reactions');
        throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error :
          'Error loading reactions');
      });
  }

  public deinit() {
    this.store.clear();
  }
}

export default ReactionsController;
