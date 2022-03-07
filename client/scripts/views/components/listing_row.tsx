/* @jsx m */

import m, { Vnode } from 'mithril';
import { Grid, Col } from 'construct-ui';

import 'components/listing_row.scss';

import { CWIcon } from './component_kit/cw_icons/cw_icon';

type IContentLeft = {
  header: Vnode | Vnode[];
  pinned?: boolean;
  reaction?: Vnode | Vnode[];
  subheader: Vnode | Vnode[];
};

type ListingRowAttrs = {
  class?: string;
  contentLeft: IContentLeft;
  contentRight: Vnode[];
  key?: number;
  onclick?: () => void;
  rightColSpacing: number[];
};

export class ListingRow implements m.ClassComponent<ListingRowAttrs> {
  view(vnode) {
    const { key, onclick, contentLeft, contentRight, rightColSpacing } =
      vnode.attrs;

    const attrs = {};

    if (onclick) attrs['onclick'] = onclick;

    if (key) attrs['key'] = key;

    if (vnode.attrs.class) attrs['class'] = vnode.attrs.class;

    const initialOffset = 12 - rightColSpacing.reduce((t, n) => t + n);

    return m('.ListingRow', attrs, [
      m('.row-left', [
        contentLeft.pinned
          ? m('.pinned', m(CWIcon, { iconName: 'pin', iconSize: 'small ' }))
          : contentLeft.reaction
          ? m('.reaction', contentLeft.reaction)
          : '',
        m('.title-container', [
          m('.row-header', contentLeft.header),
          m('.row-subheader', contentLeft.subheader),
        ]),
      ]),
      m('.row-right', [
        m(
          Grid,
          contentRight.map((ele, idx) => {
            return m(
              Col,
              {
                span: rightColSpacing[idx],
                offset: initialOffset > 0 && idx === 0 ? initialOffset : 0,
              },
              ele
            );
          })
        ),
      ]),
    ]);
  }
}
