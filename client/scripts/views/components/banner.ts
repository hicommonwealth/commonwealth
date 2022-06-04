/* @jsx m */

import m from 'mithril';

import 'token_terms.scss';

import app from 'state';
import { isNonEmptyString } from '../../helpers/typeGuards';
import { CWText } from './component_kit/cw_text';


type BannerAttrs = {
  bannerText?: string;
};

export class Banner implements m.ClassComponent<BannerAttrs> {
  view(vnode) {
    const { bannerText } = vnode.attrs;
    console.log("Rendering Banner")
    if (isNonEmptyString(bannerText)) {
      return ( null
        // <div class="Banner">
        //  {bannerText}
        // </div>
      );
    } else {
      return null;
    }
  }
}
