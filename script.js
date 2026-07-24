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

document.querySelectorAll('#experiencia .info-link').forEach((link) => {
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
});

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
  const actionQueue = [];
  const carouselWindow = track.parentElement;

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

  const getVisibleCards = () => {
    if (!carouselWindow) return [];

    const windowRect = carouselWindow.getBoundingClientRect();
    const minVisibleWidth = 48;

    return Array.from(track.querySelectorAll('.skill-card')).filter((card) => {
      const rect = card.getBoundingClientRect();
      const visibleWidth = Math.min(rect.right, windowRect.right) - Math.max(rect.left, windowRect.left);
      return visibleWidth >= minVisibleWidth;
    });
  };

  const getPrincipalCard = () => {
    if (!carouselWindow) return null;

    const visibleCards = getVisibleCards();
    if (!visibleCards.length) return null;

    const centerX = carouselWindow.getBoundingClientRect().left + (carouselWindow.clientWidth / 2);
    return visibleCards.reduce((closest, card) => {
      if (!closest) return card;

      const cardCenter = card.getBoundingClientRect().left + (card.clientWidth / 2);
      const closestCenter = closest.getBoundingClientRect().left + (closest.clientWidth / 2);
      const cardDistance = Math.abs(cardCenter - centerX);
      const closestDistance = Math.abs(closestCenter - centerX);
      return cardDistance < closestDistance ? card : closest;
    }, null);
  };

  const setPrincipalExpanded = () => {
    const principalCard = getPrincipalCard();
    if (principalCard) {
      expandCard(principalCard);
    }
  };

  const processQueue = () => {
    if (isAnimating || !actionQueue.length) return;
    const nextAction = actionQueue.shift();
    if (typeof nextAction === 'function') {
      nextAction();
    }
  };

  const enqueueAction = (action) => {
    actionQueue.push(action);
    processQueue();
  };

  const rotateNext = (onComplete) => {
    if (isAnimating) return;

    const step = getStepSize();
    if (!step) {
      if (typeof onComplete === 'function') {
        onComplete();
      }
      processQueue();
      return;
    }

    const firstCard = track.firstElementChild;
    if (!firstCard) {
      if (typeof onComplete === 'function') {
        onComplete();
      }
      processQueue();
      return;
    }

    if (prefersReducedMotion) {
      track.appendChild(firstCard);
      if (typeof onComplete === 'function') {
        onComplete();
      }
      processQueue();
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

      if (typeof onComplete === 'function') {
        onComplete();
      }

      processQueue();
    };

    track.addEventListener('transitionend', handleEnd);
  };

  const rotatePrev = (onComplete) => {
    if (isAnimating) return;

    const step = getStepSize();
    if (!step) {
      if (typeof onComplete === 'function') {
        onComplete();
      }
      processQueue();
      return;
    }

    const lastCard = track.lastElementChild;
    if (!lastCard) {
      if (typeof onComplete === 'function') {
        onComplete();
      }
      processQueue();
      return;
    }

    if (prefersReducedMotion) {
      track.insertBefore(lastCard, track.firstElementChild);
      if (typeof onComplete === 'function') {
        onComplete();
      }
      processQueue();
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

      if (typeof onComplete === 'function') {
        onComplete();
      }

      processQueue();
    };

    track.addEventListener('transitionend', handleEnd);
  };

  if (buttons.length) {
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const direction = button.dataset.direction === 'next' ? 1 : -1;
        enqueueAction(() => {
          if (direction === 1) {
            rotateNext(setPrincipalExpanded);
          } else {
            rotatePrev(setPrincipalExpanded);
          }
        });
      });
    });
  }

  track.addEventListener('click', (event) => {
    const targetCard = event.target.closest('.skill-card');
    if (!targetCard || !track.contains(targetCard)) return;

    const principalCard = getPrincipalCard();
    if (!principalCard) return;

    if (principalCard === targetCard) {
      enqueueAction(() => {
        expandCard(targetCard);
        processQueue();
      });
      return;
    }

    const principalCenter = principalCard.getBoundingClientRect().left + (principalCard.clientWidth / 2);
    const targetCenter = targetCard.getBoundingClientRect().left + (targetCard.clientWidth / 2);
    const direction = targetCenter > principalCenter ? 1 : -1;

    enqueueAction(() => {
      if (direction === 1) {
        rotateNext(setPrincipalExpanded);
      } else {
        rotatePrev(setPrincipalExpanded);
      }
    });
  });

  track.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const targetCard = event.target.closest('.skill-card');
    if (!targetCard || !track.contains(targetCard)) return;

    const principalCard = getPrincipalCard();
    if (!principalCard) return;

    event.preventDefault();

    if (principalCard === targetCard) {
      enqueueAction(() => {
        expandCard(targetCard);
        processQueue();
      });
      return;
    }

    const principalCenter = principalCard.getBoundingClientRect().left + (principalCard.clientWidth / 2);
    const targetCenter = targetCard.getBoundingClientRect().left + (targetCard.clientWidth / 2);
    const direction = targetCenter > principalCenter ? 1 : -1;

    enqueueAction(() => {
      if (direction === 1) {
        rotateNext(setPrincipalExpanded);
      } else {
        rotatePrev(setPrincipalExpanded);
      }
    });
  });

  window.addEventListener('resize', () => {
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    setPrincipalExpanded();
  });

  setPrincipalExpanded();
}
