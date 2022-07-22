/* eslint-disable dot-notation */
/* eslint-disable no-restricted-syntax */
import $ from 'jquery';
import _ from 'lodash';

import app from 'state';

import { ReactionStore } from 'stores';
import {
  Reaction,
  AnyProposal,
  Comment,
  Thread,
  Proposal,
  AbridgedThread,
} from 'models';
import { notifyError } from 'controllers/app/notifications';

export const modelFromServer = (reaction) => {
  return new Reaction(
    reaction.id,
    reaction.Address.address,
    reaction.chain,
    reaction.reaction,
    reaction.thread_id,
    reaction.proposal_id,
    reaction.comment_id,
    reaction.Address.chain
  );
};

class ReactionsController {
  private _store: ReactionStore = new ReactionStore();
  public get store() {
    return this._store;
  }

  public getByPost(
    post: Thread | AbridgedThread | AnyProposal | Comment<any>
  ) {
    return this._store.getByPost(post);
  }

  public async create(
    address: string,
    post: any,
    reaction: string,
    chainId: string
  ) {
    const options = {
      author_chain: app.user.activeAccount.chain.id,
      chain: chainId,
      address,
      reaction,
      jwt: app.user.jwt,
    };
    if (post instanceof Thread) {
      options['thread_id'] = (post as Thread).id;
    } else if (post instanceof Proposal) {
      options['proposal_id'] = `${(post as AnyProposal).slug}_${
        (post as AnyProposal).identifier
      }`;
    } else if (post instanceof Comment) {
      options['comment_id'] = (post as Comment<any>).id;
    }
    try {
      // TODO: Change to POST /reaction
      const response = await $.post(
        `${app.serverUrl()}/createReaction`,
        options
      );
      const { result } = response;
      this._store.add(modelFromServer(result));
    } catch (err) {
      notifyError('Failed to save reaction');
    }
  }

  public async refresh(post: any, chainId: string) {
    const options = { chain: chainId };
    // TODO: ensure identifier vs id use is correct; see also create method
    if (post instanceof Thread)
      options['thread_id'] = (post as Thread).id;
    else if (post instanceof Proposal) {
      options['proposal_id'] = `${(post as AnyProposal).slug}_${
        (post as AnyProposal).identifier
      }`;
    } else if (post instanceof Comment)
      options['comment_id'] = (post as Comment<any>).id;

    try {
      // TODO: Remove any verbs from these route names '/reactions'
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
      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? err.responseJSON.error
          : 'Error loading reactions'
      );
    }
  }

  public async delete(reaction) {
    const _this = this;
    return new Promise((resolve, reject) => {
      // TODO: Change to DELETE /reaction
      $.post(`${app.serverUrl()}/deleteReaction`, {
        jwt: app.user.jwt,
        reaction_id: reaction.id,
      })
        .then((result) => {
          _this.store.remove(reaction);
          resolve(result);
        })
        .catch((e) => {
          console.error(e);
          notifyError('Failed to save reaction');
          reject(e);
        });
    });
  }

  public initialize(initialReactions, reset = true) {
    if (reset) {
      this._store.clear();
    }
    for (const reaction of initialReactions) {
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
  }

  public deinit() {
    this.store.clear();
  }
}

export default ReactionsController;
