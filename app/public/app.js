// Tiny client helper: live price preview for the booking form.
// Everything is re-validated and re-priced on the server — this is only a preview.

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const form = document.querySelector('[data-quote-form]');
const box = document.getElementById('quote');

if (form && box) {
  const slug = box.dataset.slug;

  const update = async () => {
    const fd = new FormData(form);
    const params = new URLSearchParams({
      slug,
      option: fd.get('optionId') || '',
      adults: fd.get('adults') || '1',
      children: fd.get('children') || '0',
      extras: fd.getAll('extraIds').join(','),
    });

    try {
      const res = await fetch(`/api/quote?${params.toString()}`);
      const data = await res.json();
      if (!data.ok) {
        box.innerHTML = `<h3>Your price</h3><p class="muted">${esc(data.error || 'Enter your details')}</p>`;
        return;
      }
      box.innerHTML = `<h3>Your price</h3>
        <ul class="quote-lines">
          ${data.lines.map((l) => `<li><span>${esc(l.label)}</span><span>${esc(l.amount)}</span></li>`).join('')}
        </ul>
        <p class="quote-total"><span>Total</span><strong>${esc(data.total)}</strong></p>
        <p class="muted small">Deposit ${esc(data.deposit)} · Balance ${esc(data.balance)}</p>`;
    } catch {
      box.innerHTML = '<h3>Your price</h3><p class="muted">Could not update the price.</p>';
    }
  };

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();
}
