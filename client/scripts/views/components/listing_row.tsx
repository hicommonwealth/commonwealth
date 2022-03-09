/* @jsx m */

import m, { Vnode } from 'mithril';

import 'components/listing_row.scss';

import { isNotUndefined } from 'helpers/typeGuards';
import { CWIcon } from './component_kit/cw_icons/cw_icon';

type ListingRowAttrs = {
  contentRight: Vnode[];
  header: Vnode | Vnode[];
  key?: number;
  onclick?: () => void;
  pinned?: boolean;
  reaction?: Vnode | Vnode[];
  subheader: Vnode | Vnode[];
};

export class ListingRow implements m.ClassComponent<ListingRowAttrs> {
  view(vnode) {
    const { contentRight, header, key, onclick, pinned, reaction, subheader } =
      vnode.attrs;

    const getContentLeft = () => {
      if (pinned) {
        return (
          <div class="pinned">
            <CWIcon iconName="pin" iconSize="small" />
          </div>
        );
      } else if (!pinned && isNotUndefined(reaction)) {
        return <div class="reaction">{reaction}</div>;
      } else {
        return null;
      }
    };

    return (
      <div class="ListingRow" onclick={onclick} key={key}>
        {getContentLeft()}
        <div class="title-container">
          <div class="row-header">{header}</div>
          <div class="row-subheader">{subheader}</div>
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
