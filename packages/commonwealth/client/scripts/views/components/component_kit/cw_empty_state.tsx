/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_empty_state.scss';

import { CWIcon } from './cw_icons/cw_icon';
import { IconName } from './cw_icons/cw_icon_lookup';
import { CWText } from './cw_text';

type EmptyStateAttrs = {
  content: string | ResultNode;
  iconName?: IconName;
};

export class CWEmptyState extends ClassComponent<EmptyStateAttrs> {
  view(vnode: ResultNode<EmptyStateAttrs>) {
    const { content, iconName } = vnode.attrs;

    return (
      <div className="EmptyState">
        <div className="inner-content">
          <CWIcon iconName={iconName} iconSize="xl" />
          {typeof content === 'string' ? <CWText>{content}</CWText> : content}
        </div>
      </div>
    );
  }
}
