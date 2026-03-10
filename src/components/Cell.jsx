import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import '../css/Cell.css';

const Cell = forwardRef(({ value, onChange, readOnly, incorrect, onFocus, onNavigate, animKey, isFocused }, ref) => {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }));

  useEffect(() => {
    if (incorrect && inputRef.current) {
      inputRef.current.classList.remove('shake-animation');
      void inputRef.current.offsetWidth; // trigger reflow
      inputRef.current.classList.add('shake-animation');
    }
  }, [incorrect, value, animKey]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value === 0 ? '' : value}
      onChange={e => {
        let val = e.target.value;

        if (val.length > 1) {
          if (e.nativeEvent && e.nativeEvent.data) {
            val = e.nativeEvent.data;
          } else {
            val = val.slice(-1);
          }
        }

        if (/^[1-9]?$/.test(val)) {
          onChange(val === '' ? 0 : parseInt(val, 10));
        }
      }}
      readOnly={readOnly}
      onFocus={onFocus}
      onKeyDown={(e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          if (onNavigate) onNavigate(e.key);
        }
      }}
      className={`cell${readOnly ? ' cell--readonly' : ''}${incorrect ? ' cell--incorrect' : ''}${isFocused ? ' cell--focused' : ''}`}
    />
  );
});

export default Cell;
