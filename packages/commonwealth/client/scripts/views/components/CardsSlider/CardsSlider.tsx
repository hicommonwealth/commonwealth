import clsx from 'clsx';
import React, { ReactNode } from 'react';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import './CardsSlider.scss';

type CardsSliderProps = {
  headerText: string;
  subHeaderText?: string;
  containerClassName?: string;
  className?: string;
  canDismiss?: boolean;
  onDismiss?: () => void;
  dismissBtnLabel?: string;
  children?: ReactNode;
};

export const CardsSlider = ({
  headerText,
  subHeaderText,
  containerClassName = '',
  className = '',
  canDismiss = true,
  onDismiss = () => {},
  dismissBtnLabel = 'Dismiss',
  children,
}: CardsSliderProps) => {
  return (
    <CWPageLayout className={clsx('CardsSliderPageLayout', containerClassName)}>
      <section className={clsx('CardsSlider', className)}>
        <div className="header">
          <div className="left-section">
            <CWText type="h4" fontWeight="semiBold">
              {headerText}
            </CWText>
            {subHeaderText && <CWText type="b1">{subHeaderText}</CWText>}
          </div>

          {canDismiss && (
            <CWButton
              containerClassName="dismissBtn"
              buttonType="tertiary"
              buttonWidth="narrow"
              buttonHeight="sm"
              onClick={onDismiss}
              label={dismissBtnLabel}
            />
          )}
        </div>
        <div className="cards">{children}</div>
      </section>
    </CWPageLayout>
  );
};
