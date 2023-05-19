import React, { FC } from 'react';
import type { Meta } from "@storybook/react";

import { CWBreadcrumbs } from '../../../client/scripts/views/components/component_kit/cw_breadcrumbs';
import type { BreadcrumbsType } from '../../../client/scripts/views/components/component_kit/cw_breadcrumbs';
import { argsObj } from '../helpers';

const breadcrumbs = {
  title: 'Molecules/Breadcrumbs',
  component: CWBreadcrumbs,
} satisfies Meta<typeof CWBreadcrumbs>;

export default breadcrumbs;

const labels: string[] = [
  "Page",
  "Page",
  "Page",
  "Current",
];

const argsObjToArr = (argsObj: any) => {
  let breadcrumbsArr: BreadcrumbsType[] = [];

  Object.values(argsObj).map((value: any) => {
    let breadcrumb: BreadcrumbsType = { label: value };
    breadcrumbsArr.push(breadcrumb);
  });

  return breadcrumbsArr;
}

export const BreadcrumbsStory = {
  name: 'Breadcrumbs',
  args: argsObj("Breadcrumb", labels),
  parameters: {
    controls: { exclude: [ "breadcrumbs" ] },
  },
  render: ({...args}) => (
    <CWBreadcrumbs breadcrumbs={argsObjToArr(args)} />
  ),
}
