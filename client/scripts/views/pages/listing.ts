import 'components/listing.scss';

import m from 'mithril';

const Listing: m.Component<{
  columnHeader?: any;
  content: any[];
}> = {
  view: (vnode) => {
    const { columnHeader, content } = vnode.attrs;
    return m('.Listing', [
      columnHeader && m('.ListingHeader', columnHeader),
      content,
    ]);
  },
};

export default Listing;
