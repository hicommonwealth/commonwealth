import moment from 'moment';
import React from 'react';
import { CWTag } from '../../components/component_kit/new_designs/CWTag';

export function isNewThread(threadCreatedAt: moment.Moment) {
  const diffInMs = moment().diff(threadCreatedAt);
  return moment.duration(diffInMs).asHours() < 48;
}

export const NewThreadTag = ({
  threadCreatedAt,
}: {
  threadCreatedAt: moment.Moment;
}) => {
  if (isNewThread(threadCreatedAt)) {
    return <CWTag label={'New'} type={'new'} iconName={'newStar'} />;
  }

  return null;
};
