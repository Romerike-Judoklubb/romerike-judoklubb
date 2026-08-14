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

// Lightbox: click any image with class "lightbox-img" to view it enlarged
document.querySelectorAll('.lightbox-img').forEach(img => {
  img.addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    const big = document.createElement('img');
    big.src = img.src;
    big.alt = img.alt;
    overlay.appendChild(big);
    overlay.addEventListener('click', () => overlay.remove());
    document.addEventListener('keydown', function escClose(e) {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escClose);
      }
    });
    document.body.appendChild(overlay);
  });
});
