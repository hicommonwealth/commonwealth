import React, { useState } from 'react';
/* eslint-disable max-len */
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

import app from 'state';
import 'pages/privacy_and_terms.scss';

import { CWText } from '../components/component_kit/cw_text';
import Sublayout from '../Sublayout';
import '../../../../static/brand_assets/tos-6-9-2023.pdf';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  const [numPages, setNumPages] = useState(null);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <Sublayout>
      <div className="TermsPage">
        <div className="forum-container">
          <CWText>Posted on 6/8/2023</CWText>
          <Link to="/tos-1-26-2023">Previous privacy policy.</Link>
          <Document
            file="static/brand_assets/tos-6-9-2023.pdf"
            onLoadSuccess={onDocumentLoadSuccess}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page
                renderTextLayer={false}
                renderAnnotationLayer={false}
                key={`page_${index + 1}`}
                pageNumber={index + 1}
              />
            ))}
          </Document>
        </div>
      </div>
    </Sublayout>
  );
};

export default TermsPage;
