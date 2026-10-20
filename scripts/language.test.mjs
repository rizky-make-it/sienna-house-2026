import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = file => readFile(new URL('../' + file, import.meta.url), 'utf8');
// Regression guard for the previous Indonesian copy, including non-visible states.
const legacyCopy = /\b(?:tembok|pameran|silakan|belum|memuat|pilih|buka|tutup|unduh|minta|semua|dibuat|oleh|lebar|kedalaman|tinggi|geser|untuk|referensi|katalog|sumber|lisensi|beranda|halaman|nomor|dikirim|pesan|kreator|seluruh|yang|dengan|tidak|kembali|jelajah|inspeksi|visualisasi)\b/i;

for (const file of ['index.html', 'credits.html', 'app.js', 'tour.js', 'touch-controls.js', 'contact.js', 'downloads/README.txt']) {
  test(`${file} contains no legacy Indonesian interface copy`, async () => {
    assert.doesNotMatch(await read('dist/' + file), legacyCopy);
  });
}

test('both pages declare English and retain creator credits', async () => {
  for (const file of ['index.html', 'credits.html']) {
    const html = await read('dist/' + file);
    assert.match(html, /<html lang="en">/);
    assert.match(html, /<strong>Muhammad Rizky<\/strong>/);
  }
});

test('English controls, accessible labels, and all-file requests are present', async () => {
  const html = await read('dist/index.html');
  for (const text of ['Skip to content', 'Main navigation', 'Search by name or SKU',
    'Start exhibition tour', 'Controls guide', 'Inspect in 3D', 'Open drawers / doors',
    'Close WhatsApp contact', 'Request all files', 'REQUESTED FILES', 'Sources & licences']) {
    assert.ok(html.includes(text), `Missing English copy: ${text}`);
  }
  assert.match(html, /data-download-request="the complete SIENNA project:/);
});

test('translated entry point and dependent modules bypass stale cached copy', async () => {
  assert.match(await read('dist/index.html'), /app\.js\?v=rizky-profile-1/);
  const app = await read('dist/app.js');
  assert.match(app, /tour\.js\?v=mobile-nav-1/);
  assert.match(app, /contact\.js\?v=rizky-profile-1/);
  assert.match(await read('dist/contact.js'), /contact-config\.js\?v=rizky-profile-1/);
});

test('public project guide matches the English repository guide', async () => {
  assert.equal(await read('dist/downloads/README.txt'), await read('README.md'));
});

test('contact pop-up uses the supplied avatar, English invitation, and public WhatsApp number', async () => {
  const html = await read('dist/index.html');
  assert.ok(html.includes('Want a project like this? Get in touch with me on WhatsApp.'));
  assert.ok(html.includes('src="assets/muhammad-rizky-avatar.jpg"'));
  assert.ok(html.includes('WhatsApp · +62 813-9317-7004'));
  assert.ok(html.includes('Chat with me on WhatsApp'));
  const avatar = await readFile(new URL('../dist/assets/muhammad-rizky-avatar.jpg', import.meta.url));
  assert.equal(avatar.readUInt16BE(0), 0xffd8);
  assert.ok(avatar.length > 0);
});
