// src/components/Controls.jsx
import React from 'react';

export default function Controls({
  onSolve,
  onReset,
  animateSolve,
  setAnimateSolve,
  delay,
  setDelay,
  onNewPuzzle,
  loading,
  hasWon,
  onClearAll,
  locked,
  solving,
  onToggleLockPuzzle,
  onToggleFeedback,
  feedbackEnabled
}) {
  return (
    <div style={{ marginTop: '1em' }}>
      <button title="Solve the Sudoku!" onClick={onSolve} disabled={!locked || hasWon || solving} >
        {solving? "Solving..." : "solve" }</button>
      <button title="Reset the Sudoku!" onClick={onReset} style={{ marginLeft: '1em' }}>Reset</button>
      <button title="Get a new Sudoku!" onClick={onNewPuzzle}  disabled={loading} style={{ marginLeft: '1em' }}>
        {loading ? "Loading..." : "New Puzzle"}
      </button>
      <button
      title="Lock or unlock the puzzle to prevent changes"
        onClick={onToggleLockPuzzle}
        style={{ marginLeft: '1em' }}
        disabled={false}
      >
        {locked ? 'Unlock Puzzle' : 'Lock Puzzle'}
      </button>
      <button title="Clears all the contents" onClick={onClearAll} style={{ marginLeft: '1em' }} disabled={loading}>
        Clear All
      </button>
      <button onClick={onToggleFeedback} style={{ marginLeft: '1em' }}>
      {feedbackEnabled ? 'Disable Feedback' : 'Enable Feedback'}
      </button>



      <button
      title="Animate the solving process"
        onClick={() => setAnimateSolve(a => !a)}
        disabled={!locked}
        style={{ marginLeft: '1em' }}
      >
        Animation: {animateSolve ? 'ON' : 'OFF'}
      </button>
      <label style={{ marginLeft: '1em', verticalAlign: 'middle' }}>
        Speed:
        <input
          type="range"
          min="0"
          max="500"
          step="1"
          value={delay}
          onChange={e => setDelay(Number(e.target.value))}
          style={{ marginLeft: '0.5em', verticalAlign: 'middle' }}
          disabled={!animateSolve}
        />
        <span style={{ marginLeft: '0.5em', fontSize: '0.9em' }}>
          {delay} ms
        </span>
      </label>
    </div>
  );
}
