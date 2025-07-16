import React, { useState } from 'react';
import { ocr } from '../utils/ocr';

function OcrUploader() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');

  const handleChange = e => setImage(e.target.files[0]);

  const handleOCR = async () => {
    const result = await ocr(image, 'eng'); // Calls your complete function
    setText(result);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleChange} />
      <button onClick={handleOCR} disabled={!image}>Convert to Text</button>
      <pre>{text}</pre>
    </div>
  );
}

export default OcrUploader;
