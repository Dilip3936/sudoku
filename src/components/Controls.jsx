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
  locked,
  onToggleLockPuzzle
}) {
  return (
    <div style={{ marginTop: '1em' }}>
      <button onClick={onSolve} disabled={!locked} >Solve</button>
      <button onClick={onReset} style={{ marginLeft: '1em' }}>Reset</button>
      <button onClick={onNewPuzzle}  disabled={loading|| !locked} style={{ marginLeft: '1em' }}>
        {loading ? "Loading..." : "New Puzzle"}
      </button>
      <button
        onClick={onToggleLockPuzzle}
        style={{ marginLeft: '1em' }}
        disabled={false}
      >
        {locked ? 'Unlock Puzzle' : 'Lock Puzzle'}
      </button>



      <button
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
