import { PageModel } from '../../types';

export interface VersionExtractor {
  extract(): Promise<PageModel>;
}