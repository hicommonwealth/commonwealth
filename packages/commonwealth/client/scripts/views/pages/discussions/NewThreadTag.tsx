import moment from 'moment';
import React from 'react';
import { CWTag } from '../../components/component_kit/cw_tag';

export function isNewThread(threadCreatedAt: moment.Moment){
  const diffInMs = moment().diff(threadCreatedAt);
  return moment.duration(diffInMs).asHours() < 48;
}

export const NewThreadTag = ({ threadCreatedAt, archivedAt }: {threadCreatedAt: moment.Moment, archivedAt: moment.Moment | null}) => {
  if (isNewThread(threadCreatedAt) && archivedAt === null) {
    return <CWTag label={'New'} type={'new'} iconName={'newStar'}/>
  }

  return null;
}