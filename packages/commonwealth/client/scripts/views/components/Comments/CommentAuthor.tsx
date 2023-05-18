import Comment from 'models/Comment';
import app from 'state';
import Account from 'models/Account';
import { User } from 'views/components/user/user';
import React from 'react';

type CommentAuthorProps = {
  comment: Comment<any>;
};

const CommentAuthor = ({ comment }: CommentAuthorProps) => {
  const author: Account = app.chain.accounts.get(comment.author);

  return comment.deleted ? (
    <span>[deleted]</span>
  ) : (
    <User avatarSize={24} user={author} popover linkify />
  );
};

export default CommentAuthor;
