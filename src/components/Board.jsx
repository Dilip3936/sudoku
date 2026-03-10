// src/components/Board.jsx
import React from 'react';
import Cell from './Cell';
import '../css/Board.css';

export default function Board({ board, onCellChange ,onCellFocus, onNavigate, focusedCell, cellRefs}) {
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
              animKey={cell.animKey}
              isFocused={focusedCell && focusedCell.row === rowIdx && focusedCell.col === colIdx}
              onFocus={() => onCellFocus(rowIdx, colIdx)}
              onNavigate={(direction) => onNavigate && onNavigate(direction, rowIdx, colIdx)}
              ref={el => {
                if (cellRefs && cellRefs.current) {
                  if (!cellRefs.current[rowIdx]) cellRefs.current[rowIdx] = [];
                  cellRefs.current[rowIdx][colIdx] = el;
                }
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
