type JumpHighlightElementProps = {
  elementQuerySelecter: string;
};

export const jumpHighlightElement = ({
  elementQuerySelecter,
}: JumpHighlightElementProps) => {
  const element = document.querySelector(elementQuerySelecter);
  if (!element) {
    console.warn(
      `No element to highlight for selector: ${elementQuerySelecter}`,
    );
    return;
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.classList.add('highlighted');
  setTimeout(() => {
    element.classList.remove('highlighted');
  }, 2000);
};
