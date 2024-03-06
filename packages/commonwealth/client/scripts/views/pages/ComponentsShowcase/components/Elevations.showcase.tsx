import React from 'react';
import { CWCard } from 'views/components/component_kit/cw_card';

const ElevationsShowcase = () => {
  return (
    <>
      <div className="flex-row">
        <CWCard elevation="elevation-1">XS</CWCard>
        <CWCard elevation="elevation-2">S</CWCard>
        <CWCard elevation="elevation-3">M</CWCard>
        <CWCard elevation="elevation-4">L</CWCard>
        <CWCard elevation="elevation-5">XL</CWCard>
      </div>
    </>
  );
};

export default ElevationsShowcase;
