import React from 'react';
import { renderToString } from 'react-dom/server';
import Editor from 'views/components/Editor';
import { describe, test } from 'vitest';

describe('markdownToHTML', () => {
  test('basic', () => {
    const html = renderToString(
      <div>
        <Editor mode="desktop" imageHandler="local" />
      </div>,
    );
    console.log(html);

    // markdownToHTML('hello world');
  });
});
