/* @jsx m */

import m from 'mithril';

import { Spinner } from 'construct-ui';
import { pluralize } from 'helpers';

interface ListingScrollAttrs {
  listingDepleted: boolean;
  subpage: string;
  totalThreadCount: number;
}
export class ListingScroll implements m.ClassComponent<ListingScrollAttrs> {
  getListingDepletedCopy(totalThreadCount, subpage) {
    return `Showing ${totalThreadCount} of ${pluralize(
      totalThreadCount,
      'thread'
    )}${subpage ? ` under the subpage '${subpage}'` : ''}`;
  }

  view(vnode) {
    const { listingDepleted, subpage, totalThreadCount } = vnode.attrs;
    if (!totalThreadCount) return;
    return (
      <div class="ListingScroll">
        {listingDepleted && (
          <div class="infinite-scroll-reached-end">
            {this.getListingDepletedCopy(totalThreadCount, subpage)}
          </div>
        )}
        {!listingDepleted && (
          <div class="infinite-scroll-spinner-wrap">
            <Spinner active={true} size="lg" />
          </div>
        )}
      </div>
    );
  }
}
