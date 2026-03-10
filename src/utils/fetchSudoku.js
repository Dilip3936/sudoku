// old function

/* export async function fetchSudokuPuzzle() {
    const url = 'https://sudoku-api.vercel.app/api/dosuku?query={newboard(limit:1){grids{value,solution,difficulty}}}';
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return {
        puzzle: data.newboard.grids[0].value,
        solution: data.newboard.grids[0].solution,
        difficulty: data.newboard.grids[0].difficulty
      };
    } catch (error) {
      throw new Error('Failed to fetch new Sudoku puzzle. Please check your internet connection.');
    }
  } */


const FALLBACK_PUZZLES = [
  // Easy
  [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ],
  // Medium
  [
    [0, 0, 0, 2, 6, 0, 7, 0, 1],
    [6, 8, 0, 0, 7, 0, 0, 9, 0],
    [1, 9, 0, 0, 0, 4, 5, 0, 0],
    [8, 2, 0, 1, 0, 0, 0, 4, 0],
    [0, 0, 4, 6, 0, 2, 9, 0, 0],
    [0, 5, 0, 0, 0, 3, 0, 2, 8],
    [0, 0, 9, 3, 0, 0, 0, 7, 4],fetch
    [0, 4, 0, 0, 5, 0, 0, 3, 6],
    [7, 0, 3, 0, 1, 8, 0, 0, 0]
  ],
  // Hard
  [
    [0, 0, 0, 6, 0, 0, 4, 0, 0],
    [7, 0, 0, 0, 0, 3, 6, 0, 0],
    [0, 0, 0, 0, 9, 1, 0, 8, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 5, 0, 1, 8, 0, 0, 0, 3],
    [0, 0, 0, 3, 0, 6, 0, 4, 5],
    [0, 4, 0, 2, 0, 0, 0, 6, 0],
    [9, 0, 3, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 0, 1, 0, 0]
  ]
];

const DIFFICULTIES = ["easy", "medium", "hard"];

function getRandomFallback() {
  const index = Math.floor(Math.random() * FALLBACK_PUZZLES.length);
  return {
    puzzle: FALLBACK_PUZZLES[index].map(row => [...row]),
    difficulty: DIFFICULTIES[index]
  };
}

export async function fetchSudokuPuzzle(requestedDifficulty = 'random') {
  const validDifficulty = ['easy', 'medium', 'hard', 'random'].includes(requestedDifficulty)
    ? requestedDifficulty
    : 'random';

  const url = `https://sugoku.onrender.com/board?difficulty=${validDifficulty}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return getRandomFallback();
    }

    const data = await response.json();
    return {
      puzzle: data.board,
      solution: null,
      difficulty: validDifficulty === 'random' ? 'random generated' : validDifficulty
    };

  } catch (error) {
    console.warn("External Sudoku API failed or timed out. Falling back to built-in puzzles.");
    return getRandomFallback();
  }
}
  