import { TabPairing, CrawlJob, PageModel } from '../types';

let pairing: TabPairing = {};
let currentCrawlJob: CrawlJob | null = null;

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(err => {
    sendResponse({ success: false, error: err.message });
  });
  return true;
});

async function handleMessage(message: any, sender: chrome.runtime.MessageSender) {
  switch (message.type) {
    case 'GET_PAIRING':
      return { success: true, data: pairing };
    case 'SET_PAIRING':
      pairing = message.pairing;
      await chrome.storage.session.set({ tabPairing: pairing });
      return { success: true };
    case 'ARRANGE_WINDOWS':
      await arrangeWindowsSideBySide();
      return { success: true };
    case 'EXTRACT_PAGE':
      return await executeExtraction(message.tabId);
    case 'START_CRAWL':
      return await startCrawl(message.pageIds, message.delayMs);
    case 'PAUSE_CRAWL':
      if (currentCrawlJob) currentCrawlJob.status = 'paused';
      return { success: true };
    case 'CANCEL_CRAWL':
      if (currentCrawlJob) currentCrawlJob.status = 'cancelled';
      return { success: true };
    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

async function arrangeWindowsSideBySide() {
  if (!pairing.tabIdA || !pairing.tabIdB) throw new Error('Both tabs must be paired first.');
  const tabA = await chrome.tabs.get(pairing.tabIdA);
  const tabB = await chrome.tabs.get(pairing.tabIdB);
  
  const displayInfo = await chrome.system.display.getInfo();
  const primaryDisplay = displayInfo[0] || { workArea: { width: 1920, height: 1080, left: 0, top: 0 } };
  const halfWidth = Math.floor(primaryDisplay.workArea.width / 2);

  await chrome.windows.update(tabA.windowId, {
    left: primaryDisplay.workArea.left,
    top: primaryDisplay.workArea.top,
    width: halfWidth,
    height: primaryDisplay.workArea.height,
    state: 'normal'
  });

  await chrome.windows.update(tabB.windowId, {
    left: primaryDisplay.workArea.left + halfWidth,
    top: primaryDisplay.workArea.top,
    width: halfWidth,
    height: primaryDisplay.workArea.height,
    state: 'normal'
  });
}

async function executeExtraction(tabId: number): Promise<{ success: boolean; data?: PageModel }> {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    files: ['src/content/contentScript.js']
  });
  return { success: true, data: result.result };
}

async function startCrawl(pageIds: string[], delayMs: number) {
  currentCrawlJob = {
    id: Date.now().toString(),
    pageIds,
    currentIndex: 0,
    status: 'running',
    delayMs,
    results: []
  };
  return { success: true, jobId: currentCrawlJob.id };
}