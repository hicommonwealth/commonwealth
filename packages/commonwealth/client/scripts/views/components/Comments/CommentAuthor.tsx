import Comment from 'models/Comment';
import app from 'state';
import { ChainType } from 'common-common/src/types';
import { AnonymousUser } from 'views/components/user/anonymous_user';
import Account from 'models/Account';
import { User } from 'views/components/user/user';
import React from 'react';

type CommentAuthorProps = {
  comment: Comment<any>;
};

const CommentAuthor = ({ comment }: CommentAuthorProps) => {
  // Check for accounts on forums that originally signed up on a different base chain,
  // Render them as anonymous as the forum is unable to support them.
  if (app.chain.meta.type === ChainType.Offchain) {
    if (
      comment.authorChain !== app.chain.id &&
      comment.authorChain !== app.chain.base
    ) {
      return <AnonymousUser distinguishingKey={comment.author} />;
    }
  }

  const author: Account = app.chain.accounts.get(comment.author);

  return comment.deleted ? (
    <span>[deleted]</span>
  ) : (
    <User avatarSize={24} user={author} popover linkify />
  );
};

export default CommentAuthor;
