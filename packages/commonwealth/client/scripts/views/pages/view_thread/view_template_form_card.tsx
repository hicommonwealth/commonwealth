import React from 'react';
import ViewTemplateForm from '../view_template/view_template_form';
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';
import '../../../../styles/pages/view_thread/view_template_form_card.scss';

export const ViewTemplateFormCard = ({ address, slug }) => {
  return (
    <CWContentPageCard
      header="View Template Form"
      content={
        <div className="view-template-form-card">
          <ViewTemplateForm address={address} slug={slug} />
        </div>
      }
    />
  );
};
