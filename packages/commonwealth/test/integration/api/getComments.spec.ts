import 'chai/register-should';
import models from 'server/database';
import chai from 'chai';
import 'chai/register-should';
import { CommentInstance, CommentModelStatic } from 'server/models/comment';
import { ThreadInstance } from 'server/models/thread';
import { IPagination } from 'server/util/queries';

const { expect } = chai;

type GetCommentsReq = {
  community_id: string;
  thread_id?: number;
  profile_id?: string;
  address_ids?: string[];
  count_only?: boolean;
} & IPagination;

describe('getComments Tests', () => {
  let testThread: ThreadInstance;
  let testComment: CommentInstance;

  before('add test entities', async () => {
    let [testThread, created] = await models.Thread.findOrCreate({
      where: {
        id: -1,
        address_id: 1,
        title: '',
        body: '',
        chain: 'ethereum',
        topic_id: -1,
        kind: 'discussion',
      }
    });

    let [testComment, created2] = await models.Comment.findOrCreate({
      where: {
        id: -1,
        chain: 'ethereum',
        address_id: 1,
        text: '',
        root_id: 'discussion_-1',
        plaintext: '',
      },
    });

    console.log(testComment);

  });

  it('should correctly return', async () => {
    const r: GetCommentsReq = {community_id: testComment.chain};

    console.log('here')
  });

});