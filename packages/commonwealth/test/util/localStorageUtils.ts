import { JSDOM } from 'jsdom';

/* 
This allows tests to use window, document, or localStorage as if they were running 
in a real browser environment, even though they're actually running in a Node.js environment. 
This is particularly useful for testing code that relies on these browser-specific APIs.
such as window, document, and localStorage
*/
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
});
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).localStorage = dom.window.localStorage;
