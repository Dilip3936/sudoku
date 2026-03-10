// src/App.jsx
import React, { useState, useRef, useEffect } from 'react';
import Board from './components/Board';
import Controls from './components/Controls';
import './css/Controls.css';
import './css/StatusMessages.css';
import StatusMessage from './components/StatusMessage';
import { fetchSudokuPuzzle } from './utils/fetchSudoku.js';
import NumberPad from './components/NumberPad';
import './css/NumberPad.css';
import { isValidMove, isBoardComplete, solveSudokuVisual, solveSudoku } from './utils/sudoku';
import { OpenCvProvider } from 'opencv-react';
import SudokuOcrUploader from './components/ocr';
import './css/Ocr.css';
import './css/App.css';

function createBoard(puzzle) {
  return puzzle.map(row =>
    row.map(cell => ({
      value: cell,
      readOnly: cell !== 0,
      incorrect: false,
      animKey: 0
    }))
  );
}

export default function App() {

  const [initialPuzzle, setInitialPuzzle] = useState(Array.from({ length: 9 }, () => Array(9).fill(0)));
  const [board, setBoard] = useState(createBoard(initialPuzzle));
  const [invalidMove, setInvalidMove] = useState(false);
  const [solveError, setSolveError] = useState('');
  const [animateSolve, setAnimateSolve] = useState(false);
  const animationActiveRef = useRef(false);
  const [delay, setDelay] = useState(0); // Default to 0ms per step
  const [loading, setLoading] = useState(false);
  const [solving, setSolving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [difficulty, setDifficulty] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy'); // Selector state
  const [focusedCell, setFocusedCell] = useState({ row: 0, col: 0 });
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const cellRefs = useRef([]);
  const [ocrActivated, setOcrActivated] = useState(false);
  const [pendingOcrFile, setPendingOcrFile] = useState(null);

  const handleSudokuExtracted = (grid) => {
    animationActiveRef.current = false;
    setInvalidMove(false);
    setSolveError('');
    setLocked(true);
    setInitialPuzzle(grid);
    setBoard(createBoard(grid));
  };

  function handleFeedback(rowIdx, colIdx, value = null) {
    if (!feedbackEnabled) {
      // Clear feedback if disabled
      setInvalidMove(false);
      setSolveError('');
      setBoard(prevBoard =>
        prevBoard.map(row =>
          row.map(cell => ({ ...cell, incorrect: false }))
        )
      );
      return;
    }

    setBoard(prevBoard => {
      if (prevBoard[rowIdx][colIdx].readOnly) {
        setInvalidMove(false);
        return prevBoard;
      }
      // Determine value to check (if not provided, use current cell value)
      const cellValue = value !== null ? value : prevBoard[rowIdx][colIdx].value;
      const isValid = cellValue === 0 || isValidMove(prevBoard, rowIdx, colIdx, cellValue);

      if (isValid) {
        setInvalidMove(false);
        setSolveError('');
        return prevBoard.map((row, r) =>
          row.map((cell, c) =>
            r === rowIdx && c === colIdx
              ? { ...cell, incorrect: false }
              : cell
          )
        );
      } else {
        setInvalidMove(true);
        setSolveError('');
        return prevBoard.map((row, r) =>
          row.map((cell, c) =>
            r === rowIdx && c === colIdx
              ? { ...cell, incorrect: true, animKey: (cell.animKey || 0) + 1 }
              : cell
          )
        );
      }
    }
    );
  }


  function handleCellFocus(rowIdx, colIdx) {
    setFocusedCell({ row: rowIdx, col: colIdx });
    handleFeedback(rowIdx, colIdx);
  }

  function handleNavigate(direction, currentRow, currentCol) {
    let newRow = currentRow;
    let newCol = currentCol;

    if (direction === 'ArrowUp') newRow = Math.max(0, currentRow - 1);
    if (direction === 'ArrowDown') newRow = Math.min(8, currentRow + 1);
    if (direction === 'ArrowLeft') newCol = Math.max(0, currentCol - 1);
    if (direction === 'ArrowRight') newCol = Math.min(8, currentCol + 1);

    if (newRow !== currentRow || newCol !== currentCol) {
      if (cellRefs.current[newRow] && cellRefs.current[newRow][newCol]) {
        cellRefs.current[newRow][newCol].focusInput();
      }
    }
  }

  function toggleFeedback() {
    setFeedbackEnabled(prev => !prev);
    if (feedbackEnabled) {
      // If turning off, clear all feedback
      setInvalidMove(false);
      setSolveError('');
      setBoard(prevBoard =>
        prevBoard.map(row =>
          row.map(cell => ({ ...cell, incorrect: false }))
        )
      );
    } else {
      // Optionally, re-run feedback for the currently focused cell
      const { row, col } = focusedCell;
      handleFeedback(row, col);
    }
  }


  async function handleNewPuzzle() {
    animationActiveRef.current = false;
    setInvalidMove(false);
    setSolveError('');
    setLocked(true);
    setLoading(true);

    try {
      const { puzzle, difficulty: fetchedDifficulty } = await fetchSudokuPuzzle(selectedDifficulty);
      setInitialPuzzle(puzzle);
      setBoard(createBoard(puzzle));
      setDifficulty(fetchedDifficulty); // Set display text
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
      setInvalidMove(false);
      setSolveError('');
      return prevBoard.map((row, r) =>
        row.map((cell, c) =>
          r === rowIdx && c === colIdx
            ? { ...cell, value: newValue }
            : { ...cell }
        )
      );
    });
    handleFeedback(rowIdx, colIdx, newValue);
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
            ? { ...cell, value: num }
            : cell
        )
      )
    );
    handleFeedback(row, col, num);

    // Restore browser focus to the input so keyboard works immediately
    if (cellRefs.current[row] && cellRefs.current[row][col]) {
      cellRefs.current[row][col].focusInput();
    }
  }

  function handleNumberPadClear() {
    const { row, col } = focusedCell;
    setBoard(prevBoard =>
      prevBoard.map((r, ri) =>
        r.map((cell, ci) =>
          ri === row && ci === col && !cell.readOnly
            ? { ...cell, value: 0 }
            : cell
        )
      )
    );
    handleFeedback(row, col, 0);

    // Restore browser focus to the input config
    if (cellRefs.current[row] && cellRefs.current[row][col]) {
      cellRefs.current[row][col].focusInput();
    }
  }


  async function handleSolve() {
    setInvalidMove(false);
    setSolveError('');
    setSolving(true);
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
    setSolving(false);
  }

  function handleReset() {
    animationActiveRef.current = false;
    setBoard(createBoard(initialPuzzle)); // <--- Use the last fetched puzzle
    setInvalidMove(false);
    setSolveError('');
  }

  const hasWon = isBoardComplete(board);

  return (
    <div className="app-container">
      <h1>Sudoku</h1>

      <div className="main-content">
        <div className="board-and-ocr-wrapper">
          <div className="board-column">
            <div className="board-section">
              <Board
                board={board}
                onCellChange={handleCellChange}
                onCellFocus={(row, col) => handleCellFocus(row, col)}
                onNavigate={handleNavigate}
                focusedCell={focusedCell}
                cellRefs={cellRefs}
              />
              <NumberPad
                onNumberClick={handleNumberPadInput}
                onClear={handleNumberPadClear}
              />
            </div>

            <div className="controls-container">
              <Controls
                onSolve={handleSolve}
                onReset={handleReset}
                onNewPuzzle={handleNewPuzzle}
                animateSolve={animateSolve}
                setAnimateSolve={setAnimateSolve}
                delay={delay}
                setDelay={setDelay}
                loading={loading}
                solving={solving}
                locked={locked}
                hasWon={hasWon}
                onToggleLockPuzzle={handleToggleLockPuzzle}
                onClearAll={handleClearAll}
                feedbackEnabled={feedbackEnabled}
                onToggleFeedback={toggleFeedback}
                selectedDifficulty={selectedDifficulty}
                setSelectedDifficulty={setSelectedDifficulty}
              />
            </div>
          </div>

          <div className="ocr-container">
            <h2>Fill Sudoku (OCR)</h2>
            {ocrActivated ? (
              <OpenCvProvider openCvPath="opencv.js">
                <SudokuOcrUploader onSudokuExtracted={handleSudokuExtracted} initialFile={pendingOcrFile} />
              </OpenCvProvider>
            ) : (
              // Picking a file here triggers OpenCV to load, then passes the file along
              <>
                <div className="file-upload-wrapper">
                  <div className="custom-file-upload-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Choose Image
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setPendingOcrFile(file);
                        setOcrActivated(true);
                      }
                    }}
                  />
                </div>
                <div className="button-group">
                  <button className="extract-btn" disabled>
                    Extract Sudoku Grid
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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
