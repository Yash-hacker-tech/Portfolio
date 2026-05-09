document.addEventListener('DOMContentLoaded', () => {
  const THEME_KEY = 'portfolio_theme_v1';

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.textContent = isDark ? 'Light mode' : 'Dark mode';
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  const savedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(savedTheme === 'dark' ? 'dark' : 'light');

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  });

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