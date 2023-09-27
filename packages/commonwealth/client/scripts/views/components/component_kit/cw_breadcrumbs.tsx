import React from 'react';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';
import clsx from 'clsx';

import 'components/component_kit/cw_breadcrumbs.scss';
import { CWText } from './cw_text';

import { ComponentType } from './types';

export type BreadcrumbsType = {
  label: string;
  path?: string;
  navigate?: (url: string) => void;
  isParent?: boolean;
};

type BreadcrumbsProps = {
  breadcrumbs: Array<BreadcrumbsType>;
  tooltipStr?: string;
};

export const CWBreadcrumbs = (props: BreadcrumbsProps) => {
  const { breadcrumbs, tooltipStr } = props;

  return (
    <div className={ComponentType.Breadcrumbs}>
      {breadcrumbs.map(({ label, path, navigate, isParent }, index) => {
        const isCurrent = index === breadcrumbs.length - 1;

        return (
          <React.Fragment key={index}>
            {isParent && breadcrumbs.length !== 1 ? (
              <CWTooltip
                content={tooltipStr}
                placement="bottom"
                renderTrigger={(handleInteraction) => (
                  <CWText
                    onMouseEnter={handleInteraction}
                    onMouseLeave={handleInteraction}
                    type="caption"
                    fontWeight="medium"
                    className={clsx({
                      'disable-active-cursor': index === 0,
                      'current-text': isCurrent,
                      'parent-text': !isCurrent,
                    })}
                    onClick={isCurrent ? undefined : () => navigate(path)}
                  >
                    {label}
                  </CWText>
                )}
              />
            ) : (
              <CWText
                type="caption"
                fontWeight="medium"
                className={isCurrent ? 'current-text' : 'parent-text'}
                onClick={isCurrent ? undefined : () => navigate(path)}
              >
                {label}
              </CWText>
            )}
            {!isCurrent && (
              <CWText
                type="caption"
                fontWeight="medium"
                className="separator-text"
              >
                /
              </CWText>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
