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
  feedbackEnabled,
  selectedDifficulty,
  setSelectedDifficulty
}) {
  return (
    <>
      {/* Row 1: Solve · Reset · New Puzzle · Lock · Clear All */}
      <div className="controls-row">
        <button title="Solve the Sudoku!" onClick={onSolve} disabled={!locked || hasWon || solving}>
          {solving ? 'Solving…' : 'Solve'}
        </button>
        <button title="Reset the Sudoku!" onClick={onReset}>Reset</button>

        <div className="new-puzzle-group">
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="difficulty-select"
            title="Select Puzzle Difficulty"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="random">Random</option>
          </select>
          <button title="Get a new Sudoku!" onClick={onNewPuzzle} disabled={loading} className="new-puzzle-btn">
            {loading ? 'Loading…' : 'New Puzzle'}
          </button>
        </div>

        <button title="Lock or unlock the puzzle to prevent changes" onClick={onToggleLockPuzzle}>
          {locked ? 'Unlock' : 'Lock'}
        </button>
        <button title="Clears all the contents" onClick={onClearAll} disabled={loading}>
          Clear All
        </button>
      </div>

      {/* Row 2: Feedback · Animation · Speed slider */}
      <div className="controls-row">
        <button onClick={onToggleFeedback}>
          {feedbackEnabled ? 'Feedback: ON' : 'Feedback: OFF'}
        </button>
        <button
          title="Animate the solving process"
          onClick={() => setAnimateSolve(a => !a)}
          disabled={!locked}
        >
          Animation: {animateSolve ? 'ON' : 'OFF'}
        </button>
        <label className="speed-label">
          Speed
          <input
            type="range"
            min="0"
            max="500"
            step="1"
            value={delay}
            onChange={e => setDelay(Number(e.target.value))}
            disabled={!animateSolve}
          />
          <span>{delay}ms</span>
        </label>
      </div>
    </>
  );
}
