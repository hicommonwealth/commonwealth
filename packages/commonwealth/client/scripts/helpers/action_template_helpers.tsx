import React, { useEffect, useState } from 'react';
import { CWDivider } from '../views/components/component_kit/cw_divider';
import { CWDropdown } from '../views/components/component_kit/cw_dropdown';
import { CWText } from '../views/components/component_kit/cw_text';
import { CWTextInput } from '../views/components/component_kit/cw_text_input';
import { TemplateComponents } from '../views/pages/view_template/view_template';

export const renderDisabledTemplate = (form_fields) => {
  return form_fields.flatMap((field, index) => {
    const [component] = Object.keys(form_fields[index]);

    switch (component) {
      case TemplateComponents.DIVIDER:
        return <CWDivider />;
      case TemplateComponents.TEXT:
        return (
          <CWText fontStyle={field[component].field_type}>
            {field[component].field_value}
          </CWText>
        );
      case TemplateComponents.INPUT:
        return (
          <CWTextInput
            label={field[component].field_label}
            placeholder={field[component].field_name}
            disabled
          />
        );
      case TemplateComponents.FUNCTIONFORM: {
        const functionComponents = [
          <CWDivider />,
          <CWText type="h3">{field[component].field_label}</CWText>,
        ];

        functionComponents.push(
          ...field[component].tx_forms.flatMap((method, i) => {
            // Recursively call the renderTemplate(this function) funciton for each sub function form
            return renderDisabledTemplate(method.form);
          })
        );

        functionComponents.push(<CWDivider />);
        return functionComponents;
      }
      case TemplateComponents.DROPDOWN:
        return (
          <CWDropdown
            label={field[component].field_label}
            options={field[component].field_options}
          />
        );
      default:
        return null;
    }
  });
};
