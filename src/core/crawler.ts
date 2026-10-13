import { PageModel, PageDiffResult, Settings } from '../types';
import { DiffEngine } from './diffEngine';

export class Crawler {
  private settings: Settings;
  private diffEngine: DiffEngine;

  constructor(settings: Settings) {
    this.settings = settings;
    this.diffEngine = new DiffEngine(settings);
  }

  public async crawlPage(pageId: string, tabIdA: number, tabIdB: number, baseUrlA: string, baseUrlB: string): Promise<PageDiffResult> {
    await chrome.tabs.update(tabIdA, { url: `${baseUrlA}?page=${pageId}` });
    await chrome.tabs.update(tabIdB, { url: `${baseUrlB}?page=${pageId}` });

    await this.delay(3000);

    const modelA = await this.extractTab(tabIdA);
    const modelB = await this.extractTab(tabIdB);

    return this.diffEngine.comparePages(modelA, modelB);
  }

  private async extractTab(tabId: number): Promise<PageModel> {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['src/content/contentScript.js']
    });
    return result.result as PageModel;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}