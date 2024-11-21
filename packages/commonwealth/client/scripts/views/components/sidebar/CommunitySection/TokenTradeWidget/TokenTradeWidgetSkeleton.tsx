import React from 'react';
import { Skeleton } from '../../../Skeleton';
import './TokenTradeWidget';

export const TokenTradeWidgetSkeleton = () => {
  return (
    <section className="TokenTradeWidget">
      <Skeleton width="100%" height="30px" containerClassName="pad-8" />
      <Skeleton width="100px" containerClassName="pad-8" />
      <Skeleton width="100%" height="50px" containerClassName="pad-8" />
      <div className="action-btns">
        <Skeleton width="100%" height="30px" />
        <Skeleton width="100%" height="30px" />
      </div>
    </section>
  );
};
