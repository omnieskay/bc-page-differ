import { VersionExtractor } from './baseExtractor';
import { PageModel, FastTabModel, FieldModel, ColumnModel, ActionModel, FactBoxModel, PageType } from '../../types';

export class BC14Extractor implements VersionExtractor {
  async extract(): Promise<PageModel> {
    const titleEl = document.querySelector('.ms-nav-caption') || document.title;
    const caption = typeof titleEl === 'string' ? titleEl : (titleEl?.textContent?.trim() || 'Untitled BC14 Page');
    
    const url = window.location.href;
    const pageIdMatch = url.match(/[?&]page=(\d+)/i) || url.match(/\/(\d+)\/?/);
    const pageId = pageIdMatch ? pageIdMatch[1] : 'unknown';

    const fastTabs: FastTabModel[] = [];
    document.querySelectorAll('.ms-nav-group, .ms-nav-fasttab').forEach((tabEl, idx) => {
      const name = tabEl.querySelector('.ms-nav-group-title')?.textContent?.trim() || `FastTab ${idx + 1}`;
      const expanded = !tabEl.classList.contains('collapsed');
      const fields: FieldModel[] = [];

      tabEl.querySelectorAll('.ms-nav-control, .ms-nav-field').forEach((fieldEl, fIdx) => {
        const label = fieldEl.querySelector('label')?.textContent?.trim() || `Field ${fIdx}`;
        const input = fieldEl.querySelector('input, select, textarea');
        fields.push({
          id: `bc14-f-${idx}-${fIdx}`,
          caption: label.replace(/[:*]\s*$/, ''),
          normalizedCaption: label.replace(/[:*]\s*$/, '').toLowerCase().trim(),
          controlType: input?.tagName.toLowerCase() === 'select' ? 'option' : 'text',
          editable: !input?.hasAttribute('readonly') && !input?.hasAttribute('disabled'),
          visible: (fieldEl as HTMLElement).offsetParent !== null,
          mandatory: fieldEl.classList.contains('required') || label.includes('*'),
          value: (input as HTMLInputElement)?.value
        });
      });

      fastTabs.push({
        id: `bc14-tab-${idx}`,
        name,
        normalizedName: name.toLowerCase().trim(),
        expanded,
        order: idx,
        fields
      });
    });

    const gridColumns: ColumnModel[] = [];
    document.querySelectorAll('.ms-nav-grid th, .ms-nav-listheader th').forEach((th, idx) => {
      const caption = th.textContent?.trim() || `Col ${idx}`;
      gridColumns.push({
        id: `bc14-col-${idx}`,
        caption,
        normalizedCaption: caption.toLowerCase().trim(),
        order: idx
      });
    });

    const actions: ActionModel[] = [];
    document.querySelectorAll('.ms-nav-actionbar button, .ms-nav-ribbon button').forEach((btn, idx) => {
      const caption = btn.textContent?.trim() || `Action ${idx}`;
      actions.push({
        id: `bc14-act-${idx}`,
        caption,
        normalizedCaption: caption.toLowerCase().trim(),
        category: 'Actions',
        enabled: !btn.hasAttribute('disabled')
      });
    });

    const factBoxes: FactBoxModel[] = [];
    document.querySelectorAll('.ms-nav-factbox').forEach((fb, idx) => {
      const title = fb.querySelector('.ms-nav-factboxtitle')?.textContent?.trim() || `FactBox ${idx}`;
      const summary = fb.textContent?.trim() || '';
      factBoxes.push({ id: `bc14-fb-${idx}`, title, summary });
    });

    return {
      pageId,
      caption,
      normalizedCaption: caption.toLowerCase().trim(),
      pageType: this.detectPageType(url),
      url,
      version: 'BC14',
      fastTabs,
      gridColumns,
      actions,
      factBoxes,
      filterPanePresent: !!document.querySelector('.ms-nav-filterpane'),
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