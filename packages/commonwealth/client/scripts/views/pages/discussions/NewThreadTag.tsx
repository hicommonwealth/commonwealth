import moment from 'moment';
import React from 'react';
import Thread from '../../../models/Thread';
import { CWTag } from '../../components/component_kit/cw_tag';

export function isNewThread(thread: Thread){
  const diffInMs = moment().diff(thread.createdAt);
  return moment.duration(diffInMs).asHours() < 48;
}

export const NewThreadTag = ({ thread }: {thread: Thread}) => {
  if (isNewThread(thread)) {
    return <CWTag label={'NEW'} type={'new'} iconName={'newStar'} iconSize={'large'}/>
  }

  return null;
}