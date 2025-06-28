// src/components/Cell.jsx
import React from 'react';
import '../css/Cell.css';

export default function Cell({ value, onChange, readOnly , incorrect ,onFocus}) {
  return (
    <input
      type="text"
      maxLength="1"
      value={value === 0 ? '' : value}
      onChange={e => {
        const val = e.target.value;
        if (/^[1-9]?$/.test(val)) {
          onChange(val === '' ? 0 : parseInt(val, 10));
        }
      }}
      readOnly={readOnly}
      onFocus={onFocus}
      className={`cell${readOnly ? ' cell--readonly' : ''}${incorrect ? ' cell--incorrect' : ''}`}
    />
  );
}
