// Export original generated artwork at platform sizes. Requires ffmpeg and rsvg-convert.
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'sort-roll-brand-'));
const dir = 'assets/branding';
function png(source, output, width, height, opaque = false) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  execFileSync('ffmpeg', [
    '-loglevel',
    'error',
    '-y',
    '-i',
    source,
    '-vf',
    `scale=${width}:${height}:flags=lanczos`,
    '-pix_fmt',
    opaque ? 'rgb24' : 'rgba',
    output,
  ]);
}
const art = `data:image/png;base64,${fs.readFileSync(`${dir}/source/bottle-mark-master.png`).toString('base64')}`;
function svg(name, w, h, body) {
  const file = path.join(scratch, `${name}.svg`);
  fs.writeFileSync(
    file,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`,
  );
  execFileSync('rsvg-convert', ['-o', `${dir}/${name}.png`, file]);
}
const image = (x, y, w, h) =>
  `<image x="${x}" y="${y}" width="${w}" height="${h}" xlink:href="${art}"/>`;
png(`${dir}/source/app-icon-master.png`, `${dir}/app-icon-1024.png`, 1024, 1024, true);
png(`${dir}/source/bottle-mark-master.png`, `${dir}/bottle-mark.png`, 640, 640);
svg('android-foreground', 1024, 1024, image(144, 144, 736, 736));
svg(
  'android-monochrome',
  1024,
  1024,
  `<g fill="white"><path d="M310 420h90v70l42 50v215q0 35-35 35H293q-35 0-35-35V540l52-50z"/><path d="M495 470h95v70l43 50v220q0 35-35 35H478q-35 0-35-35V590l52-50z"/><g transform="rotate(55 640 330)"><path d="M602 200h76v55l40 42v160q0 25-25 25H589q-25 0-25-25V297l38-42z"/></g><path d="M548 385q-30 30-20 90" fill="none" stroke="white" stroke-width="24" stroke-linecap="round"/></g>`,
);
for (const [variant, ink] of [
  ['dark', '#f3edff'],
  ['light', '#574363'],
]) {
  svg(
    `splash-${variant}`,
    1200,
    1000,
    image(280, 45, 640, 640) +
      `<text x="600" y="800" fill="${ink}" text-anchor="middle" font-family="Arial Rounded MT Bold,Arial,sans-serif" font-weight="900" font-size="100" letter-spacing="-3">Sort and Roll</text>`,
  );
  svg(
    `logo-${variant}`,
    1200,
    320,
    image(0, 0, 320, 320) +
      `<text x="345" y="205" fill="${ink}" font-family="Arial Rounded MT Bold,Arial,sans-serif" font-weight="900" font-size="103" letter-spacing="-3">Sort and Roll</text>`,
  );
}
png(`${dir}/source/app-icon-master.png`, `${dir}/favicon.png`, 96, 96, true);
png(`${dir}/source/app-icon-master.png`, 'assets/store/android/app-icon-512.png', 512, 512, true);

png(
  `${dir}/source/feature-graphic-master.png`,
  'assets/store/android/feature-graphic-1024x500.png',
  1024,
  500,
  true,
);
fs.rmSync(scratch, { recursive: true, force: true });
console.log('Branding and store graphics exported.');
