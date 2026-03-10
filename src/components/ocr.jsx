import React, { useRef, useState, useEffect } from 'react';
import { useOpenCv } from 'opencv-react';
import { locatePuzzle, splitIntoCells, processCells, predictDigitsFromCells } from '../utils/processing';
import '../css/Ocr.css'

/**
 * @param {object} props
 * @param {(grid: number[][]) => void} props.onSudokuExtracted - Callback function to pass the extracted grid to the parent.
 * @param {File|null} props.initialFile - A pre-selected file to immediately load on mount.
 */

function SudokuOcrUploader({ onSudokuExtracted, initialFile }) {
  const { loaded, cv } = useOpenCv();
  const [result, setResult] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isImageReady, setIsImageReady] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugImages, setDebugImages] = useState([]);
  const canvasRef = useRef();

  const handleChange = (e) => {
    setResult('');
    setIsImageReady(false);
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    drawFileToCanvas(file);
  };

  const drawFileToCanvas = (file) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      setIsImageReady(true);
    };
    img.src = URL.createObjectURL(file);
  };

  // Auto-load the initialFile when OpenCV finishes loading
  useEffect(() => {
    if (loaded && initialFile && !selectedFile) {
      setSelectedFile(initialFile);
      drawFileToCanvas(initialFile);
    }
  }, [loaded, initialFile]);

  const handleOCR = async () => {
    if (!cv || !canvasRef.current) return;
    setProcessing(true);
    setResult('');
    setDebugImages([]); // Clear previous debug images
    const mats = [];
    try {
      const canvas = canvasRef.current;
      const srcMat = cv.imread(canvas);
      mats.push(srcMat);
      const { warped } = locatePuzzle(srcMat, cv);
      if (!warped || warped.empty()) throw new Error('Sudoku not found');
      mats.push(warped);
      const cells = splitIntoCells(warped, cv);
      const processedCells = processCells(cells, cv);
      processedCells.forEach(mat => mats.push(mat));

      // Generate debug images if debug mode is on
      if (isDebugMode) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 28;
        tempCanvas.height = 28;
        const debugUrls = processedCells.map(cellMat => {
          cv.imshow(tempCanvas, cellMat);
          return tempCanvas.toDataURL('image/png');
        });
        setDebugImages(debugUrls);
      }

      const grid = await predictDigitsFromCells(processedCells, cv);
      if (onSudokuExtracted) {
        onSudokuExtracted(grid);
      }

    } catch (err) {
      setResult('Failed: ' + err.message);
    } finally {
      mats.forEach(m => { if (m && !m.isDeleted()) m.delete(); });
      setProcessing(false);
    }
  };

  return (
    <div>
      <div className="file-upload-wrapper">
        <div className="custom-file-upload-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Choose Image
        </div>
        <input
          title="Upload an image of a Sudoku puzzle to solve"
          type="file"
          accept="image/*"
          disabled={!loaded || processing}
          onChange={handleChange}
        />
      </div>

      {selectedFile && (
        <div className="file-name-display">
          {selectedFile.name}
        </div>
      )}

      <div className="button-group">
        <button
          className="extract-btn"
          onClick={handleOCR}
          disabled={!loaded || !isImageReady || processing}
        >
          {loaded ? (processing ? 'Processing...' : 'Extract Sudoku Grid') : 'Loading OpenCV...'}
        </button>
      </div>

      <div className="debug-toggle-wrapper">
        <label>
          <input
            type="checkbox"
            checked={isDebugMode}
            onChange={(e) => setIsDebugMode(e.target.checked)}
          />
          Enable Debug Mode
        </label>
      </div>

      {result && <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>}
      <canvas ref={canvasRef} style={{ width: '400px', height: '400px', display: isImageReady ? 'block' : 'none' }} />

      {isDebugMode && debugImages.length === 81 && (
        <div className="debug-grid-container">
          <h3>Debug: Processed Cells</h3>
          <p className="debug-subtitle">These are the exact images fed into the AI matcher</p>
          <div className="debug-grid">
            {debugImages.map((src, idx) => (
              <img key={idx} src={src} alt={`Cell ${idx}`} className="debug-cell-img" />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default SudokuOcrUploader;
