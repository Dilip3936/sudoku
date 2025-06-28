export function isValidMove(board, row, col, num) {
  if (num === 0) return true; // 0 means empty, always valid

  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c].value === num) return false;
  }
  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col].value === num) return false;
  }
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && board[r][c].value === num) return false;
    }
  }
  return true;
}

export function isBoardComplete(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = board[row][col];
      if (cell.value === 0) return false;
      if (!isValidMove(board, row, col, cell.value)) return false;
    }
  }
  return true;
}

export function isBoardValid(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = board[row][col];
      if (!isValidMove(board, row, col, cell.value)) return false;
    }
  }
  return true;
}


  // Helper to deep clone the board
function cloneBoard(board) {
  return board.map(row => row.map(cell => ({ ...cell })));
}

export async function solveSudokuVisual(board, setBoard, delay, animationActiveRef) {
  if (!isBoardValid(board)) return null;
  async function solve(r = 0, c = 0) {
    if (!animationActiveRef.current) return false; // Stop if animation cancelled
    if (r === 9) return true;
    if (c === 9) return await solve(r + 1, 0);
    if (board[r][c].readOnly) return await solve(r, c + 1);

    for (let num = 1; num <= 9; num++) {
      if (!animationActiveRef.current) return false; // Stop if animation cancelled
      if (isValidMove(board, r, c, num)) {
        board[r][c].value = num;
        setBoard(cloneBoard(board));
        await new Promise(res => setTimeout(res, delay));

        if (await solve(r, c + 1)) return true;
        board[r][c].value = 0; // Backtrack
        setBoard(cloneBoard(board));
        await new Promise(res => setTimeout(res, delay));
      }
    }
    return false;
  }

  return await solve(0, 0);
}


// Backtracking Sudoku solver
export function solveSudoku(board) {
  if (!isBoardValid(board)) return null;
  const newBoard = cloneBoard(board);

  function solveHelper(r, c) {
    if (r === 9) return true;
    if (c === 9) return solveHelper(r + 1, 0);
    if (newBoard[r][c].readOnly) return solveHelper(r, c + 1);

    for (let num = 1; num <= 9; num++) {
      if (isValidMove(newBoard, r, c, num)) {
        newBoard[r][c].value = num;
        if (solveHelper(r, c + 1)) return true;
        newBoard[r][c].value = 0;
      }
    }
    return false;
  }

  const solved = solveHelper(0, 0);
  return solved ? newBoard : null;
}