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
    const { bodyText, className, headerText, isMobile } = vnode.attrs;

    return (
      <div
        class={getClasses<{ className?: string }>({ className }, 'LoginText')}
      >
        <CWText
          type={isMobile ? 'h2' : 'h4'}
          fontWeight="semiBold"
          className="header-text"
        >
          {headerText}
        </CWText>
        <CWText
          type={isMobile ? 'h5' : 'b2'}
          isCentered={isMobile}
          className="body-text"
        >
          {bodyText}
        </CWText>
      </div>
    );
  }
}
