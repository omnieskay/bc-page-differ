export class Normalizer {
  private aliasMap: Record<string, string>;
  private ignoreList: string[];

  constructor(aliasMap: Record<string, string> = {}, ignoreList: string[] = []) {
    this.aliasMap = aliasMap;
    this.ignoreList = ignoreList.map(i => i.toLowerCase());
  }

  public normalizeCaption(caption: string): string {
    if (!caption) return '';
    let cleaned = caption
      .toLowerCase()
      .replace(/[:*]/g, '')
      .trim();

    if (this.aliasMap[cleaned]) {
      cleaned = this.aliasMap[cleaned].toLowerCase();
    }
    return cleaned;
  }

  public shouldIgnore(caption: string): boolean {
    const norm = this.normalizeCaption(caption);
    return this.ignoreList.includes(norm);
  }

  public levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  public similarity(a: string, b: string): number {
    const distance = this.levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 1.0;
    return (maxLength - distance) / maxLength;
  }
}