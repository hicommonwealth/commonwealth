/* @jsx m */

import m from 'mithril';

import 'pages/login/login_text.scss';

import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';

type LoginTextAttrs = {
  bodyText: string;
  className?: string;
  headerText: string;
  isMobile: boolean;
};

export class LoginText implements m.ClassComponent<LoginTextAttrs> {
  view(vnode) {
    const { bodyText, className, headerText, isMobile = false } = vnode.attrs;

    return (
      <div
        class={getClasses<{ className?: string }>({ className }, 'LoginText')}
      >
        <div class="header-container">
          <CWText
            type={isMobile ? 'h2' : 'h4'}
            fontWeight="semiBold"
            isCentered={isMobile}
            className="header-text"
          >
            {headerText}
          </CWText>
        </div>
        <CWText
          type={isMobile ? 'h5' : 'b2'}
          isCentered={isMobile}
          className={getClasses<{ isMobile?: boolean }>(
            { isMobile },
            'body-text'
          )}
        >
          {bodyText}
        </CWText>
      </div>
    );
  }
}
