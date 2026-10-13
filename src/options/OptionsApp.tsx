import React, { useState } from 'react';

export const OptionsApp: React.FC = () => {
  const [threshold, setThreshold] = useState<number>(0.8);

  return (
    <div className="p-8 max-w-xl mx-auto font-sans text-sm text-gray-800">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">BC Page Differ Options</h1>
      <div className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <label className="block font-medium mb-1">Fuzzy Match Threshold: {threshold}</label>
          <input 
            type="range" 
            min="0.5" 
            max="1.0" 
            step="0.05" 
            value={threshold} 
            onChange={(e) => setThreshold(parseFloat(e.target.value))} 
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};