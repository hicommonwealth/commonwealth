/* eslint-disable dot-notation */
/* eslint-disable no-restricted-syntax */
import $ from 'jquery';
import _ from 'lodash';

import app from 'state';

import { ReactionCountsStore } from 'stores';
import ReactionCount from 'models/ReactionCount';
import {AbridgedThread, AnyProposal, OffchainComment, OffchainThread} from "models";

export const modelFromServer = (reactionCount) => {
    return new ReactionCount(
        reactionCount.thread_id,
        reactionCount.comment_id,
        reactionCount.proposal_id,
        reactionCount.has_reacted,
        parseInt(reactionCount.like),
    );
};

class ReactionCountController {
    private _store: ReactionCountsStore = new ReactionCountsStore();
    public get store() {
        return this._store;
    }

    public getByPost(post: OffchainThread | AbridgedThread | AnyProposal | OffchainComment<any>) {
        return this._store.getReactionCountByPost(post);
    }

    public deinit() {
        this.store.clear();
    }
}

export default ReactionCountController
