import { expect } from 'chai';
import { getCommentDepth } from 'server/util/getCommentDepth';
import Sinon from 'sinon';
import { CommentInstance } from '../../../server/models/comment';

const COMMENTS = {
  // this initial comment is provided externally,
  // so it will NOT invoke Comment.findOne in this test
  '4': {
    id: '4',
    parent_id: '3',
  },
  // ---
  '3': {
    id: '3',
    parent_id: '2',
  },
  '2': {
    id: '2',
    parent_id: '1',
  },
  '1': {
    id: '1',
    parent_id: null,
  },
};

describe('getCommentDepth', () => {
  it('should correctly calculate comment depth (recursion terminated naturally)', async () => {
    const sandbox = Sinon.createSandbox();
    const db = {
      Comment: {
        findOne: sandbox.fake(async ({ where: { id } }) => COMMENTS[id]),
      },
    };
    const comment = COMMENTS['4'] as unknown as CommentInstance;
    const maxIterations = 5;
    const [exceeded, depth] = await getCommentDepth(
      db as any,
      comment,
      maxIterations,
    );
    expect(exceeded).to.be.false;
    expect(depth).to.equal(3);
    expect(db.Comment.findOne.callCount).to.equal(3);
  });

  it('should correctly calculate comment depth (recursion depth exceeded)', async () => {
    const sandbox = Sinon.createSandbox();
    const db = {
      Comment: {
        findOne: sandbox.fake(async ({ where: { id } }) => COMMENTS[id]),
      },
    };
    const comment = COMMENTS['4'] as unknown as CommentInstance;
    const maxIterations = 2;
    const [exceeded, depth] = await getCommentDepth(
      db as any,
      comment,
      maxIterations,
    );
    expect(exceeded).to.be.true;
    expect(depth).to.equal(2);
    expect(db.Comment.findOne.callCount).to.equal(2);
  });
});
