export type BCVersion = 'BC14' | 'BC28' | 'AUTO';

export type PageType = 'List' | 'Card' | 'Document' | 'Worksheet' | 'RoleCenter' | 'StandardDialog' | 'Unknown';

export type DifferenceCategory = 'Field' | 'Column' | 'Action' | 'FastTab' | 'FactBox' | 'Metadata';

export type Severity = 'info' | 'warn' | 'critical';

export interface FieldModel {
  id: string;
  caption: string;
  normalizedCaption: string;
  controlType: 'text' | 'option' | 'boolean' | 'date' | 'lookup' | 'drilldown' | 'numeric' | 'unknown';
  editable: boolean;
  visible: boolean;
  mandatory: boolean;
  tooltip?: string;
  value?: string;
  fastTabName?: string;
}

export interface ColumnModel {
  id: string;
  caption: string;
  normalizedCaption: string;
  order: number;
  sampleValues?: string[];
}

export interface ActionModel {
  id: string;
  caption: string;
  normalizedCaption: string;
  category: 'Navigate' | 'Actions' | 'Reports' | 'Related' | 'Other';
  group?: string;
  enabled: boolean;
  nestedActions?: ActionModel[];
}

export interface FastTabModel {
  id: string;
  name: string;
  normalizedName: string;
  expanded: boolean;
  order: number;
  fields: FieldModel[];
}

export interface FactBoxModel {
  id: string;
  title: string;
  summary: string;
}

export interface PageModel {
  pageId: string;
  caption: string;
  normalizedCaption: string;
  pageType: PageType;
  sourceTable?: string;
  url: string;
  version: BCVersion;
  fastTabs: FastTabModel[];
  gridColumns: ColumnModel[];
  actions: ActionModel[];
  factBoxes: FactBoxModel[];
  filterPanePresent: boolean;
  timestamp: number;
}

export interface Difference {
  id: string;
  category: DifferenceCategory;
  type: 'added' | 'removed' | 'renamed' | 'moved' | 'property_changed' | 'value_changed';
  severity: Severity;
  locationPath: string;
  elementName: string;
  valueA?: any;
  valueB?: any;
  description: string;
}

export interface PageDiffResult {
  pageId: string;
  captionA: string;
  captionB: string;
  differences: Difference[];
  summary: {
    added: number;
    removed: number;
    changed: number;
    criticalCount: number;
  };
}

export interface TabPairing {
  tabIdA?: number;
  urlA?: string;
  tabIdB?: number;
  urlB?: string;
}

export interface CrawlJob {
  id: string;
  pageIds: string[];
  currentIndex: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';
  delayMs: number;
  results: PageDiffResult[];
}

export interface Settings {
  hostPatterns: string[];
  fuzzyThreshold: number;
  compareValues: boolean;
  autoExpandFastTabs: boolean;
  languageA: string;
  languageB: string;
  aliasMap: Record<string, string>;
  ignoreList: string[];
}