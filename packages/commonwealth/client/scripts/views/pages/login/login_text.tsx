/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

import 'pages/login/login_text.scss';

import { CWText } from '../../components/component_kit/cw_text';
import {
  getClasses,
  isWindowExtraSmall,
} from '../../components/component_kit/helpers';

type LoginTextAttrs = {
  bodyText: string;
  className?: string;
  headerText: string;
  isMobile?: boolean;
};

export class LoginText extends ClassComponent<LoginTextAttrs> {
  view(vnode: m.Vnode<LoginTextAttrs>) {
    const { bodyText, className, headerText, isMobile = false } = vnode.attrs;

    return (
      <div
        class={getClasses<{ className?: string }>({ className }, 'LoginText')}
      >
        <div class="header-container">
          <CWText
            type={
              isWindowExtraSmall(window.innerWidth)
                ? 'h3'
                : isMobile
                ? 'h2'
                : 'h4'
            }
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
