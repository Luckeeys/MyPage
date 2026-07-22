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
let currentIndex = 0;
let skillCardList = [];
let cards = [];
let originalCardCount = 0;
let cloneOffset = 0;
let isTransitioning = false;

const getVisibleCards = () => {
  const width = window.innerWidth;
  if (width < 760) return 1;
  if (width < 1024) return 2;
  return 3;
};

const clearSelectedCard = () => {
  skillCardList.forEach((item) => {
    item.classList.remove('is-expanded', 'is-hovered');
    item.setAttribute('aria-expanded', 'false');
  });
};

const getFocusedCardIndex = () => {
  const visibleCards = getVisibleCards();
  const centerOffset = Math.max(0, Math.floor(visibleCards / 2));
  return currentIndex + centerOffset;
};

const updateExpandedCard = () => {
  if (!skillCardList.length) return;

  clearSelectedCard();
  const focusedIndex = getFocusedCardIndex();
  const card = cards[focusedIndex];

  if (!card) return;

  card.classList.add('is-expanded', 'is-hovered');
  card.setAttribute('aria-expanded', 'true');
};

const setTrackTransition = (enabled) => {
  if (!track) return;
  track.style.transition = enabled ? 'transform 0.35s ease' : 'none';
};

const getCarouselOffset = () => {
  const visibleCards = getVisibleCards();
  const cardWidth = cards[0].offsetWidth + 16;
  const visibleWidth = visibleCards * cardWidth - 16;
  const containerWidth = track.parentElement.clientWidth;
  const baseOffset = currentIndex * cardWidth;
  const centerAdjust = Math.max(0, (containerWidth - visibleWidth) / 2);
  return baseOffset - centerAdjust;
};

const updateCarousel = () => {
  if (!track || !cards.length) return;

  const offset = getCarouselOffset();
  track.style.transform = `translateX(-${offset}px)`;
  updateExpandedCard();
};

const resetCarouselWithoutAnimation = () => {
  if (!track || !cards.length) return;

  setTrackTransition(false);
  const offset = getCarouselOffset();
  track.style.transform = `translateX(-${offset}px)`;
  updateExpandedCard();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => setTrackTransition(true));
  });
};

const moveCarouselToCard = (index) => {
  if (!originalCardCount) return;

  const visibleCards = getVisibleCards();
  const centerOffset = Math.max(0, Math.floor(visibleCards / 2));
  const maxIndex = Math.max(0, cards.length - visibleCards);
  currentIndex = Math.max(0, Math.min(index + cloneOffset - centerOffset, maxIndex));
  updateCarousel();
};

const attachCardBehavior = (card, originalIndex) => {
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-expanded', 'false');
  card.dataset.originalIndex = originalIndex;
  card.dataset.expandedSide = originalIndex < Math.floor(originalCardCount / 2) ? 'left' : 'right';

  const handleCardSelection = () => {
    moveCarouselToCard(originalIndex);
  };

  card.addEventListener('mouseenter', () => {
    if (!card.classList.contains('is-expanded')) {
      card.classList.add('is-hovered');
    }
  });

  card.addEventListener('mouseleave', () => {
    if (!card.classList.contains('is-expanded')) {
      card.classList.remove('is-hovered');
    }
  });

  card.addEventListener('focus', () => {
    if (!card.classList.contains('is-expanded')) {
      card.classList.add('is-hovered');
    }
  });

  card.addEventListener('blur', () => {
    if (!card.classList.contains('is-expanded')) {
      card.classList.remove('is-hovered');
    }
  });

  card.addEventListener('click', handleCardSelection);

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardSelection();
    }
  });
};

if (track) {
  const originalCards = Array.from(track.querySelectorAll('.skill-card'));
  originalCardCount = originalCards.length;

  const visibleCards = getVisibleCards();
  const clones = visibleCards;
  cloneOffset = clones;

  originalCards.forEach((card, index) => {
    card.dataset.originalIndex = index;
    card.dataset.isClone = 'false';
  });

  originalCards.slice(-clones).forEach((card, index) => {
    const clone = card.cloneNode(true);
    clone.dataset.originalIndex = originalCardCount - clones + index;
    clone.dataset.isClone = 'true';
    track.insertBefore(clone, track.firstChild);
  });

  originalCards.slice(0, clones).forEach((card, index) => {
    const clone = card.cloneNode(true);
    clone.dataset.originalIndex = index;
    clone.dataset.isClone = 'true';
    track.appendChild(clone);
  });

  skillCardList = Array.from(track.querySelectorAll('.skill-card'));
  cards = Array.from(track.children);

  skillCardList.forEach((card) => {
    const originalIndex = Number(card.dataset.originalIndex ?? 0);
    attachCardBehavior(card, originalIndex);
  });

  currentIndex = clones;

  track.addEventListener('transitionend', (event) => {
    if (event.propertyName !== 'transform') return;

    isTransitioning = false;
    if (currentIndex >= originalCardCount + clones) {
      currentIndex = clones;
      resetCarouselWithoutAnimation();
    } else if (currentIndex <= 0) {
      currentIndex = originalCardCount;
      resetCarouselWithoutAnimation();
    }
  });

  if (buttons.length) {
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        if (isTransitioning) return;
        isTransitioning = true;

        const direction = button.dataset.direction === 'next' ? 1 : -1;
        currentIndex += direction;
        updateCarousel();
      });
    });
  }

  window.addEventListener('resize', updateCarousel);
  updateCarousel();
}
