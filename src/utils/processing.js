import { createWorker } from 'tesseract.js';

export async function initOCRWorker() {
  return await createWorker({
    workerPath: 'worker.min.js',
    corePath: 'tesseract-core.wasm.js',
    langPath: 'eng.traineddata',
  });
}

function addBlackBorder(src, thickness = 25) {
    let dst = new cv.Mat();
    let color = new cv.Scalar(0, 0, 0, 255);
    cv.copyMakeBorder(src, dst, thickness, thickness, thickness, thickness, cv.BORDER_CONSTANT, color);
    return dst;
}

function orderPoints(pts) {
    // pts: Array of four [x, y] points 
    const sum = pts.map(([x, y]) => x + y);
    const diff = pts.map(([x, y]) => x - y);
  
    const tl = pts[sum.indexOf(Math.min(...sum))]; // top-left
    const br = pts[sum.indexOf(Math.max(...sum))]; // bottom-right
  
    const [tr, bl] = pts
      .filter(p => p !== tl && p !== br)
      .sort((a, b) => a[1] - b[1]); // sort by y: smaller is top-right
  
    return [tl, tr, br, bl];
}
  
function fourPointTransform(src, pts, cv) {
    const [tl, tr, br, bl] = orderPoints(pts);
  
    const width = Math.round(
      Math.max(
        Math.hypot(br[0] - bl[0], br[1] - bl[1]),
        Math.hypot(tr[0] - tl[0], tr[1] - tl[1])
      )
    );
    const height = Math.round(
      Math.max(
        Math.hypot(tr[0] - br[0], tr[1] - br[1]),
        Math.hypot(tl[0] - bl[0], tl[1] - bl[1])
      )
    );
  
    const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
      tl[0], tl[1],
      tr[0], tr[1],
      br[0], br[1],
      bl[0], bl[1]
    ]);
    const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,
      width - 1, 0,
      width - 1, height - 1,
      0, height - 1
    ]);
  
    const M = cv.getPerspectiveTransform(srcPts, dstPts);
    const warped = new cv.Mat();
    cv.warpPerspective(
      src, warped, M, new cv.Size(width, height),
      cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar()
    );
  
    srcPts.delete();
    dstPts.delete();
    M.delete();
    return warped;
}
  
function findPuzzleOutline(contours, cv) {
    let puzzleOutline = null;
    let maxArea = 0;
    for (let i = 0; i < contours.size(); ++i) {
      const cnt = contours.get(i);
      const area = cv.contourArea(cnt, false);
      if (area > maxArea) {
        const peri = cv.arcLength(cnt, true);
        let approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
        if (approx.rows === 4) {
          if (puzzleOutline) puzzleOutline.delete();
          puzzleOutline = approx.clone();
          maxArea = area;
        }
        approx.delete();
      }
      cnt.delete();
    }
    return puzzleOutline;
}
  

export function locatePuzzle(src, cv) {
    let image= new cv.Mat();
    image=src.clone();

    // Create a new Mat object to hold the grayscale image
    let gray = new cv.Mat();
    
    // Perform an operation: convert the source image to grayscale
    cv.cvtColor(image, gray, cv.COLOR_RGBA2GRAY, 0);

    //apply guassian blur
    let blurred = new cv.Mat();

    //the kernel size must be add and positve due to some symmetric properties
    let ksize = new cv.Size(7,7);
    cv.GaussianBlur(gray, blurred, ksize, 3);

    // converets the picturers to complete white and black with an adaptive threshold
    let thresh = new cv.Mat();
    cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

    //inverting the image
    cv.bitwise_not(thresh, thresh);

    //find contours in the image
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    let puzzleOutline = findPuzzleOutline(contours, cv);

    // if we find no contours , that means we failed to detext the sudoku borders
    // but i found that adding a black border to the image and then trying again works
    if (puzzleOutline === null) {
      image.delete();
      image = addBlackBorder(src, 25);
      cv.cvtColor(image, gray, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(gray, blurred, ksize, 3);
      cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
      cv.bitwise_not(thresh, thresh);

      cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      puzzleOutline = findPuzzleOutline(contours, cv);

        // if we still find no contours, we throw an error
      if (puzzleOutline === null) {
        gray.delete(); blurred.delete(); thresh.delete(); contours.delete(); hierarchy.delete();
        throw new Error("Could not find Sudoku puzzle outline.");
      }
    }

    // we are extracting the points of the outline
    let points = [];
    for (let i = 0; i < 4; ++i) {
        points.push([
          puzzleOutline.intAt(i, 0),
          puzzleOutline.intAt(i, 1),
        ]);
    }

    //we are using fourpointtransform to warp the image to a rectangle
    //that is cropped to the sudoku's border 
    let puzzle = fourPointTransform(image, points,cv);
    let warped = fourPointTransform(gray, points,cv);

    //for the opencv data we need to delete the objects manually to prevent memory leaks 
    //also the app may crash if we don't delete the objects
    gray.delete(); blurred.delete(); thresh.delete(); contours.delete(); hierarchy.delete();
    puzzleOutline.delete(); image.delete();

    const result = {
        puzzle: puzzle,
        warped: warped,
    };
    return result;
}

//splits the warped image into 81 cells
export function splitIntoCells(warped,cv) {
    const height = warped.rows;
    const width = warped.cols;
    const cellHeight = Math.floor(height / 9);
    const cellWidth = Math.floor(width / 9);
    const cells = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const y1 = row * cellHeight;
        const x1 = col * cellWidth;
        const roi = new cv.Rect(x1, y1, cellWidth, cellHeight);
        cells.push(warped.roi(roi).clone());
      }
    }
    return cells;
}

//converts to black and white and then make the image white text on black background
export function preprocessCell(cell,cv) {
    let gray = new cv.Mat();
    if (cell.channels() === 3 || cell.channels() === 4) {
      cv.cvtColor(cell, gray, cv.COLOR_RGBA2GRAY);
    } else {
      gray = cell.clone();
    }
    let cellBin = new cv.Mat();
    cv.threshold(gray, cellBin, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
    if (cv.mean(cellBin)[0] > 127) {
      cv.bitwise_not(cellBin, cellBin);
    }
    gray.delete();
    return cellBin;
}

//resizes the cell to a fixed size
function resizeCell(cell, size = 32,cv) {
    let dst = new cv.Mat();
    let dsize = new cv.Size(size, size);
    cv.resize(cell, dst, dsize, 0, 0, cv.INTER_AREA);
    return dst;
}

//cleans borders of the cell that are left over while cutting the cells
function cleanBorders(cellBin,cv) {
  let cellClean = cellBin.clone();
  let mask = new cv.Mat();
  cv.copyMakeBorder(cellBin, mask, 1,1,1,1, cv.BORDER_CONSTANT, new cv.Scalar(0));
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    for (let j = 0; j < cnt.rows; j++) {
      let y = cnt.intAt(j, 0)[1];
      let x = cnt.intAt(j, 0)[0];
      if (x === 0 || x === mask.cols - 1 || y === 0 || y === mask.rows - 1) {
        cv.drawContours(cellClean, contours, i, new cv.Scalar(0), -1);
        break;
      }
    }
    cnt.delete();
  }
  let kernel = cv.Mat.ones(2, 2, cv.CV_8U);
  cv.erode(cellClean, cellClean, kernel);
  contours.delete(); hierarchy.delete(); mask.delete(); kernel.delete();
  return cellClean;
}


//combines the above functions to process the cells
//this is used to prepare the cells for OCR
export function processCells(cells,cv) {
    return cells.map(cell => {
      let cellBin = preprocessCell(cell,cv);
      //let cellClean = cleanBorders(cellBin,cv);
      let cellResized = resizeCell(cellBin, 32,cv);
      //cellBin.delete(); cellClean.delete();
      return cellResized;
    });
}

//the main ocr occurs here
export async function predictDigitsFromCells(cells, cv) {
  //Convert all cv.Mat cells to image data URLs
  const cellImages = cells.map(cell => {
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, cell);
    cell.delete(); // Free memory
    return canvas.toDataURL();
  });

  //Create & configure a single Tesseract worker
  const worker = await createWorker('eng');
  await worker.setParameters({
    tessedit_char_whitelist: '123456789', // Only recognize digits 1-9
    tessedit_pageseg_mode: '10',         // Treat the image as a single character
  });

  // Run OCR on each cell image (one by one)
  const results = [];
  for (const [index, img] of cellImages.entries()) {
    try {
      const { data: { text } } = await worker.recognize(img);
      const match = text.trim().match(/[1-9]/);
      results.push(match ? parseInt(match[0], 10) : 0);
    } catch (error) {
      console.error(`Error recognizing cell at index ${index}:`, error);
      console.log(`Failing image data URL for index ${index}:`, img);
      results.push(0); // Push a default value for the failed cell
    }
  }

  //Terminate the worker to free up resources
  await worker.terminate();

  //Group the flat results array into a 9x9 Sudoku grid
  const sudokuGrid = [];
  for (let i = 0; i < 9; i++) {
    sudokuGrid.push(results.slice(i * 9, (i + 1) * 9));
  }
  return sudokuGrid;
}
