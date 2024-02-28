import React from 'react';
import { FullUser } from './fullUser';
import { User } from './user';
import { UserInteropAttrsWithSkeletonProp } from './user.types';

// TODO: This interop layer should be removed when User.tsx is removed
export const UserInterop = (props: UserInteropAttrsWithSkeletonProp) => {
  // eslint-disable-next-line react/destructuring-assignment
  if (props.profile) {
    return <FullUser {...props} />;
  }

  return <User {...props} />;
};
