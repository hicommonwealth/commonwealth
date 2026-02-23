export const listenForDOMNodeApperance = ({
  selector,
  targetNode = document.body,
  onAppear,
}: {
  selector: string; // mimics document.querySelector, any value that can work with querySelector, will work here
  targetNode?: HTMLElement; // node where we expect changes to happen
  onAppear: () => void;
}) => {
  const observeDOM = (mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement && node.matches(selector)) {
            onAppear();

            observer.disconnect(); // no longer needed, disconnect
            break;
          }
        }
      }
    }
  };

  const observer = new MutationObserver(observeDOM);
  observer.observe(targetNode, { childList: true, subtree: true });
};
