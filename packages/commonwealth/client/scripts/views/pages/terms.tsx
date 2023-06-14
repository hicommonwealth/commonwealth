import { renderMultilineText } from 'helpers';
import { useCommonNavigate } from 'navigation/helpers';
/* eslint-disable max-len */
import 'pages/privacy_and_terms.scss';
import React from 'react';
import { CWText } from '../components/component_kit/cw_text';

const TOS = `This “Privacy Policy” describes the privacy practices of Commonwealth Labs, Inc. ( “Commonwealth”, “we”, “us”, or “our”) in connection with the www.commonwealth.im website, the Commonwealth Platform (i.e., the Commonwealth decentralized governance platform), and any other website or mobile application that we own or control and which posts or links to this Privacy Policy (collectively, the “Service”), and the rights and choices available to individuals with respect to their information.   
Commonwealth may provide additional or supplemental privacy policies to individuals for specific products or services that we offer at the time we collect personal information. These supplemental privacy policies will govern how we may process the information in the context of the specific product or service.
`;

const TermsPage = () => {
  const navigate = useCommonNavigate();

  return (
    <div className="TermsPage">
      <div className="forum-container">
        <CWText type="h3">Terms of Service</CWText>
        <CWText>Posted on 6/13/2023</CWText>
        {renderMultilineText(TOS)}
        <CWText
          onClick={() => {
            window.open(
              'https://drive.google.com/file/d/1Sd9dnyOKONc8880QwDiVSB3mrq1Pzb86/view?usp=sharing',
              '_blank'
            );
          }}
          className="link"
        >
          See Full Policy
        </CWText>
        <CWText
          onClick={() => {
            navigate('/tos-1-26-2023');
          }}
          className="link"
        >
          Previous Privacy Policy
        </CWText>
      </div>
    </div>
  );
};

export default TermsPage;
