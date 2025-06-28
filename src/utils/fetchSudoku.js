// utils/fetchSudoku.js
export async function fetchSudokuPuzzle() {
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
  }
  