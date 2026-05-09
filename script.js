document.addEventListener('DOMContentLoaded', () => {
  // Page enter animation
  const body = document.body;
  if (body.classList.contains('page')) {
    requestAnimationFrame(() => {
      body.classList.add('page-enter');
    });
  }

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Mobile navigation
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('nav--open');
      menuToggle.classList.toggle('open');
    });

    // Close nav on link click (mobile)
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('nav--open');
        menuToggle.classList.remove('open');
      });
    });
  }

  // Smooth page transitions for .html links
  const transitionLinks = document.querySelectorAll('a[href$=".html"]:not([target])');
  transitionLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      const url = link.getAttribute('href');
      if (!url) return;

      // If same page anchor like professional.html#about, let browser handle normally
      if (url.startsWith('#')) return;

      event.preventDefault();

      if (body.classList.contains('page')) {
        body.classList.remove('page-enter');
        body.classList.add('page-leave');
      }

      setTimeout(() => {
        window.location.href = url;
      }, 250);
    });
  });
});

// Contact form
function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const status = document.getElementById('formStatus');
  if (status) {
    status.textContent = 'Message sent! I will reply soon.';
  }
  form.reset();
}