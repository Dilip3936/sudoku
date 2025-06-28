// src/App.jsx
import React, { useState ,useRef} from 'react';
import Board from './components/Board';
import Controls from './components/Controls';
import './css/StatusMessages.css';
import StatusMessage from './components/StatusMessage';
import { fetchSudokuPuzzle } from './utils/fetchSudoku.js';
import { isValidMove, isBoardComplete, solveSudokuVisual,solveSudoku } from './utils/sudoku';

const initialPuzzle = Array.from({ length: 9 }, () => Array(9).fill(0));

  
function createBoard(puzzle) {
  return puzzle.map(row =>
    row.map(cell => ({
      value: cell,
      readOnly: cell !== 0,
      incorrect : false
    }))
  );
}

export default function App() {
  const [board, setBoard] = useState(createBoard(initialPuzzle));
  const [invalidMove, setInvalidMove] = useState(false);
  const [solveError, setSolveError] = useState('');
  const [animateSolve, setAnimateSolve] = useState(false);
  const animationActiveRef = useRef(false);
  const [delay, setDelay] = useState(50); // Default to 50ms per step
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(true);



  function onCellFocus(rowIdx, colIdx) {
    setInvalidMove(false);
    setBoard(prevBoard =>
      prevBoard.map((row, r) =>
        row.map((cell, c) =>
          r === rowIdx && c === colIdx
            ? { ...cell, incorrect: !isValidMove(prevBoard, rowIdx, colIdx, cell.value) }
            : cell
        )
      )
    );
  }

  async function handleNewPuzzle() {
    animationActiveRef.current = false;
    setInvalidMove(false);
    setSolveError('');
    setLoading(true);
    try {
      const { puzzle } = await fetchSudokuPuzzle();
      setBoard(createBoard(puzzle));
    } catch (error) {
      setSolveError(error.message);
    } finally {
      setLoading(false);
    }
  }
  

  function handleCellChange(rowIdx, colIdx, newValue) {
    setBoard(prevBoard => {
        const isValid = newValue === 0 || isValidMove(prevBoard, rowIdx, colIdx, newValue);
      
        if (isValid) {
          setInvalidMove(false);
          setSolveError('');
          return prevBoard.map((row, r) =>
            row.map((cell, c) =>
              r === rowIdx && c === colIdx
                ? { ...cell, value: newValue,incorrect: false} // valid move, not incorrect
                : { ...cell} // clear incorrect on all other cells
            )
          );
        } else {
          setInvalidMove(true);
          return prevBoard.map((row, r) =>
            row.map((cell, c) =>
              r === rowIdx && c === colIdx
                ? { ...cell, value: newValue,incorrect: true} // mark as incorrect
                : { ...cell} // clear incorrect on all other cells
            )
          );
        }
      });
      
  }

  function handleToggleLockPuzzle() {
    setInvalidMove(false);
    // Create a deep copy of the current board for checking
    const workingBoard = board.map(row => row.map(cell => ({ ...cell })));
    const solution = solveSudoku(workingBoard);
  
    if (!locked) {
      // If locking: check if the board is solvable
      if (solution) {
        // Lock the puzzle: set readOnly to true for all nonzero cells
        setBoard(prevBoard =>
          prevBoard.map(row =>
            row.map(cell =>
              cell.value !== 0
                ? { ...cell, readOnly: true }
                : { ...cell, readOnly: false }
            )
          )
        );
        setLocked(true);
        setSolveError('');
      } else {
        // Notify user that the board is not solvable
        setSolveError('The current puzzle is not solvable. Please correct it before locking.');
      }
    } else {
      // If unlocking: make all cells editable again
      setBoard(prevBoard =>
        prevBoard.map(row =>
          row.map(cell => ({ ...cell, readOnly: false }))
        )
      );
      setLocked(false);
      setSolveError('');
    }
  }
  
  
  
  
  async function handleSolve() {
    setInvalidMove(false);
    setSolveError('');
    const workingBoard = board.map(row => row.map(cell => ({ ...cell })));
  
    if (animateSolve) {
      animationActiveRef.current = true;
      const solved = await solveSudokuVisual(workingBoard, setBoard, delay, animationActiveRef);
      if (!solved) {
        setSolveError('No solution found for the current board!');
      }
    } else {
      const solution = solveSudoku(workingBoard);
      if (solution) setBoard(solution);
      else setSolveError('No solution found for the current board!');
    }
  }
  

  function handleReset() {
    animationActiveRef.current = false; // Stop animation if running
    setBoard(createBoard(initialPuzzle));
    setInvalidMove(false);
    setSolveError('');
  }
  
  const hasWon = isBoardComplete(board);

  return (
    <div>
      <Board board={board} onCellChange={handleCellChange} onCellFocus={onCellFocus} />
        <Controls
        onSolve={handleSolve}
        onReset={handleReset}
        onNewPuzzle={handleNewPuzzle}
        animateSolve={animateSolve}
        setAnimateSolve={setAnimateSolve}
        delay={delay}
        setDelay={setDelay}
        loading={loading}
        locked={locked}
        hasWon={hasWon}
        onToggleLockPuzzle={handleToggleLockPuzzle}
        />
        

      {invalidMove && (
        <StatusMessage type="error">
          Invalid move! That number breaks Sudoku rules.
        </StatusMessage>
      )}
      {solveError && (
        <StatusMessage type="error">
          {solveError}
        </StatusMessage>
      )}
      {hasWon && (
        <StatusMessage type="win">
          🎉 Congratulations! You solved the puzzle! 🎉
        </StatusMessage>
      )}
    </div>
  );
  
}
