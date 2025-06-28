// src/components/Board.jsx
import React from 'react';
import Cell from './Cell';
import '../css/Board.css';

export default function Board({ board, onCellChange ,onCellFocus}) {
  return (
    <div className="board">
      {board.map((row, rowIdx) => (
        <div className="board-row" key={rowIdx}>
          {row.map((cell, colIdx) => (
            <Cell
              key={`${rowIdx}-${colIdx}`}
              value={cell.value}
              onChange={val => onCellChange(rowIdx, colIdx, val)}
              readOnly={cell.readOnly}
              incorrect={cell.incorrect} // Pass incorrect state to Cell
              onFocus={() => onCellFocus(rowIdx, colIdx)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
