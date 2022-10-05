/* @jsx m */

import m from 'mithril';

import 'index.scss'; // have to inject here instead of app.ts or else fonts don't load
import 'layout.scss';

import {
  initChain,
  initNewTokenChain,
  deinitChainOrCommunity,
  selectChain,
} from 'app';
import app from 'state';
import { AppToasts } from 'views/toast';
import { PageNotFound } from 'views/pages/404';
import { AppModals } from './app_modals';
import { UserSurveyPopup } from './components/user_survey_popup';
import { CWSpinner } from './components/component_kit/cw_spinner';
import { CWEmptyState } from './components/component_kit/cw_empty_state';
import { CWText } from './components/component_kit/cw_text';

class LoadingLayout implements m.ClassComponent {
  view() {
    return (
      <div class="Layout">
        <div class="spinner-container">
          <CWSpinner size="xl" />
        </div>
        <AppModals />
        <AppToasts />
      </div>
    );
  }
}

type LayoutAttrs = {
  deferChain?: boolean;
  hideSidebar?: boolean;
  scope: string;
};

export class Layout implements m.ClassComponent<LayoutAttrs> {
  private loadingScope: string;
  private deferred: boolean;
  private surveyDelayTriggered = false;
  private surveyReadyForDisplay = false;

  view(vnode) {
    const { scope, deferChain } = vnode.attrs;
    const scopeIsEthereumAddress =
      scope && scope.startsWith('0x') && scope.length === 42;
    const scopeMatchesChain = app.config.chains.getById(scope);

    // Put the survey on a timer so it doesn't immediately appear
    if (!this.surveyDelayTriggered && !this.surveyReadyForDisplay) {
      this.surveyDelayTriggered = true;
      setTimeout(() => {
        this.surveyReadyForDisplay = true;
      }, 4000);
    }

    if (app.loadingError) {
      return (
        <div class="Layout">
          <CWEmptyState
            iconName="cautionTriangle"
            content={
              <div class="loading-error">
                <CWText>Application error: {app.loadingError}</CWText>
                <CWText>Please try again later</CWText>
              </div>
            }
          />
          <AppModals />
          <AppToasts />
        </div>
      );
    } else if (!app.loginStatusLoaded()) {
      // Wait for /api/status to return with the user's login status
      return <LoadingLayout />;
    } else if (scope && scopeIsEthereumAddress && scope !== this.loadingScope) {
      this.loadingScope = scope;
      initNewTokenChain(scope);
      return <LoadingLayout />;
      // } else if (scope && !scopeMatchesChain && !scopeIsEthereumAddress) {
    } else if (true) {
      // If /api/status has returned, then app.config.nodes and app.config.communities
      // should both be loaded. If we match neither of them, then we can safely 404
      return (
        <div class="Layout">
          <PageNotFound />
          <AppModals />
          <AppToasts />
        </div>
      );
    } else if (
      scope &&
      scope !== app.activeChainId() &&
      scope !== this.loadingScope
    ) {
      // If we are supposed to load a new chain or community, we do so now
      // This happens only once, and then loadingScope should be set
      this.loadingScope = scope;
      if (scopeMatchesChain) {
        this.deferred = deferChain;
        selectChain(scopeMatchesChain, deferChain).then((response) => {
          if (!deferChain && response) {
            initChain();
          }
        });
        return <LoadingLayout />;
      }
    } else if (scope && this.deferred && !deferChain) {
      this.deferred = false;
      initChain();
      return <LoadingLayout />;
    } else if (!scope && app.chain && app.chain.network) {
      // Handle the case where we unload the network or community, if we're
      // going to a page that doesn't have one
      // Include this in if for isCustomDomain, scope gets unset on redirect
      // We don't need this to happen
      if (!app.isCustomDomain()) {
        deinitChainOrCommunity().then(() => {
          this.loadingScope = null;
          m.redraw();
        });
      }
      return <LoadingLayout />;
    }
    return (
      <div class="Layout">
        {vnode.children}
        <AppModals />
        <AppToasts />
        <UserSurveyPopup surveyReadyForDisplay={this.surveyReadyForDisplay} />
      </div>
    );
  }
}
