// Mobile burger menu
const burger = document.getElementById('burger');
const navLinks = document.getElementById('nav-links');

burger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close menu when a link is clicked (excluding dropdown toggles)
navLinks.querySelectorAll('a:not(.dropdown-toggle)').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
  });
});

// Mobile dropdown toggle
document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
  toggle.addEventListener('click', (e) => {
    if (window.innerWidth <= 540) {
      e.preventDefault();
      toggle.closest('.dropdown').classList.toggle('open');
    }
  });
});


// Scroll-in animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.card, .schedule-card, .news-card, .stat, .about-text, .about-stats, .contact-item'
).forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// Contact form
const SUPABASE_URL = "https://wayejkvegiumtwhkzezc.supabase.co";

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const success = document.getElementById('form-success');

  btn.disabled = true;
  btn.textContent = 'Sender...';

  const turnstileToken = form.querySelector('[name="cf-turnstile-response"]')?.value;
  if (!turnstileToken) {
    alert('Vennligst fullfør sikkerhetskontrollen.');
    btn.disabled = false;
    btn.textContent = 'Send melding';
    return;
  }

  const data = {
    navn: form.navn.value.trim(),
    epost: form.epost.value.trim(),
    melding: form.melding.value.trim(),
    turnstileToken,
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error ?? 'Noe gikk galt. Prøv igjen.');
      return;
    }

    success.style.display = 'block';
    form.reset();
    setTimeout(() => { success.style.display = 'none'; }, 5000);

  } catch {
    alert('Kunne ikke sende meldingen. Sjekk internettforbindelsen din.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send melding';
  }
}
