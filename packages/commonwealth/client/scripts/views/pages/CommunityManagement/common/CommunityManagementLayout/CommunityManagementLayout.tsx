import useUserActiveAccount from 'hooks/useUserActiveAccount';
import React, { ReactNode } from 'react';
import app from 'state';
import Permissions from 'utils/Permissions';
import FeatureHint from 'views/components/FeatureHint';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from '../../../404';
import './CommunityManagementLayout.scss';

type CommunityManagementLayout = {
  title: string;
  description: string | React.ReactNode;
  children: ReactNode;
  featureHint: {
    title: string;
    description: string;
  };
  className?: boolean;
};

const CommunityManagementLayout = ({
  title,
  description,
  children,
  featureHint,
  className,
}: CommunityManagementLayout) => {
  useUserActiveAccount();

  if (
    !app.isLoggedIn() ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin())
  ) {
    return <PageNotFound />;
  }
  const showAlternateClassname = className ? 'admins-moderators' : '';
  return (
    <CWPageLayout>
      <section className="CommunityManagementLayout">
        <section className={`left-section ${showAlternateClassname}`}>
          <div className="header">
            <CWText type="h2">{title}</CWText>
            <CWText type="b1">{description}</CWText>
          </div>

          <FeatureHint
            title={featureHint.title}
            hint={featureHint.description}
            className="feature-hint-mobile"
          />

          {children}
        </section>

        <section className="right-section">
          <FeatureHint
            title={featureHint.title}
            hint={featureHint.description}
          />
        </section>
      </section>
    </CWPageLayout>
  );
};

export default CommunityManagementLayout;
