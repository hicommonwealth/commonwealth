/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/empty_topic_placeholder.scss';

import app from 'state';
import { isNotUndefined } from 'helpers/typeGuards';
import { CWIcon } from './component_kit/cw_icons/cw_icon';
import { CreateContentPopover } from '../menus/create_content_menu';

type EmptyListingPlaceholderAttrs = {
  communityName?: string;
  stageName?: string;
  topicName?: string;
};

export class EmptyListingPlaceholder extends ClassComponent<EmptyListingPlaceholderAttrs> {
  view(vnode: m.Vnode<EmptyListingPlaceholderAttrs>) {
    const { stageName, topicName, communityName } = vnode.attrs;

    if (isNotUndefined(stageName)) {
      return (
        <div class="EmptyStagePlaceholder">
          There are no threads matching your filter.
        </div>
      );
    }

    return (
      <div class="EmptyListingPlaceholder">
        <div class="icon-circle">
          <CWIcon iconName="hash" iconSize="large" />
        </div>
        <h1>
          Welcome to the{' '}
          {isNotUndefined(topicName) ? (
            <>
              <strong>{topicName}</strong> topic!
            </>
          ) : (
            <>
              <strong>{communityName}</strong> community!
            </>
          )}
        </h1>
        <p>There are no threads here yet.</p>
        {!app.isLoggedIn() && <p>Log in to create a new thread.</p>}
        <CreateContentPopover />
      </div>
    );
  }
}
