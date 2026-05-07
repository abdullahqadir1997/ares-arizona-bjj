/* =========================================================
   ARES ARIZONA BJJ — Shared Site JS
   ========================================================= */

(function() {
  'use strict';

  // ---------- Mobile nav toggle ----------
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });
  }

  // ---------- Dropdown management ----------
  // Desktop : hover opens, outside-click closes (no mouseleave close — prevents
  //           dropdown shutting during scroll or diagonal mouse movement).
  // Mobile  : click toggles open/close.

  function closeAllDropdowns(except) {
    document.querySelectorAll('.has-dropdown.is-open').forEach(function(other) {
      if (other !== except) other.classList.remove('is-open');
    });
  }

  document.querySelectorAll('.has-dropdown').forEach(function(li) {
    var btn = li.querySelector('.dropdown-toggle');

    // Desktop — open on mouseenter, switch to another on sibling hover
    li.addEventListener('mouseenter', function() {
      if (window.innerWidth <= 1024) return;
      closeAllDropdowns(li);
      li.classList.add('is-open');
    });

    // Mobile — click toggle
    if (btn) {
      btn.addEventListener('click', function(e) {
        if (window.innerWidth > 1024) return;
        e.preventDefault();
        e.stopPropagation();
        var isOpening = !li.classList.contains('is-open');
        closeAllDropdowns(li);
        li.classList.toggle('is-open', isOpening);
      });
    }
  });

  // Close on outside click (desktop + mobile)
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.has-dropdown')) {
      closeAllDropdowns(null);
    }
  });

  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeAllDropdowns(null);
  });

  // ---------- Sticky nav shadow ----------
  const nav = document.querySelector('.nav');
  if (nav) {
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
      const scroll = window.scrollY;
      if (scroll > 30) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
      lastScroll = scroll;
    }, { passive: true });
  }

  // ---------- Trial modal open/close ----------
  const modal = document.getElementById('trial-modal');
  const modalClose = modal ? modal.querySelector('.modal-close') : null;

  function openTrialModal() {
    if (!modal) return;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function() {
      const firstField = modal.querySelector('input, select, textarea');
      if (firstField) firstField.focus();
    }, 300);
  }
  function closeTrialModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-open-trial]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      openTrialModal();
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeTrialModal);
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeTrialModal();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeTrialModal();
    });
  }

  // ---------- Form handling — trial redirects to booking page; contact stays inline ----------
  function handleForm(form, successMessage) {
    if (!form) return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const submit = form.querySelector('[type="submit"]');
      const original = submit.innerHTML;
      submit.innerHTML = '<span>Sending...</span>';
      submit.disabled = true;

      setTimeout(function() {
        showToast(successMessage || 'Thanks — we\'ll be in touch shortly!');
        form.reset();
        submit.innerHTML = original;
        submit.disabled = false;
        if (form.closest('.modal')) closeTrialModal();
      }, 900);
    });
  }

  // Trial form: route to booking page with the right calendar pre-selected
  const trialForm = document.getElementById('trial-form');
  if (trialForm) {
    trialForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const submit = trialForm.querySelector('[type="submit"]');
      const original = submit.innerHTML;
      submit.innerHTML = '<span>Taking you to the calendar...</span>';
      submit.disabled = true;

      const program = (trialForm.querySelector('[name="program"]') || {}).value || '';
      const isKids = /kids/i.test(program);
      // Query param drives tab activation, #book hash drives native browser scroll
      const target = isKids ? 'booking.html?p=kids#book' : 'booking.html?p=adult#book';

      setTimeout(function() {
        window.location.href = target;
      }, 400);
    });
  }

  handleForm(document.getElementById('contact-form'), 'Thanks for reaching out — Coach Paul or Leslie will get back to you soon.');

  // ---------- Booking page tabs + prefill flow ----------
  const bookingTabs = document.querySelectorAll('.booking-tab');
  if (bookingTabs.length) {
    const PROGRAM_LABELS = { adult: 'Adult Jiu-Jitsu', kids: 'Kids Jiu-Jitsu' };

    function activateBookingTab(tabKey) {
      bookingTabs.forEach(function(tab) {
        const isActive = tab.dataset.tab === tabKey;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive);
      });
      document.querySelectorAll('.booking-panel').forEach(function(panel) {
        const isActive = panel.id === ('cal-' + tabKey);
        panel.classList.toggle('is-active', isActive);
        if (isActive) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
      });
      // Update the prefill banner program label whenever the active tab changes
      const labelEl = document.getElementById('booking-selected-program');
      if (labelEl && PROGRAM_LABELS[tabKey]) {
        labelEl.textContent = PROGRAM_LABELS[tabKey];
      }
      // Update the "switch program" link to point at the other one
      const switchEl = document.getElementById('booking-switch-link');
      if (switchEl) {
        const other = tabKey === 'kids' ? 'adult' : 'kids';
        const otherLabel = PROGRAM_LABELS[other];
        switchEl.textContent = 'Switch to ' + otherLabel + ' →';
        switchEl.dataset.target = other;
      }
    }

    bookingTabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        const key = tab.dataset.tab;
        activateBookingTab(key);
        history.replaceState(null, '', '#' + key);
      });
    });

    // Switch-program link inside the prefill pill — keeps user on page, just swaps the tab
    const switchLink = document.getElementById('booking-switch-link');
    if (switchLink) {
      switchLink.addEventListener('click', function(e) {
        e.preventDefault();
        const target = switchLink.dataset.target || 'kids';
        activateBookingTab(target);
        // Update URL but don't trigger another scroll
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('p', target);
          url.hash = 'book';
          history.replaceState(null, '', url.toString());
        } catch(err) {}
      });
    }

    // Determine which program is preselected.
    // Priority: ?p= query param  >  legacy #adult / #kids hash
    let initial = '';
    try {
      const params = new URLSearchParams(window.location.search);
      const p = (params.get('p') || '').toLowerCase();
      if (p === 'adult' || p === 'kids') initial = p;
    } catch(err) {}
    if (!initial) {
      const hash = (window.location.hash || '').replace('#', '');
      if (hash === 'adult' || hash === 'kids') initial = hash;
    }

    if (initial === 'kids' || initial === 'adult') {
      activateBookingTab(initial);
      document.body.classList.add('is-booking-prefilled');
      // The browser already handled the native scroll to #book before paint —
      // no JS scrolling needed. We just need to re-anchor for any browsers that
      // didn't get it (e.g. when ?p= is used without #book).
      if (!window.location.hash) {
        const anchor = document.getElementById('book');
        if (anchor) {
          // Instant scroll, no animation
          const navHeight = (document.querySelector('.nav') || {}).offsetHeight || 80;
          window.scrollTo(0, anchor.getBoundingClientRect().top + window.scrollY - navHeight - 8);
        }
      }
    }
  }

  // ---------- Toast ----------
  let toastEl = document.querySelector('.toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    document.body.appendChild(toastEl);
  }
  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('is-visible');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function() {
      toastEl.classList.remove('is-visible');
    }, 4500);
  }

  // ---------- Scroll reveals ----------
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.reveal, .reveal-stagger').forEach(function(el) {
      io.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(function(el) {
      el.classList.add('is-visible');
    });
  }

  // ---------- Animated counters ----------
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    const counterIO = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('[data-count]').forEach(function(el) {
      counterIO.observe(el);
    });
  }

  // ---------- Reviews carousel ----------
  document.querySelectorAll('[data-reviews-carousel]').forEach(function(carousel) {
    const track = carousel.querySelector('.reviews-carousel-track');
    const cards = Array.from(carousel.querySelectorAll('.review-card'));
    const prevBtn = carousel.querySelector('.rc-prev');
    const nextBtn = carousel.querySelector('.rc-next');
    const toggleBtn = carousel.querySelector('.rc-toggle');
    const dots = Array.from(carousel.querySelectorAll('.rc-dot'));
    if (!track || cards.length === 0) return;

    const AUTO_INTERVAL = 6000; // 6 seconds per slide
    let index = 0;
    let timer = null;
    let isPlaying = true;

    function visibleCount() {
      const w = window.innerWidth;
      if (w <= 700) return 1;
      if (w <= 1024) return 2;
      return 3;
    }
    function maxIndex() {
      return Math.max(0, cards.length - visibleCount());
    }
    function update() {
      // Clamp index
      if (index < 0) index = maxIndex();
      if (index > maxIndex()) index = 0;
      // Calculate offset based on first card's actual offsetLeft
      const card = cards[0];
      if (!card) return;
      const cardRect = card.getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(track).gap) || 24;
      const offset = (cardRect.width + gap) * index;
      track.style.transform = 'translateX(-' + offset + 'px)';
      // Update dots — highlight the dot for the leftmost visible card
      dots.forEach(function(dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }
    function next() { index = index + 1; update(); }
    function prev() { index = index - 1; update(); }
    function goTo(i) { index = i; update(); }

    function startAuto() {
      stopAuto();
      timer = setInterval(next, AUTO_INTERVAL);
      isPlaying = true;
      if (toggleBtn) {
        toggleBtn.dataset.state = 'playing';
        toggleBtn.setAttribute('aria-label', 'Pause auto-play');
      }
    }
    function stopAuto() {
      if (timer) { clearInterval(timer); timer = null; }
      isPlaying = false;
      if (toggleBtn) {
        toggleBtn.dataset.state = 'paused';
        toggleBtn.setAttribute('aria-label', 'Play auto-play');
      }
    }

    // Wire controls
    if (prevBtn) prevBtn.addEventListener('click', function() { prev(); restartIfPlaying(); });
    if (nextBtn) nextBtn.addEventListener('click', function() { next(); restartIfPlaying(); });
    if (toggleBtn) toggleBtn.addEventListener('click', function() {
      if (isPlaying) stopAuto(); else startAuto();
    });
    dots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        const i = parseInt(dot.dataset.index, 10);
        if (!isNaN(i)) { goTo(i); restartIfPlaying(); }
      });
    });

    function restartIfPlaying() {
      if (isPlaying) startAuto();
    }

    // Pause on hover, resume on leave (only if user hasn't manually paused)
    let hoverPaused = false;
    carousel.addEventListener('mouseenter', function() {
      if (isPlaying && timer) {
        clearInterval(timer); timer = null;
        hoverPaused = true;
      }
    });
    carousel.addEventListener('mouseleave', function() {
      if (hoverPaused && isPlaying) {
        timer = setInterval(next, AUTO_INTERVAL);
        hoverPaused = false;
      }
    });

    // Pause when tab is hidden
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) { if (timer) { clearInterval(timer); timer = null; } }
      else if (isPlaying && !timer) { timer = setInterval(next, AUTO_INTERVAL); }
    });

    // Reset position on resize so layout stays correct
    let resizeTimer = null;
    window.addEventListener('resize', function() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() { update(); }, 150);
    });

    // Keyboard support
    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft')      { prev(); restartIfPlaying(); }
      else if (e.key === 'ArrowRight') { next(); restartIfPlaying(); }
      else if (e.key === ' ' || e.key === 'Enter') {
        if (e.target.tagName !== 'BUTTON') {
          e.preventDefault();
          if (isPlaying) stopAuto(); else startAuto();
        }
      }
    });

    // Honor reduced-motion
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Init
    update();
    if (!prefersReduced) startAuto();
    else stopAuto();
  });

  // ---------- Year ----------
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
