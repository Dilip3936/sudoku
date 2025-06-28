import React from 'react';
import '../css/NumberPad.css';

export default function NumberPad({ onNumberClick, onClear }) {
  return (
    <div className="numpad">
      {[1,2,3,4,5,6,7,8,9].map(num => (
        <button
          key={num}
          className="numpad-number"
          onClick={() => onNumberClick(num)}
        >
          {num}
        </button>
      ))}
      <button
        className="numpad-clear"
        onClick={onClear}
      >
        Clear
      </button>
    </div>
  );
}
