// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
const pages = [
  { name: '/', file: 'lh-home.json' },
  { name: '/claim', file: 'lh-claim.json' },
  { name: '/how-it-works', file: 'lh-how.json' },
  { name: '/faq', file: 'lh-faq.json' },
  { name: '/track', file: 'lh-track.json' },
  { name: '/privacy', file: 'lh-privacy.json' },
  { name: '/terms', file: 'lh-terms.json' },
  { name: '/disclaimer', file: 'lh-disclaimer.json' },
];
pages.forEach(p => {
  try {
    const data = JSON.parse(fs.readFileSync(p.file, 'utf8'));
    const cats = data.categories;
    const perf = Math.round(cats.performance.score * 100);
    const a11y = Math.round(cats.accessibility.score * 100);
    const bp = Math.round(cats['best-practices'].score * 100);
    const seo = Math.round(cats.seo.score * 100);
    console.log(p.name + ' => Perf:' + perf + ' A11y:' + a11y + ' BP:' + bp + ' SEO:' + seo);
  } catch(e) {
    console.log(p.name + ' => ERROR: ' + e.message);
  }
});
