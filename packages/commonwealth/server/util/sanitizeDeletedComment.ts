import { CommentAttributes } from '@hicommonwealth/model';

export function sanitizeDeletedComment(
  comment: CommentAttributes,
): CommentAttributes {
  if (!comment.deleted_at) {
    return comment;
  }
  return {
    ...comment,
    Address: {
      id: 0,
      address: '0xdeleted000000000001111122222333334444455',
      community_id: '',
      verification_token: '',
      role: 'member',
      is_user_default: false,
    },
    address_id: 0,
    // @ts-expect-error <StrictNullChecks>
    canvas_hash: null,
    // @ts-expect-error <StrictNullChecks>
    canvas_signed_data: null,
    plaintext: '[deleted]',
    text: '[deleted]',
    version_history: [],
  };
}
