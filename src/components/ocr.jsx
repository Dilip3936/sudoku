import React, { useRef, useState } from 'react';
import { useOpenCv } from 'opencv-react';
import { locatePuzzle, splitIntoCells, processCells,predictDigitsFromCells } from '../utils/processing';

function SudokuOcrUploader() {
  const { loaded, cv } = useOpenCv();
  const [result, setResult] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isImageReady, setIsImageReady] = useState(false);
  const canvasRef = useRef();

  const handleChange = (e) => {
    setResult('');
    setIsImageReady(false);
    const file = e.target.files[0];
    if (!file) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      setIsImageReady(true);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleOCR = async () => {
    if (!cv || !canvasRef.current) return;
    setProcessing(true);
    setResult('');
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
      const grid = await predictDigitsFromCells(processedCells, cv);
      setResult(grid.map(r => r.join(' ')).join('\n'));
      
    } catch (err) {
      setResult('Failed: ' + err.message);
    } finally {
      mats.forEach(m => { if (m && !m.isDeleted()) m.delete(); });
      setProcessing(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        disabled={!loaded || processing}
        onChange={handleChange}
      />
      <button
        onClick={handleOCR}
        disabled={!loaded || !isImageReady || processing}
      >
        {loaded ? (processing ? 'Processing...' : 'Extract Sudoku Grid') : 'Loading OpenCV...'}
      </button>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default SudokuOcrUploader;
