import React from 'react';
import { default as RLSkeleton, SkeletonProps } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './Skeleton.scss';

export const Skeleton = (props: SkeletonProps) => {
  // eslint-disable-next-line react/jsx-curly-brace-presence
  return <RLSkeleton width={'100%'} {...props} />;
};
