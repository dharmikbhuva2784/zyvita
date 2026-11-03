/* ============================================================
   ZYVITA HEALTHCARE — Premium JavaScript
   ============================================================ */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Preloader ---- */
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    const hidePreloader = () => {
      preloader.classList.add('hidden');
    };
    if (document.readyState === 'complete') {
      setTimeout(hidePreloader, 300);
    } else {
      window.addEventListener('load', () => setTimeout(hidePreloader, 400));
      setTimeout(hidePreloader, 3000); // Fallback
    }
  }

  /* ---- Header scroll behavior ---- */
  const header = document.querySelector('.header');
  if (header) {
    const handleScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // run on init
  }

  /* ---- Hero entrance animation ---- */
  const heroEnterEls = document.querySelectorAll('.hero-enter');
  if (heroEnterEls.length && !prefersReducedMotion) {
    // Already set via CSS animation on class, nothing extra needed
    // Trigger image scale effect
    const heroImg = document.querySelector('.hero__image');
    if (heroImg) {
      requestAnimationFrame(() => {
        setTimeout(() => heroImg.classList.add('loaded'), 100);
      });
    }
  } else {
    // If reduced motion, show everything immediately
    heroEnterEls.forEach(el => {
      el.style.opacity = '1';
      el.style.animation = 'none';
    });
  }

  /* ---- Accessible responsive navigation ---- */
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const mobileBreakpoint = 900;

  if (menuToggle && nav) {
    const isMobileNav = () => window.matchMedia(`(max-width: ${mobileBreakpoint}px)`).matches;
    let closeFallbackTimer = null;
    let menuClosing = false;

    const clearCloseFallback = () => {
      if (closeFallbackTimer !== null) {
        window.clearTimeout(closeFallbackTimer);
        closeFallbackTimer = null;
      }
    };

    // Only release the header layer and page scroll after the slide-out has
    // completed. Keeping .menu-open during the transition prevents the
    // scrolled header's compositing/filter state from hiding the fixed nav.
    const finishMenuClose = () => {
      if (nav.classList.contains('open')) return;
      clearCloseFallback();
      menuClosing = false;
      if (header) header.classList.remove('menu-open');
      document.body.style.overflow = '';
    };

    const closeMenu = (immediate = false) => {
      nav.classList.remove('open');
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      nav.querySelectorAll('.dropdown.mobile-open').forEach(dropdown => {
        dropdown.classList.remove('mobile-open');
      });
      nav.querySelectorAll('.nav-item > .nav-link[aria-expanded="true"]').forEach(link => {
        link.setAttribute('aria-expanded', 'false');
      });

      if (immediate || !isMobileNav()) {
        finishMenuClose();
        return;
      }

      menuClosing = true;
      clearCloseFallback();
      // Fallback for browsers that do not emit transitionend (for example,
      // when a tab is backgrounded during the closing animation).
      closeFallbackTimer = window.setTimeout(finishMenuClose, 450);
    };

    const openMenu = () => {
      clearCloseFallback();
      menuClosing = false;
      // Set the stable, opaque header layer before starting the nav animation.
      if (header) header.classList.add('menu-open');
      nav.classList.add('open');
      menuToggle.classList.add('active');
      menuToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    nav.addEventListener('transitionend', event => {
      if (event.target === nav && event.propertyName === 'transform' &&
          !nav.classList.contains('open')) {
        finishMenuClose();
      }
    });

    menuToggle.addEventListener('click', event => {
      event.stopPropagation();
      nav.classList.contains('open') ? closeMenu() : openMenu();
    });

    nav.querySelectorAll('.nav-item').forEach(item => {
      const link = item.querySelector('.nav-link');
      const dropdown = item.querySelector('.dropdown');
      if (link && dropdown) {
        link.addEventListener('click', event => {
          if (isMobileNav()) {
            event.preventDefault();
            const willOpen = !dropdown.classList.contains('mobile-open');
            nav.querySelectorAll('.dropdown.mobile-open').forEach(openDropdown => {
              openDropdown.classList.remove('mobile-open');
            });
            dropdown.classList.toggle('mobile-open', willOpen);
            link.setAttribute('aria-expanded', String(willOpen));
          }
        });
      }
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (!isMobileNav()) return;
        const parentItem = link.closest('.nav-item');
        const hasDropdown = Boolean(parentItem && parentItem.querySelector('.dropdown'));
        if (link.closest('.dropdown') || !hasDropdown) closeMenu();
      });
    });

    document.addEventListener('click', event => {
      if (nav.classList.contains('open') &&
          !nav.contains(event.target) &&
          !menuToggle.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        closeMenu();
        menuToggle.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (!isMobileNav()) closeMenu(true);
    }, { passive: true });
  }

  /* ---- Scroll reveal (IntersectionObserver) ---- */
  const revealEls = document.querySelectorAll(
    '.reveal, .reveal--left, .reveal--right, .reveal--scale'
  );

  if (revealEls.length && !prefersReducedMotion) {
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
      );
      revealEls.forEach(el => revealObserver.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('in-view'));
    }
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* ---- Animated counters ---- */
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const isDecimal = target % 1 !== 0;
    const duration = 1800;
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const current = target * easedProgress;
      const display = isDecimal ? current.toFixed(1) : Math.floor(current);
      el.textContent = prefix + display + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + (isDecimal ? target.toFixed(1) : target) + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  const counterEls = document.querySelectorAll('[data-count]');
  if (counterEls.length && !prefersReducedMotion) {
    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counterEls.forEach(el => counterObserver.observe(el));
    } else {
      counterEls.forEach(el => animateCounter(el));
    }
  } else {
    counterEls.forEach(el => animateCounter(el));
  }

  /* ---- Product filtering ---- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');

  if (filterBtns.length && productCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.getAttribute('data-filter');

        productCards.forEach((card, i) => {
          const cardCat = card.getAttribute('data-category');
          const show = category === 'all' || cardCat === category;

          if (show) {
            card.style.display = '';
            card.style.opacity = '0';
            card.style.transform = 'translateY(16px)';
            // Stagger
            setTimeout(() => {
              card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, i * 40);
          } else {
            card.style.transition = 'opacity 0.2s ease';
            card.style.opacity = '0';
            setTimeout(() => { card.style.display = 'none'; }, 220);
          }
        });
      });
    });
  }

  /* ---- Product search ---- */
  const searchInput = document.querySelector('#product-search');
  if (searchInput && productCards.length) {
    searchInput.addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim();
      productCards.forEach(card => {
        const match = card.textContent.toLowerCase().includes(q);
        card.style.display = match ? '' : 'none';
      });
    });
  }

  /* ---- Contact form ---- */
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();

      let valid = true;
      const requiredFields = contactForm.querySelectorAll('[required]');

      requiredFields.forEach(field => {
        const group = field.closest('.form-group');
        const errEl = group?.querySelector('.form-error');
        const isEmpty = !field.value.trim();
        const isEmailBad = field.type === 'email' && field.value.trim() &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);

        if (isEmpty || isEmailBad) {
          valid = false;
          field.style.borderColor = '#DC2626';
          if (errEl) errEl.style.display = 'block';
        } else {
          field.style.borderColor = '';
          if (errEl) errEl.style.display = 'none';
        }
      });

      if (valid) {
        const existing = contactForm.querySelector('.form-success');
        if (existing) existing.remove();

        const msg = document.createElement('div');
        msg.className = 'form-success';
        msg.style.cssText = [
          'padding:16px 20px',
          'background:rgba(5,150,105,0.08)',
          'border:1px solid rgba(5,150,105,0.25)',
          'border-radius:10px',
          'color:#059669',
          'font-weight:600',
          'margin-top:16px',
          'font-size:0.9375rem'
        ].join(';');
        msg.textContent = '✓ Thank you! Your message has been sent. We will respond within 1 business day.';

        contactForm.appendChild(msg);
        contactForm.reset();
        setTimeout(() => msg.remove(), 6000);
      }
    });
  }

  /* ---- Smooth scroll for anchor links ---- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
        // Close mobile menu
        if (nav && nav.classList.contains('open')) {
          nav.classList.remove('open');
          menuToggle?.classList.remove('active');
          menuToggle?.setAttribute('aria-expanded', 'false');
          header?.classList.remove('menu-open');
          document.body.style.overflow = '';
        }
      }
    });
  });

  /* ---- Subtle parallax for hero bg ---- */
  if (!prefersReducedMotion) {
    const heroBg = document.querySelector('.hero__image img');
    if (heroBg) {
      const handleParallax = () => {
        const scrolled = window.scrollY;
        if (scrolled < window.innerHeight * 1.5) {
          heroBg.style.transform = `scale(1) translateY(${scrolled * 0.12}px)`;
        }
      };
      window.addEventListener('scroll', handleParallax, { passive: true });
    }
  }

})();
