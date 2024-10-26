import { generateSW } from 'workbox-build';

generateSW({
  swDest: 'dist/sw.js',
  globDirectory: 'dist',
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/api\//]
}).then(({ count, size, warnings }) => {
  if (warnings.length > 0) {
    console.warn('Warnings encountered while generating a service worker:', warnings.join('\n'));
  }
  console.log(
    `Generated a service worker, which will precache ${count} files, totaling ${size} bytes.`
  );
});
