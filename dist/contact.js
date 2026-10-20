import { contactConfig } from './contact-config.js';

export function normalizeWhatsAppNumber(value) {
  const number = String(value ?? '').trim().replace(/[\s()+.-]/g, '');
  if (!/^[1-9]\d{7,14}$/.test(number)) {
    throw new Error('WhatsApp requires a full international phone number.');
  }
  return number;
}

export function buildWhatsAppUrl(number, request, pageUrl) {
  const url = new URL('https://wa.me/' + normalizeWhatsAppNumber(number));
  const page = new URL(pageUrl);
  page.search = '';
  page.hash = '';
  const message = `Halo ${contactConfig.creator}, saya melihat website SIENNA dan ingin meminta ${request}.\n\nReferensi: ${page.href}\nTerima kasih.`;
  url.searchParams.set('text', message);
  return url.href;
}

export function syncDialogScroll() {
  document.body.style.overflow = document.querySelector('dialog[open]') ? 'hidden' : '';
}

export function getContactWhatsAppUrl(config, request, pageUrl) {
  if (config.placeholder) return null;
  return buildWhatsAppUrl(config.whatsappNumber, request, pageUrl);
}

export function initContact() {
  const dialog = document.querySelector('#contact-dialog');
  const link = document.querySelector('#contact-whatsapp');
  const unavailable = document.querySelector('#contact-unavailable');
  let lastTrigger;

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-download-request]');
    if (!trigger) return;
    event.preventDefault();
    lastTrigger = trigger;
    const request = trigger.dataset.downloadRequest || 'seluruh file proyek SIENNA';
    document.querySelector('#contact-request').textContent = request;
    try {
      const href = getContactWhatsAppUrl(contactConfig, request, location.href);
      if (!href) throw new Error('Demo contact is not a live WhatsApp destination.');
      link.href = href;
      link.removeAttribute('aria-disabled');
      link.removeAttribute('tabindex');
      unavailable.hidden = true;
    } catch {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('tabindex', '-1');
      unavailable.hidden = false;
    }
    unavailable.textContent = contactConfig.placeholder
      ? `Mode demo — nomor contoh +${contactConfig.whatsappNumber} belum aktif. Chat tersedia setelah nomor Muhammad Rizky ditambahkan.`
      : 'Nomor WhatsApp belum dikonfigurasi. Tautan chat akan tersedia setelah kontak kreator ditambahkan.';
    document.querySelector('#contact-note').textContent = contactConfig.placeholder
      ? 'Ini pratinjau fitur kontak. Tidak ada pesan yang dikirim atau nomor acak yang dihubungi.'
      : 'Pesan permintaan disiapkan otomatis. Kamu tetap menekan Kirim di WhatsApp.';
    if (!dialog.open) dialog.showModal();
    syncDialogScroll();
    (link.hasAttribute('href') ? link : document.querySelector('#close-contact')).focus({ preventScroll: true });
  });

  document.querySelector('#close-contact').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    syncDialogScroll();
    if (lastTrigger?.isConnected) lastTrigger.focus({ preventScroll: true });
  });
}
