import { BC14Extractor } from './extractors/bc14Extractor';
import { BC28Extractor } from './extractors/bc28Extractor';

function runExtractor() {
  const isBC14 = !!document.querySelector('.ms-nav-client') || window.location.href.toLowerCase().includes('bc14');
  const extractor = isBC14 ? new BC14Extractor() : new BC28Extractor();
  return extractor.extract();
}

runExtractor();