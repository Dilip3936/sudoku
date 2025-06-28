// src/App.jsx
import React, { useState ,useRef,useEffect} from 'react';
import Board from './components/Board';
import Controls from './components/Controls';
import './css/StatusMessages.css';
import StatusMessage from './components/StatusMessage';
import { fetchSudokuPuzzle } from './utils/fetchSudoku.js';
import NumberPad from './components/NumberPad';
import './css/NumberPad.css';
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
    const [initialPuzzle, setInitialPuzzle] = useState(
        Array.from({ length: 9 }, () => Array(9).fill(0)) // Start with all zeros
      );
      const [board, setBoard] = useState(createBoard(initialPuzzle));
  const [invalidMove, setInvalidMove] = useState(false);
  const [solveError, setSolveError] = useState('');
  const [animateSolve, setAnimateSolve] = useState(false);
  const animationActiveRef = useRef(false);
  const [delay, setDelay] = useState(1); // Default to 1ms per step
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [difficulty, setDifficulty] = useState('');
  const [focusedCell, setFocusedCell] = useState({ row: 0, col: 0 });





  function handleCellFocus(rowIdx, colIdx) {
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
    setFocusedCell({ row:rowIdx, col:colIdx });
  }

  async function handleNewPuzzle() {
    animationActiveRef.current = false;
    setInvalidMove(false);
    setSolveError('');
    setLocked(true);
    setLoading(true);
  
    try {
      const { puzzle, difficulty } = await fetchSudokuPuzzle();
      setInitialPuzzle(puzzle);
      setBoard(createBoard(puzzle));
      setDifficulty(difficulty); // <-- Set the difficulty here
    } catch (error) {
      setSolveError(error.message);
      setDifficulty(''); // Clear on error
    } finally {
      setLoading(false);
    }
  }
  
  
  function handleClearAll() {
    animationActiveRef.current = false; // Stop any animation
    setBoard(createBoard(Array.from({ length: 9 }, () => Array(9).fill(0))));
    setInitialPuzzle(Array.from({ length: 9 }, () => Array(9).fill(0)));
    setInvalidMove(false);
    setSolveError('');
    setLocked(false); // Optional: unlock the board for editing
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
                ? { ...cell, value: newValue,incorrect: false} 
                : { ...cell} // clear incorrect on all other cells
            )
          );
        } else {
          setInvalidMove(true);
          return prevBoard.map((row, r) =>
            row.map((cell, c) =>
              r === rowIdx && c === colIdx
                ? { ...cell, value: newValue,incorrect: true} // mark as incorrect
                : { ...cell}
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
  
  
  function handleNumberPadInput(num) {
    const { row, col } = focusedCell;
    setBoard(prevBoard =>
      prevBoard.map((r, ri) =>
        r.map((cell, ci) =>
          ri === row && ci === col && !cell.readOnly
            ? { ...cell, value: num, incorrect: false }
            : cell
        )
      )
    );
    setInvalidMove(false);
  }

  function handleNumberPadClear() {
    const { row, col } = focusedCell;
    setBoard(prevBoard =>
      prevBoard.map((r, ri) =>
        r.map((cell, ci) =>
          ri === row && ci === col && !cell.readOnly
            ? { ...cell, value: 0, incorrect: false }
            : cell
        )
      )
    );
    setInvalidMove(false);
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
    animationActiveRef.current = false;
    setBoard(createBoard(initialPuzzle)); // <--- Use the last fetched puzzle
    setInvalidMove(false);
    setSolveError('');
  }
  
  
  const hasWon = isBoardComplete(board);

  return (
    <div>
        <Board
          board={board}
          onCellChange={handleCellChange}
          onCellFocus={(row, col) => handleCellFocus(row, col)}
          focusedCell={focusedCell}
        />
        <NumberPad
          onNumberClick={handleNumberPadInput}
          onClear={handleNumberPadClear}
        />
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
        onClearAll={handleClearAll}
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
      {difficulty && (
  <div className="sudoku-difficulty" style={{ margin: '1em 0', fontWeight: 'bold' }}>
    Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
  </div>
)}

    </div>
  );
  
}
