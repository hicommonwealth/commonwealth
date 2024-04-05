import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';

const TypographyShowcase = () => {
  return (
    <>
      <CWText fontWeight="semiBold" type="d1">
        Display1 semi bold
      </CWText>
      <CWText type="d1" fontWeight="bold">
        Display1 bold
      </CWText>
      <CWText type="d1" fontWeight="black">
        Display1 black
      </CWText>
      <CWText fontWeight="semiBold" type="d2">
        Display2 semi bold
      </CWText>
      <CWText type="d2" fontWeight="bold">
        Display2 bold
      </CWText>
      <CWText type="d2" fontWeight="black">
        Display2 black
      </CWText>
      <CWText fontWeight="medium" type="h1">
        Heading1 medium
      </CWText>
      <CWText type="h1" fontWeight="semiBold">
        Heading1 semi bold
      </CWText>
      <CWText type="h1" fontWeight="bold">
        Heading1 bold
      </CWText>
      <CWText fontWeight="medium" type="h2">
        Heading2 medium
      </CWText>
      <CWText type="h2" fontWeight="semiBold">
        Heading2 semi bold
      </CWText>
      <CWText type="h2" fontWeight="bold">
        Heading2 bold
      </CWText>
      <CWText fontWeight="medium" type="h3">
        Heading3 medium
      </CWText>
      <CWText type="h3" fontWeight="semiBold">
        Heading3 semi bold
      </CWText>
      <CWText type="h3" fontWeight="bold">
        Heading3 bold
      </CWText>
      <CWText fontWeight="medium" type="h4">
        Heading4 medium
      </CWText>
      <CWText type="h4" fontWeight="semiBold">
        Heading4 semi bold
      </CWText>
      <CWText type="h4" fontWeight="bold">
        Heading4 bold
      </CWText>
      <CWText fontWeight="medium" type="h5">
        Heading5 medium
      </CWText>
      <CWText type="h5" fontWeight="semiBold">
        Heading5 semi bold
      </CWText>
      <CWText type="h5" fontWeight="bold">
        Heading5 bold
      </CWText>
      <CWText type="b1">Body1 regular</CWText>
      <CWText type="b1" fontWeight="bold">
        Body1 bold
      </CWText>
      <CWText type="b1" fontWeight="italic">
        Body1 italic
      </CWText>
      <CWText type="b2">Body2 regular</CWText>
      <CWText type="b2" fontWeight="bold">
        Body2 bold
      </CWText>
      <CWText type="b2" fontWeight="italic">
        Body2 italic
      </CWText>
      <CWText type="caption">Caption regular</CWText>
      <CWText type="caption" fontWeight="medium">
        Caption medium
      </CWText>
      <CWText type="caption" fontWeight="uppercase">
        Caption uppercase
      </CWText>
    </>
  );
};

export default TypographyShowcase;
