import IdStore from 'stores/IdStore';
import ReactionCount from 'models/ReactionCount';
import {AbridgedThread, AnyProposal, OffchainComment, OffchainReaction, OffchainThread, Proposal} from "models";


class ReactionCountsStore  extends IdStore<ReactionCount<any>>  {
    private _storePost: { [identifier: string]: ReactionCount<any> } = {};

    public add(reactionCount: ReactionCount<any>) {
        const identifier = this.getIdentifier(reactionCount);
        const reactionAlreadyInStore = (this._storePost[identifier] || null);
        if (!reactionAlreadyInStore) {
            super.add(reactionCount);
            if (!this._storePost[identifier]) {
                this._storePost[identifier] = null;
            }
            this._storePost[identifier] = reactionCount;
        }
        return this;
    }

    public remove(reactionCount: ReactionCount<any>) {
        super.remove(reactionCount);
        const identifier = this.getIdentifier(reactionCount);
        const proposal = this._storePost[identifier];
        if (!proposal) {
            throw new Error('Reaction count not in proposals store');
        }
        delete this._storePost[identifier];
        return this;
    }

    public clear() {
        super.clear();
        this._storePost = {};
    }

    public getReactionCountByPost(post: OffchainThread | AbridgedThread | AnyProposal | OffchainComment<any>): ReactionCount<any> {
        const identifier = this.getPostIdentifier(post);
        return this._storePost[identifier] || null;
    }

    public getIdentifier(reactionCount: ReactionCount<any>) {
        const { threadId, commentId, proposalId } = reactionCount;
        return threadId
            ? `discussion-${threadId}`
            : proposalId
                ? `${proposalId}`
                : `comment-${commentId}`;
    }

    public getPostIdentifier(rxnOrPost: OffchainReaction<any> | OffchainThread | AbridgedThread | AnyProposal | OffchainComment<any>) {
        if (rxnOrPost instanceof OffchainThread || rxnOrPost instanceof AbridgedThread) {
            return `discussion-${rxnOrPost.id}`;
        } else if (rxnOrPost instanceof Proposal) {
            return `${(rxnOrPost as AnyProposal).slug}_${(rxnOrPost as AnyProposal).identifier}`;
        } else if (rxnOrPost instanceof OffchainComment) {
            return `comment-${rxnOrPost.id}`;
        }
    }
}

export default ReactionCountsStore;
