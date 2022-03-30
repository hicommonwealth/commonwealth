/* @jsx m */

import m from 'mithril';

import 'token_terms.scss';

import app from 'state';
import { isNonEmptyString } from '../helpers/typeGuards';
import { CWIcon } from './components/component_kit/cw_icons/cw_icon';

type TermsAttrs = {
  terms?: string;
  tosStatus?: string;
};

export class TokenTerms implements m.ClassComponent<TermsAttrs> {
  view(vnode) {
    const { terms, tosStatus } = vnode.attrs;

    if (isNonEmptyString(terms) && tosStatus !== 'off') {
      return (
        <div class="TokenTerms">
          <a href={terms}>
            <div class="terms-text">
              Please read the terms and conditions before interacting with this
              community.
            </div>
          </a>
          <CWIcon
            iconName="x"
            iconSize="small"
            onclick={() => {
              localStorage.setItem(`${app.activeChainId()}-tos`, 'off');
            }}
          />
        </div>
      );
    } else {
      return null;
    }
  }
}
