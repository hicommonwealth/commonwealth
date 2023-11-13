import clsx from 'clsx';
import React from 'react';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';

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

export const CWBreadcrumbs = ({
  breadcrumbs,
  tooltipStr,
}: BreadcrumbsProps) => {
  return (
    <div className={ComponentType.Breadcrumbs}>
      {breadcrumbs.map(({ label, path, navigate, isParent }, index) => {
        const isCurrent = index === breadcrumbs.length - 1;

        const truncate = (str: string) => {
          // Get the available width of the container or the window
          const availableWidth = window.innerWidth;

          // Define the maximum allowed width
          const maxWidth = 0.4 * availableWidth;

          if (str.length > 50 || availableWidth < maxWidth) {
            const ellipsisWidth = '...'.length * 4;
            const truncatedLength = Math.floor((maxWidth - ellipsisWidth) / 8);
            return str.substring(0, truncatedLength) + '...';
          }

          return str;
        };

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
                  >
                    {truncate(label)}
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
                {truncate(label)}
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
