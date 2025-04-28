import React, {
  ChangeEvent,
  ClipboardEvent,
  KeyboardEvent,
  useRef,
  useState,
} from 'react';

type Props = {
  onComplete: (code: string) => void;
  onCancel?: () => void;
};

export const CodeDialog = (props: Props) => {
  const { onComplete, onCancel } = props;
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const focusInput = (idx: number) => inputs.current[idx]?.focus();

  const handleChange = (idx: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(-1); // keep last digit only
    const nextDigits = [...digits];
    nextDigits[idx] = value;
    setDigits(nextDigits);

    if (value && idx < 5) focusInput(idx + 1);
    if (nextDigits.every((d) => d !== '')) onComplete(nextDigits.join(''));
  };

  const handleKeyDown =
    (idx: number) => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
        const prevDigits = [...digits];
        prevDigits[idx - 1] = '';
        setDigits(prevDigits);
        focusInput(idx - 1);
      }
    };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      const nextDigits = text.split('');
      setDigits(nextDigits);
      inputs.current[5]?.focus();
      onComplete(text);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {digits.map((d, idx) => (
          <input
            key={idx}
            ref={(el) => (inputs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={handleChange(idx)}
            onKeyDown={handleKeyDown(idx)}
            onPaste={idx === 0 ? handlePaste : undefined}
            style={{
              width: '3rem',
              height: '3rem',
              fontSize: '2rem',
              textAlign: 'center',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        ))}
      </div>

      <button
        style={{
          marginTop: '1.5rem',
          padding: '0.5rem 1.25rem',
          fontSize: '1rem',
        }}
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
};
