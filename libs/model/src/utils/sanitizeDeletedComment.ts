import { CommentAttributes } from '../models/comment';

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
      ghost_address: false,
      is_banned: false,
    },
    address_id: 0,
    canvas_msg_id: null,
    canvas_signed_data: null,
    text: '[deleted]',
  };
}
