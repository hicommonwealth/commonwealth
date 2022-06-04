/* @jsx m */

import m from 'mithril';

import 'banner.scss';

import app from 'state';
import { isNonEmptyString } from '../../helpers/typeGuards';

type BannerAttrs = {
  bannerText?: string;
};

export class Banner implements m.ClassComponent<BannerAttrs> {
  view(vnode) {
    const { bannerText } = vnode.attrs;
    console.log("Rendering Banner:", bannerText);
    if (isNonEmptyString(bannerText)) {
      return (
        <div class="Banner">
          <div class="banner-text">
            {bannerText}
          </div>
        </div>
      );
    } else {
      return null;
    }
  }
}
