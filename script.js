const body = document.body;
const themeToggle = document.getElementById('themeToggle');

const applyTheme = (theme) => {
  const isDark = theme === 'dark';
  body.classList.toggle('theme-dark', isDark);
  body.classList.toggle('theme-light', !isDark);
  if (themeToggle) {
    themeToggle.checked = isDark;
  }
  localStorage.setItem('profile-theme', theme);
};

const savedTheme = localStorage.getItem('profile-theme') || 'light';
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('change', () => {
    const nextTheme = themeToggle.checked ? 'dark' : 'light';
    applyTheme(nextTheme);
  });
}

const revealSections = document.querySelectorAll('.reveal-section');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -20% 0px' });

  revealSections.forEach((section) => revealObserver.observe(section));
} else {
  revealSections.forEach((section) => section.classList.add('is-visible'));
}

const track = document.querySelector('.carousel-track');
const buttons = document.querySelectorAll('.carousel-btn');

if (track) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let isAnimating = false;

  track.style.transition = prefersReducedMotion ? 'none' : 'transform 0.35s ease';

  const getGapSize = () => {
    const computed = getComputedStyle(track);
    return Number.parseFloat(computed.columnGap || computed.gap || '0') || 0;
  };

  const getStepSize = () => {
    const firstCard = track.querySelector('.skill-card');
    if (!firstCard) return 0;
    const gap = getGapSize();
    return firstCard.getBoundingClientRect().width + gap;
  };

  const clearExpandedCards = () => {
    track.querySelectorAll('.skill-card').forEach((card) => {
      card.classList.remove('is-expanded', 'is-hovered');
      card.setAttribute('aria-expanded', 'false');
    });
  };

  const expandCard = (card) => {
    if (!card || !card.classList.contains('skill-card')) return;
    clearExpandedCards();
    card.classList.add('is-expanded', 'is-hovered');
    card.setAttribute('aria-expanded', 'true');
  };

  const rotateNext = () => {
    if (isAnimating) return;

    const step = getStepSize();
    if (!step) return;

    const firstCard = track.firstElementChild;
    if (!firstCard) return;

    if (prefersReducedMotion) {
      track.appendChild(firstCard);
      return;
    }

    isAnimating = true;
    track.style.transition = 'transform 0.35s ease';
    track.style.transform = `translateX(-${step}px)`;

    const handleEnd = (event) => {
      if (event.propertyName !== 'transform') return;

      track.removeEventListener('transitionend', handleEnd);
      track.style.transition = 'none';
      track.appendChild(firstCard);
      track.style.transform = 'translateX(0)';
      isAnimating = false;
    };

    track.addEventListener('transitionend', handleEnd);
  };

  const rotatePrev = () => {
    if (isAnimating) return;

    const step = getStepSize();
    if (!step) return;

    const lastCard = track.lastElementChild;
    if (!lastCard) return;

    if (prefersReducedMotion) {
      track.insertBefore(lastCard, track.firstElementChild);
      return;
    }

    isAnimating = true;
    track.style.transition = 'none';
    track.insertBefore(lastCard, track.firstElementChild);
    track.style.transform = `translateX(-${step}px)`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        track.style.transition = 'transform 0.35s ease';
        track.style.transform = 'translateX(0)';
      });
    });

    const handleEnd = (event) => {
      if (event.propertyName !== 'transform') return;

      track.removeEventListener('transitionend', handleEnd);
      track.style.transition = 'none';
      isAnimating = false;
    };

    track.addEventListener('transitionend', handleEnd);
  };

  if (buttons.length) {
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const direction = button.dataset.direction === 'next' ? 1 : -1;
        if (direction === 1) {
          rotateNext();
        } else {
          rotatePrev();
        }
      });
    });
  }

  track.addEventListener('click', (event) => {
    const targetCard = event.target.closest('.skill-card');
    if (!targetCard || !track.contains(targetCard)) return;
    expandCard(targetCard);
  });

  track.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const targetCard = event.target.closest('.skill-card');
    if (!targetCard || !track.contains(targetCard)) return;

    event.preventDefault();
    expandCard(targetCard);
  });

  window.addEventListener('resize', () => {
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
  });
}
