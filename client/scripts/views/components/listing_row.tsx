/* @jsx m */

import m, { Vnode } from 'mithril';

import 'components/listing_row.scss';

import { isNotUndefined } from 'helpers/typeGuards';
import { CWIcon } from './component_kit/cw_icons/cw_icon';

type IContentLeft = {
  header: Vnode | Vnode[];
  pinned?: boolean;
  reaction?: Vnode | Vnode[];
  subheader: Vnode | Vnode[];
};

type ListingRowAttrs = {
  contentLeft: IContentLeft;
  contentRight: Vnode[];
  key?: number;
  onclick?: () => void;
};

export class ListingRow implements m.ClassComponent<ListingRowAttrs> {
  view(vnode) {
    const { contentLeft, contentRight, key, onclick } = vnode.attrs;

    const getContentLeft = () => {
      if (contentLeft.pinned) {
        return (
          <div class="pinned">
            <CWIcon iconName="pin" iconSize="small" />
          </div>
        );
      } else if (!contentLeft.pinned && isNotUndefined(contentLeft.reaction)) {
        return <div class="reaction">{contentLeft.reaction}</div>;
      } else {
        return null;
      }
    };

    return (
      <div class="ListingRow" onclick={onclick} key={key}>
        {getContentLeft()}
        <div class="title-container">
          <div class="row-header">{contentLeft.header}</div>
          <div class="row-subheader">{contentLeft.subheader}</div>
        </div>
        <div class="content-right-container">
          {contentRight.map((el) => (
            <div>{el}</div>
          ))}
        </div>
      </div>
    );
  }
}
