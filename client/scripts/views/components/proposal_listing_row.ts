import 'components/listing_row.scss';

import m, { Vnode } from 'mithril';

interface IContentLeft {
  header: Vnode | Vnode[];
  subheader: Vnode | Vnode[];
}

const ProposalListingRow: m.Component<{
  contentLeft: IContentLeft;
  class?: string;
  key?: number;
  onclick?: Function;
}> = {
  view: (vnode) => {
    const { key, onclick, contentLeft } = vnode.attrs;
    const attrs = {};
    if (onclick) attrs['onclick'] = onclick;
    if (key) attrs['key'] = key;
    if (vnode.attrs.class) attrs['class'] = vnode.attrs.class;

    return m('.ListingRow', attrs, [
      m('.row-left', [
        m('.title-container', [
          m('.row-header', contentLeft.header),
          m('.row-subheader', contentLeft.subheader),
        ]),
      ])
    ]);
  }
};

export default ProposalListingRow;
