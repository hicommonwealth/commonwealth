import React from 'react';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import AdminContestsPageContent from './AdminContestsPageContent';
import useAdminContestsPageData from './useAdminContestsPageData';

import './AdminContestsPage.scss';

const AdminContestsPage = () => {
  const data = useAdminContestsPageData();

  if (!data.isAuthorized) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <AdminContestsPageContent {...data} />
    </CWPageLayout>
  );
};

export default AdminContestsPage;
