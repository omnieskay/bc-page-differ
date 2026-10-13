import React, { useState, useEffect } from 'react';
import { TabPairing, PageDiffResult } from '../types';

export const SidePanelApp: React.FC = () => {
  const [pairing, setPairing] = useState<TabPairing>({});
  const [results] = useState<PageDiffResult[]>([]);
  const [activeTabTab, setActiveTabTab] = useState<'status' | 'diff' | 'crawl'>('status');

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_PAIRING' }, res => {
      if (res?.success) setPairing(res.data);
    });
  }, []);

  const handlePairCurrent = async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    if (!currentTab) return;

    const newPairing = { ...pairing };
    if (currentTab.url?.includes('14')) {
      newPairing.tabIdA = currentTab.id;
      newPairing.urlA = currentTab.url;
    } else {
      newPairing.tabIdB = currentTab.id;
      newPairing.urlB = currentTab.url;
    }
    setPairing(newPairing);
    chrome.runtime.sendMessage({ type: 'SET_PAIRING', pairing: newPairing });
  };

  const handleArrange = () => {
    chrome.runtime.sendMessage({ type: 'ARRANGE_WINDOWS' });
  };

  const handleCompare = async () => {
    if (!pairing.tabIdA || !pairing.tabIdB) return;
    const resA = await chrome.runtime.sendMessage({ type: 'EXTRACT_PAGE', tabId: pairing.tabIdA });
    const resB = await chrome.runtime.sendMessage({ type: 'EXTRACT_PAGE', tabId: pairing.tabIdB });

    if (resA?.success && resB?.success) {
      setActiveTabTab('diff');
    }
  };

  return (
    <div className="p-4 font-sans text-sm text-gray-800 bg-gray-50 min-h-screen">
      <h1 className="text-lg font-bold mb-3 text-blue-700">BC Page Differ</h1>
      
      <div className="flex gap-2 mb-4 border-b pb-2">
        <button onClick={() => setActiveTabTab('status')} className={`px-3 py-1 rounded ${activeTabTab === 'status' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Setup</button>
        <button onClick={() => setActiveTabTab('diff')} className={`px-3 py-1 rounded ${activeTabTab === 'diff' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Diff View</button>
        <button onClick={() => setActiveTabTab('crawl')} className={`px-3 py-1 rounded ${activeTabTab === 'crawl' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Crawler</button>
      </div>

      {activeTabTab === 'status' && (
        <div className="space-y-4 bg-white p-4 rounded shadow">
          <h2 className="font-semibold text-gray-700">Tab & Window Pairing</h2>
          <div className="text-xs space-y-1">
            <p><strong>Source A (BC14):</strong> {pairing.tabIdA ? `Tab #${pairing.tabIdA}` : 'Not assigned'}</p>
            <p><strong>Source B (BC28):</strong> {pairing.tabIdB ? `Tab #${pairing.tabIdB}` : 'Not assigned'}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePairCurrent} className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">Assign Active Tab</button>
            <button onClick={handleArrange} className="bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700">Tile Split Screen</button>
          </div>
          <button onClick={handleCompare} className="w-full mt-4 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700">Compare Current Pages</button>
        </div>
      )}

      {activeTabTab === 'diff' && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold text-gray-700 mb-2">Difference Report</h2>
          {results.length === 0 ? (
            <p className="text-gray-500 italic">No comparison executed yet. Go to Setup and click Compare.</p>
          ) : (
            <div>Results loaded...</div>
          )}
        </div>
      )}

      {activeTabTab === 'crawl' && (
        <div className="bg-white p-4 rounded shadow space-y-3">
          <h2 className="font-semibold text-gray-700">Crawl Mode</h2>
          <textarea placeholder="Enter Page IDs (e.g. 21, 22, 42) separated by commas" className="w-full p-2 border rounded text-xs h-24" />
          <button className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700">Start Batch Crawl</button>
        </div>
      )}
    </div>
  );
};