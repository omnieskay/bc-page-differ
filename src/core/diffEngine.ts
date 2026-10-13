import { PageModel, Difference, PageDiffResult, Settings } from '../types';
import { Normalizer } from './normalizer';

export class DiffEngine {
  private normalizer: Normalizer;
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
    this.normalizer = new Normalizer(settings.aliasMap, settings.ignoreList);
  }

  public comparePages(modelA: PageModel, modelB: PageModel): PageDiffResult {
    const differences: Difference[] = [];

    const fieldsA = modelA.fastTabs.flatMap(t => t.fields);
    const fieldsB = modelB.fastTabs.flatMap(t => t.fields);

    this.compareItems(fieldsA, fieldsB, 'Field', differences);
    this.compareItems(modelA.gridColumns, modelB.gridColumns, 'Column', differences);
    this.compareItems(modelA.actions, modelB.actions, 'Action', differences);
    this.compareItems(modelA.factBoxes, modelB.factBoxes, 'FactBox', differences);

    let added = 0, removed = 0, changed = 0, criticalCount = 0;
    for (const d of differences) {
      if (d.type === 'added') added++;
      else if (d.type === 'removed') removed++;
      else changed++;
      if (d.severity === 'critical') criticalCount++;
    }

    return {
      pageId: modelB.pageId || modelA.pageId,
      captionA: modelA.caption,
      captionB: modelB.caption,
      differences,
      summary: { added, removed, changed, criticalCount }
    };
  }

  private compareItems(listA: any[], listB: any[], category: any, differences: Difference[]) {
    const mapA = new Map(listA.map(item => [this.normalizer.normalizeCaption(item.caption || item.title || ''), item]));
    const mapB = new Map(listB.map(item => [this.normalizer.normalizeCaption(item.caption || item.title || ''), item]));

    for (const [normA, itemA] of mapA.entries()) {
      if (this.normalizer.shouldIgnore(itemA.caption || itemA.title)) continue;
      if (!mapB.has(normA)) {
        let foundFuzzy = false;
        for (const [normB, itemB] of mapB.entries()) {
          const sim = this.normalizer.similarity(normA, normB);
          if (sim >= this.settings.fuzzyThreshold && sim < 1.0) {
            foundFuzzy = true;
            differences.push({
              id: `diff-${Math.random()}`,
              category,
              type: 'renamed',
              severity: 'warn',
              locationPath: `${category}s`,
              elementName: itemA.caption || itemA.title,
              valueA: itemA.caption || itemA.title,
              valueB: itemB.caption || itemB.title,
              description: `Renamed from "${itemA.caption || itemA.title}" to "${itemB.caption || itemB.title}"`
            });
            break;
          }
        }
        if (!foundFuzzy) {
          differences.push({
            id: `diff-${Math.random()}`,
            category,
            type: 'removed',
            severity: 'critical',
            locationPath: `${category}s`,
            elementName: itemA.caption || itemA.title,
            valueA: itemA.caption || itemA.title,
            valueB: null,
            description: `Removed in BC28: "${itemA.caption || itemA.title}"`
          });
        }
      } else {
        const itemB = mapB.get(normA);
        if (itemA.editable !== itemB.editable) {
          differences.push({
            id: `diff-${Math.random()}`,
            category,
            type: 'property_changed',
            severity: 'warn',
            locationPath: `${category}s/${itemA.caption}`,
            elementName: itemA.caption,
            valueA: `Editable: ${itemA.editable}`,
            valueB: `Editable: ${itemB.editable}`,
            description: `Editable status changed for "${itemA.caption}"`
          });
        }
      }
    }

    for (const [normB, itemB] of mapB.entries()) {
      if (this.normalizer.shouldIgnore(itemB.caption || itemB.title)) continue;
      if (!mapA.has(normB)) {
        differences.push({
          id: `diff-${Math.random()}`,
          category,
          type: 'added',
          severity: 'info',
          locationPath: `${category}s`,
          elementName: itemB.caption || itemB.title,
          valueA: null,
          valueB: itemB.caption || itemB.title,
          description: `Added in BC28: "${itemB.caption || itemB.title}"`
        });
      }
    }
  }
}