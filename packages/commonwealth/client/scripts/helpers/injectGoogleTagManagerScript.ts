import { render } from 'mithrilInterop';

const injectGoogleTagManagerScript = () => {
  const script = document.createElement('noscript');
  // TODO: @ZAK @REACT check this refactor
  //   m.render(
  //     script,
  //     m.trust(
  // eslint-disable-next-line max-len
  //       '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KRWH69V" height="0" width="0" style="display:none;visibility:hidden"></iframe>'
  //     )
  //   );
  render.trust(
    // eslint-disable-next-line max-len
    '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KRWH69V" height="0" width="0" style="display:none;visibility:hidden"></iframe>'
  );
  document.body.insertBefore(script, document.body.firstChild);
};

export default injectGoogleTagManagerScript;
