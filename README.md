# Sudoku Solver with OCR 

This project is a client-side Sudoku solving application that operates entirely within the user's web browser. It offers multiple input methods: manual entry via an interactive grid, automatic puzzle generation using an API, and an Optical Character Recognition (OCR) feature to solve puzzles directly from an uploaded image.
## Description

-  I wanted to make an easy-to-use Sudoku solver that doesn't need a server. Everything happens on your computer, so no data is ever sent anywhere.
- This is my first shot at building a website, and also my first time using React and Vite. I figured the best way to learn web dev was to build something fun that I actually enjoy.
- A lot of the OCR logic is borrowed from another one of my projects, [GitHub - Dilip3936/sudoku-ocr](https://github.com/Dilip3936/sudoku-ocr) but is ported to work with javascript.
- The UI isn't the prettiest. I focused more on making the puzzle-solving and OCR logic work well.

## Features

- **Interactive Sudoku Grid:** A 9x9 grid that allows users to input numbers manually.
- **Fetch New Puzzles:** Don't have a puzzle? Just hit a button to fetch a new one from an API  [GitHub - Marcus0086/SudokuApi](https://github.com/Marcus0086/SudokuApi)
- **Client-Side OCR:** Upload an image of a Sudoku puzzle, and the application will automatically detect and place the numbers onto the grid all in the browser without sending the image to any server.
- **Solver:** Uses a backtracking algorithm to find the solution once the board is set up.

## How the OCR Works

 The script streamlines Sudoku puzzle recognition through a multi-stage process:
- Initially, it uses a series of image processing steps, including grayscale conversion and blurring, to locate the puzzle within an image. 
- Once found, it corrects any perspective distortion to create a flat, top-down view of the grid. 
- The grid is then divided into 81 individual cells, each of which is cleaned to isolate the digit inside.
- Finally, the script employs Tesseract to predict the digits in each cell and fills the grid.

## Technologies Used

This project was built with a few modern frontend tools:
- **React:** For building the UI.
- **OpenCV.js:** To handle all the image processing stuff in JavaScript.
- **Tesseract.js:** To read the numbers from images, right in the browser.

## Installation

To get this running on your own machine, just follow these steps.

1. **Clone the repository:**
    
 ```
	git clone https://github.com/Dilip3936/sudoku.git
 ```
    
2. **Navigate to the project directory:**

   ```
	cd sudoku
    ```
    
3. **Install dependencies:** If you don’t have npm, you'll need to install it first.

   ```
    npm install
    ```
    
4. **Run the development server:**

    ```
    npm run dev
    ```

## Usage

1. Open the application in your browser (usually at `http://localhost:5173`).
    
2. You have two options to input a puzzle:
    
    - **Manual Entry:** Click on any cell in the grid and type the number.
    - **Fetch using API:** Get a brand-new puzzle from the API.
    - **OCR Upload:** Click the "Upload Image" button, select an image of a Sudoku puzzle, and the grid will be populated automatically.
    
3. Once the puzzle is on the grid, click the "Solve" button.
    
4. The application will fill in the remaining cells with the correct solution.

## Roadmap and Future Improvements

Here’s a list of things I'd like to add or fix. (I may never do it but...)

### **Core Functionality & Solver Logic**

- **Variable Grid Sizes:** Implement support for different Sudoku sizes beyond the standard 9x9 grid.
- **Advanced Solver:** Enhance the solving algorithm to correctly identify and flag unsolvable puzzles instead of attempting to solve them indefinitely.
- **Mobile App:** Develop a native mobile application for Android to accompany the website. (Only to learn app dev)
- **Difficulty Levels:**  Implement some more api’s with difficulty control.
- **Solver:** Add different solving methods instead of just the backtracking.

### **OCR Enhancements**

- **Offline Tesseract:** Ensure the OCR functionality works completely offline.
	- As of publishing, I couldn’t get the Tesseract to work in offline mode
- **Image Pre-processing:** Add a "clean borders" function to improve digit recognition accuracy from images.
	- Couldn’t get the “clean borders “ function to work in js.
- **Keras Model Integration:** Explore using a `.keras` machine learning model for more robust and accurate OCR performance.

### **UI/UX Upgrades**

- **UI Polish:** Redesign the interface to be more visually appealing and modern.
- **Dark Mode:** Add a toggle for switching between light and dark themes.
- **Centralized Layout:** Ensure all components are properly centered for a balanced look.
- **Settings Menu:** Create a dedicated settings menu to house options like the theme toggle and grid size selection.
- **Declutter Interface:** Simplify the layout to improve user experience and focus.
### **Bug Fixes & Code Quality**

- **Numpad Input Validation:** Fix the issue where incorrect numbers entered via the numpad are not immediately flagged.
- **Animated Solver:** Investigate and stabilize the animated solving visualization to ensure it runs smoothly and stops correctly.    
- **Code Refactoring:** Restructure key components like `App.jsx` for better readability and maintainability.