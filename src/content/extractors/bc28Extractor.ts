import { VersionExtractor } from './baseExtractor';
import { PageModel, FastTabModel, FieldModel, ColumnModel, ActionModel, FactBoxModel, PageType } from '../../types';

export class BC28Extractor implements VersionExtractor {
  async extract(): Promise<PageModel> {
    const titleEl = document.querySelector('h1[role="heading"], [data-field-caption], .ms-nav-pagetitle');
    const caption = titleEl?.textContent?.trim() || document.title.split('-')[0].trim() || 'Untitled BC28 Page';
    
    const url = window.location.href;
    const pageIdMatch = url.match(/[?&]page=(\d+)/i) || url.match(/\/page\/(\d+)/i);
    const pageId = pageIdMatch ? pageIdMatch[1] : 'unknown';

    const fastTabs: FastTabModel[] = [];
    document.querySelectorAll('[role="region"][aria-label], .ms-core-group').forEach((tabEl, idx) => {
      const name = tabEl.getAttribute('aria-label') || tabEl.querySelector('legend, h2, h3')?.textContent?.trim() || `Section ${idx + 1}`;
      const expanded = tabEl.getAttribute('aria-expanded') !== 'false';
      const fields: FieldModel[] = [];

      tabEl.querySelectorAll('[data-field-caption], .field-group, .control-container').forEach((fieldEl, fIdx) => {
        const label = fieldEl.getAttribute('data-field-caption') || fieldEl.querySelector('label')?.textContent?.trim() || `Field ${fIdx}`;
        const input = fieldEl.querySelector('input, [role="combobox"], textarea');
        fields.push({
          id: `bc28-f-${idx}-${fIdx}`,
          caption: label.replace(/[:*]\s*$/, ''),
          normalizedCaption: label.replace(/[:*]\s*$/, '').toLowerCase().trim(),
          controlType: input?.getAttribute('role') === 'combobox' ? 'option' : 'text',
          editable: input?.getAttribute('aria-readonly') !== 'true' && !input?.hasAttribute('disabled'),
          visible: (fieldEl as HTMLElement).offsetParent !== null,
          mandatory: input?.getAttribute('aria-required') === 'true',
          value: (input as HTMLInputElement)?.value || input?.textContent?.trim()
        });
      });

      fastTabs.push({
        id: `bc28-tab-${idx}`,
        name,
        normalizedName: name.toLowerCase().trim(),
        expanded,
        order: idx,
        fields
      });
    });

    const gridColumns: ColumnModel[] = [];
    document.querySelectorAll('[role="columnheader"]').forEach((th, idx) => {
      const caption = th.textContent?.trim() || `Col ${idx}`;
      gridColumns.push({
        id: `bc28-col-${idx}`,
        caption,
        normalizedCaption: caption.toLowerCase().trim(),
        order: idx
      });
    });

    const actions: ActionModel[] = [];
    document.querySelectorAll('[role="toolbar"] button, [data-command-id]').forEach((btn, idx) => {
      const caption = btn.getAttribute('aria-label') || btn.textContent?.trim() || `Action ${idx}`;
      actions.push({
        id: `bc28-act-${idx}`,
        caption,
        normalizedCaption: caption.toLowerCase().trim(),
        category: 'Actions',
        enabled: btn.getAttribute('aria-disabled') !== 'true'
      });
    });

    const factBoxes: FactBoxModel[] = [];
    document.querySelectorAll('aside, [role="complementary"]').forEach((fb, idx) => {
      const title = fb.querySelector('h2, h3, header')?.textContent?.trim() || `FactBox ${idx}`;
      const summary = fb.textContent?.trim() || '';
      factBoxes.push({ id: `bc28-fb-${idx}`, title, summary });
    });

    return {
      pageId,
      caption,
      normalizedCaption: caption.toLowerCase().trim(),
      pageType: this.detectPageType(url),
      url,
      version: 'BC28',
      fastTabs,
      gridColumns,
      actions,
      factBoxes,
      filterPanePresent: !!document.querySelector('[aria-label*="Filter"]'),
      timestamp: Date.now()
    };
  }

  private detectPageType(url: string): PageType {
    if (url.includes('rolecenter')) return 'RoleCenter';
    if (url.includes('card')) return 'Card';
    if (url.includes('list')) return 'List';
    return 'Unknown';
  }
}