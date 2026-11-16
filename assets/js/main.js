/* ==========================================================================
   Golden Crumb: main.js
   Custom selects, header + scroll-spy, toast, hero/how-it-works motion,
   notes carousel, open/closed status, bake filter, form validation and
   GSAP scroll animations.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const refreshMotion = () => { if (window.ScrollTrigger) requestAnimationFrame(() => window.ScrollTrigger.refresh()); };

  /* ---------- Custom select: branded list for every .form-select ---------- */
  let cselectId = 0;
  function enhanceSelect(select) {
    if (select.multiple || select.closest('.cselect')) return;
    const id = select.id || `cs-${++cselectId}`;
    select.id = id;
    const wrap = document.createElement('div');
    wrap.className = 'cselect';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('cselect__native');
    select.setAttribute('tabindex', '-1');
    select.setAttribute('aria-hidden', 'true');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cselect__btn';
    btn.id = `${id}-btn`;
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="cselect__value"></span><svg class="icon" width="18" height="18" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M210.83,98.83l-80,80a4,4,0,0,1-5.66,0l-80-80a4,4,0,0,1,5.66-5.66L128,170.34l77.17-77.17a4,4,0,1,1,5.66,5.66Z"/></svg>';
    const list = document.createElement('ul');
    list.className = 'cselect__list';
    list.id = `${id}-list`;
    list.setAttribute('role', 'listbox');
    list.setAttribute('tabindex', '-1');
    btn.setAttribute('aria-controls', list.id);
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) { label.setAttribute('for', btn.id); label.id = label.id || `${id}-label`; list.setAttribute('aria-labelledby', label.id); btn.setAttribute('aria-labelledby', `${label.id} ${btn.id}`); }
    else if (select.getAttribute('aria-label')) list.setAttribute('aria-label', select.getAttribute('aria-label'));
    wrap.append(btn, list);
    let items = [];
    let active = -1;
    const isPlaceholder = o => o && o.value === '' && /…$/.test(o.textContent);
    const build = () => {
      const opts = Array.from(select.options);
      list.innerHTML = opts.map((o, i) => `<li class="cselect__option" role="option" id="${id}-opt-${i}" data-index="${i}" aria-selected="false"${isPlaceholder(o) && i === 0 ? ' aria-disabled="true"' : ''}>${o.textContent}</li>`).join('');
      items = $$('.cselect__option', list);
    };
    const sync = () => {
      const i = select.selectedIndex;
      const o = select.options[i];
      const v = $('.cselect__value', btn);
      v.textContent = o ? o.textContent : '';
      v.classList.toggle('is-placeholder', !o || isPlaceholder(o));
      items.forEach((li, k) => li.setAttribute('aria-selected', String(k === i && !isPlaceholder(select.options[k]))));
    };
    const setActive = i => {
      i = Math.max(0, Math.min(i, items.length - 1));
      while (items[i] && items[i].getAttribute('aria-disabled') === 'true') i++;
      if (!items[i]) return;
      items.forEach(li => li.classList.remove('is-active'));
      items[i].classList.add('is-active');
      items[i].scrollIntoView({ block: 'nearest' });
      list.setAttribute('aria-activedescendant', items[i].id);
      active = i;
    };
    const open = () => { $$('.cselect.is-open').forEach(w => w !== wrap && w.classList.remove('is-open')); wrap.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); setActive(select.selectedIndex); list.focus({ preventScroll: true }); list.scrollIntoView({ block: 'nearest', behavior: 'auto' }); };
    const close = (focusBtn = true) => { wrap.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); if (focusBtn) btn.focus({ preventScroll: true }); };
    const choose = i => {
      if (i < 0 || items[i].getAttribute('aria-disabled') === 'true') return;
      select.selectedIndex = i;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      select.dispatchEvent(new Event('input', { bubbles: true }));
      sync();
      close();
    };
    btn.addEventListener('click', () => (wrap.classList.contains('is-open') ? close() : open()));
    btn.addEventListener('keydown', e => { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); open(); } });
    list.addEventListener('click', e => { const li = e.target.closest('.cselect__option'); if (li) choose(parseInt(li.dataset.index, 10)); });
    list.addEventListener('mousemove', e => { const li = e.target.closest('.cselect__option'); if (li) setActive(parseInt(li.dataset.index, 10)); });
    list.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); let i = active - 1; while (i > 0 && items[i].getAttribute('aria-disabled') === 'true') i--; setActive(i); }
      else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
      else if (e.key === 'End') { e.preventDefault(); setActive(items.length - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') { close(false); }
      else if (e.key.length === 1) { const k = items.findIndex(li => li.textContent.trim().toLowerCase().startsWith(e.key.toLowerCase())); if (k > -1) setActive(k); }
    });
    document.addEventListener('click', e => { if (!wrap.contains(e.target) && wrap.classList.contains('is-open')) close(false); });
    select.addEventListener('change', sync);
    if (select.form) select.form.addEventListener('reset', () => setTimeout(sync));
    build();
    sync();
  }
  $$('select.form-select').forEach(enhanceSelect);

  /* ---------- Header state, smooth in-page navigation, scroll-spy, footer year ---------- */
  const header = $('[data-header]');
  const navLinks = $$('.main-nav .nav-link, .m-nav__link');
  const spyTargets = [...new Set($$('.main-nav .nav-link').map(a => a.getAttribute('href')).filter(h => h && h.length > 1))]
    .map(h => ({ href: h, el: h === '#top' ? document.body : $(h) })).filter(t => t.el);
  const headerOffset = () => (header ? header.offsetHeight : 0) + 8;
  const setActive = href => navLinks.forEach(a => {
    const on = a.getAttribute('href') === href;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  });
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 40);
    if (!spyTargets.length) return;
    let current = '#top';
    const line = headerOffset() + 40;
    spyTargets.forEach(t => { if (t.href !== '#top' && t.el.getBoundingClientRect().top <= line) current = t.href; });
    if (window.innerHeight + y >= document.documentElement.scrollHeight - 4) current = spyTargets[spyTargets.length - 1].href;
    setActive(current);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
  const goTo = hash => {
    const behavior = reduceMotion() ? 'auto' : 'smooth';
    if (hash === '#top') { window.scrollTo({ top: 0, behavior }); return true; }
    const el = hash.length > 1 ? $(hash) : null;
    if (!el) return false;
    window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - headerOffset()), behavior });
    return true;
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.classList.contains('skip-link')) return;
    const hash = a.getAttribute('href');
    if (!hash || hash === '#' || !(hash === '#top' || $(hash))) return;
    e.preventDefault();
    const menu = a.closest('#siteMenu');
    const run = () => { goTo(hash); if (history.replaceState) history.replaceState(null, '', hash === '#top' ? location.pathname + location.search : hash); };
    if (menu && window.bootstrap) {
      menu.addEventListener('hidden.bs.offcanvas', run, { once: true });
      window.bootstrap.Offcanvas.getOrCreateInstance(menu).hide();
    } else run();
  });
  if (location.hash.length > 1) window.addEventListener('load', () => setTimeout(() => goTo(location.hash), 150));
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- Love-letter carousel (buttons, arrows, swipe) ---------- */
  $$('[data-notes]').forEach(car => {
    const slides = $$('[data-note-slide]', car);
    let cur = 0;
    const show = i => {
      cur = (i + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle('is-current', k === cur); s.setAttribute('aria-hidden', String(k !== cur)); });
      $('[data-notes-index]', car).textContent = String(cur + 1);
    };
    $('[data-notes-prev]', car).addEventListener('click', () => show(cur - 1));
    $('[data-notes-next]', car).addEventListener('click', () => show(cur + 1));
    car.addEventListener('keydown', e => { const rtl = root.getAttribute('dir') === 'rtl'; if (e.key === 'ArrowRight') show(cur + (rtl ? -1 : 1)); if (e.key === 'ArrowLeft') show(cur + (rtl ? 1 : -1)); });
    let x0 = null;
    car.addEventListener('pointerdown', e => { x0 = e.clientX; });
    car.addEventListener('pointerup', e => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) show(cur + ((dx < 0) !== (root.getAttribute('dir') === 'rtl') ? 1 : -1)); });
    show(0);
  });

  /* ---------- Open / closed status (matches the hours shown on the page) ---------- */
  // Hours in minutes from midnight, Sunday first. null = closed.
  // Tue–Sat 8:00–17:00, Sun 8:00–13:00, Mon closed.
  (function openStatus() {
    const HOURS = [[480, 780], null, [480, 1020], [480, 1020], [480, 1020], [480, 1020], [480, 1020]];
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fmt = m => { const h = Math.floor(m / 60); return `${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
    const now = new Date();
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    const today = HOURS[day];
    const open = !!today && mins >= today[0] && mins < today[1];
    let text = '';
    if (open) text = `Open now · until ${fmt(today[1])}`;
    else if (today && mins < today[0]) text = `Closed · opens today at ${fmt(today[0])}`;
    else {
      for (let i = 1; i <= 7; i++) {
        const d = (day + i) % 7;
        if (HOURS[d]) { text = `Closed · opens ${i === 1 ? 'tomorrow' : DAYS[d]} at ${fmt(HOURS[d][0])}`; break; }
      }
    }
    $$('[data-open-status]').forEach(el => { el.textContent = text; el.parentElement.classList.toggle('is-closed', !open); });
    // Hours rows are listed as: Tue–Sat, Sunday, Monday (repeated per hours block)
    const idx = day >= 2 ? 0 : day === 0 ? 1 : 2;
    $$('[data-hours-row]').forEach((li, i) => li.classList.toggle('is-today', i % 3 === idx));
  })();

  /* ---------- Forms: validation + friendly success states ---------- */
  function showSuccess(form) {
    const target = form.dataset.success ? $(form.dataset.success) : null;
    if (!target) return;
    form.hidden = true;
    target.classList.add('is-visible');
    target.setAttribute('tabindex', '-1');
    target.focus();
  }
  const firstInvalidIn = scope => {
    let el = $(':invalid:not(fieldset)', scope);
    if (el && el.classList.contains('cselect__native')) el = el.parentElement.querySelector('.cselect__btn');
    return el;
  };
  $$('form.needs-validation').forEach(form => {
    form.addEventListener('submit', e => {
      if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
        form.classList.add('was-validated');
        const el = firstInvalidIn(form);
        if (el) el.focus();
        return;
      }
      form.classList.add('was-validated');
      // TODO: connect to Formspree / Netlify Forms. Until a real endpoint is set the demo shows its success state.
      const action = form.getAttribute('action') || '';
      if (!action || action === '#' || action.includes('your-form-id') || form.hasAttribute('data-demo')) {
        e.preventDefault();
        if (form.dataset.redirect) { location.href = form.dataset.redirect; return; }
        showSuccess(form);
      }
    });
  });

  /* ---------- Home portfolio filter (real setups) ---------- */
  const workGrid = $('[data-work-grid]');
  if (workGrid) {
    const btns = $$('[data-work-filter]');
    const empty = $('[data-work-empty]');
    btns.forEach(btn => btn.addEventListener('click', () => {
      const cat = btn.dataset.workFilter;
      btns.forEach(b => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
      let shown = 0;
      $$('[data-work-cat]', workGrid).forEach(card => {
        const show = cat === 'all' || card.dataset.workCat === cat;
        card.hidden = !show;
        if (show) shown++;
      });
      if (empty) empty.hidden = shown > 0;
      refreshMotion();
    }));
  }

  /* ---------- Reels carousel: coverflow, infinite loop, swipe/tap, themed hub ---------- */
  (function reelsModule() {
    const root = $('[data-reels]');
    if (!root) return;
    const slides = $$('[data-reel]', root);
    const icons = $$('[data-reel-icon]', root);
    const hub = $('[data-reel-hub]', root);
    const stage = $('[data-reel-stage]', root);
    const caption = $('[data-reel-caption]', root);
    const labelEl = $('[data-reel-label]', root);
    const countEl = $('[data-reel-count]', root);
    const reels = $('.reels', root);
    const n = slides.length;
    if (!n) return;
    const half = Math.floor(n / 2);
    const DURATION = 6500;
    let cur = 0;
    let playing = !reduceMotion();
    let inView = false;
    let raf = 0;
    let last = 0;
    let progress = 0;
    let swiped = false;

    const offset = i => { let d = ((i - cur) % n + n) % n; if (d > half) d -= n; return d; };
    const setProgress = (s, p) => s.style.setProperty('--p', p.toFixed(4));

    const paintPlaying = () => {
      reels.classList.toggle('is-paused', !playing);
    };

    const render = (instant, user) => {
      slides.forEach((s, i) => {
        const d = offset(i);
        const prev = s.dataset.d === undefined ? d : Number(s.dataset.d);
        if (instant || Math.abs(d - prev) > half) s.classList.add('is-jump');
        s.dataset.d = String(d);
        s.dataset.pos = Math.abs(d) > 2 ? 'far' : String(d);
        const edge = Math.abs(d) > 1;
        s.setAttribute('aria-hidden', String(edge));
        if (d === 0) s.setAttribute('aria-current', 'true'); else s.removeAttribute('aria-current');
        const hit = $('.reel__hit', s);
        hit.tabIndex = edge ? -1 : 0;
        hit.setAttribute('aria-label', d === 0 ? (playing ? 'Pause this reel' : 'Play this reel') : d < 0 ? 'Show previous reel' : 'Show next reel');
        if (d !== 0) setProgress(s, 0);
      });
      void stage.offsetWidth;
      slides.forEach(s => s.classList.remove('is-jump'));
      const active = slides[cur];
      root.style.setProperty('--acc', active.dataset.accent);
      icons.forEach((el, k) => el.classList.toggle('is-on', k === cur));
      caption.setAttribute('aria-live', user ? 'polite' : 'off');
      labelEl.textContent = active.dataset.label;
      countEl.textContent = `${cur + 1} / ${n}`;
      labelEl.classList.remove('is-swap');
      hub.classList.remove('is-pulse');
      void hub.offsetWidth;
      labelEl.classList.add('is-swap');
      hub.classList.add('is-pulse');
    };

    const makeVideo = s => {
      const v = document.createElement('video');
      v.src = s.dataset.videoSrc;
      v.muted = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.setAttribute('playsinline', '');
      v.setAttribute('aria-hidden', 'true');
      v.addEventListener('ended', () => { if (playing) go(cur + 1, false); });
      v.addEventListener('timeupdate', () => { if (v.duration) setProgress(s, v.currentTime / v.duration); });
      $('.reel__media', s).appendChild(v);
      s.classList.add('is-video');
      return v;
    };

    const syncMedia = () => {
      const live = playing && inView && !document.hidden;
      slides.forEach((s, i) => {
        const v = $('video', s);
        if (!v) return;
        if (i !== cur) { v.pause(); v.currentTime = 0; } else if (!live) v.pause();
      });
      const s = slides[cur];
      if (!live || !s.dataset.videoSrc) return;
      const v = $('video', s) || makeVideo(s);
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    };

    const tick = t => {
      raf = 0;
      if (!playing || !inView || document.hidden) { last = 0; return; }
      const s = slides[cur];
      if (s.dataset.videoSrc) return;
      if (last) progress += (t - last) / DURATION;
      last = t;
      setProgress(s, Math.min(progress, 1));
      if (progress >= 1) { go(cur + 1, false); return; }
      raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } };

    function go(i, user) {
      if (user && !playing) { playing = true; paintPlaying(); }
      cur = ((i % n) + n) % n;
      progress = 0;
      render(false, user);
      syncMedia();
      kick();
    }

    const setPlaying = on => {
      playing = on;
      paintPlaying();
      slides.forEach((s, i) => { if (i === cur) $('.reel__hit', s).setAttribute('aria-label', on ? 'Pause this reel' : 'Play this reel'); });
      syncMedia();
      kick();
    };

    slides.forEach((s, i) => {
      $('.reel__hit', s).addEventListener('click', () => {
        if (swiped) { swiped = false; return; }
        if (i === cur) setPlaying(!playing); else go(i, true);
      });
    });

    let sx = 0;
    let sy = 0;
    let down = false;
    stage.addEventListener('pointerdown', e => { down = true; swiped = false; sx = e.clientX; sy = e.clientY; });
    stage.addEventListener('pointerup', e => {
      if (!down) return;
      down = false;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) { swiped = true; go(cur + (dx < 0 ? 1 : -1), true); }
    });
    stage.addEventListener('pointercancel', () => { down = false; });
    reels.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1, true); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1, true); }
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { inView = es[0].isIntersecting; syncMedia(); kick(); }, { threshold: 0.25 }).observe(root);
    } else inView = true;
    document.addEventListener('visibilitychange', () => { syncMedia(); kick(); });

    paintPlaying();
    render(true, false);
  })();

  /* ---------- GSAP animations (respecting reduced motion) ---------- */
  function initMotion() {
    if (!window.gsap) return;
    const gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ease = 'power2.out';
      const heroBits = $$('[data-hero]');
      if (heroBits.length) gsap.from(heroBits.flatMap(h => Array.from(h.children)), { y: 28, opacity: 0, duration: 0.8, ease, stagger: 0.08, delay: 0.1, clearProps: 'transform' });
      $$('.envelope').forEach(el => gsap.from(el, { y: 40, opacity: 0, duration: 1, ease, delay: 0.2, clearProps: 'transform' }));
      $$('.envelope__seal').forEach(el => gsap.from(el, { scale: 0.3, rotate: -40, opacity: 0, duration: 0.8, ease: 'back.out(1.8)', delay: 0.8, clearProps: 'transform' }));
      if (!window.ScrollTrigger) return;
      $$('[data-reveal]').forEach(el => gsap.from(el, { y: 30, opacity: 0, duration: 0.7, ease, clearProps: 'transform', scrollTrigger: { trigger: el, start: 'top 85%', once: true } }));
      $$('.js-stagger').forEach(grid => gsap.from(Array.from(grid.children).filter(c => !c.hidden), { y: 30, opacity: 0, duration: 0.6, ease, stagger: 0.1, clearProps: 'transform', scrollTrigger: { trigger: grid, start: 'top 85%', once: true } }));
      $$('[data-count]').forEach(el => {
        const target = parseFloat(el.dataset.count);
        const decimals = (el.dataset.count.split('.')[1] || '').length;
        const suffix = el.dataset.suffix || '';
        const obj = { v: 0 };
        gsap.to(obj, { v: target, duration: 1.4, ease, scrollTrigger: { trigger: el, start: 'top 92%', once: true }, onUpdate: () => { el.textContent = (decimals ? obj.v.toFixed(decimals) : Math.round(obj.v).toLocaleString('en-US')) + suffix; } });
      });
      // How-it-works ribbon: the dashed thread draws itself, knots tighten in turn
      $$('[data-ribbon]').forEach(rb => {
        const path = $('[data-ribbon-draw]', rb);
        if (path && path.getTotalLength) {
          const len = path.getTotalLength();
          gsap.fromTo(path, { strokeDasharray: `${len}`, strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: rb, start: 'top 75%', end: 'bottom 70%', scrub: 0.5 } });
        }
        $$('[data-knot]', rb).forEach((k, i) => {
          gsap.from($('.knot__bow', k), { scale: 0.4, rotate: -90, opacity: 0, duration: 0.6, ease: 'back.out(1.8)', scrollTrigger: { trigger: rb, start: `top ${78 - i * 6}%`, once: true } });
          gsap.from($('.knot__card', k), { y: 40, opacity: 0, duration: 0.7, ease, clearProps: 'transform', scrollTrigger: { trigger: k, start: 'top 88%', once: true } });
          window.ScrollTrigger.create({ trigger: k, start: 'top 65%', end: 'bottom 35%', toggleClass: { targets: k, className: 'is-active' } });
        });
      });
    });
  }
  if (document.readyState === 'complete') initMotion();
  else window.addEventListener('load', initMotion);
  window.addEventListener('load', () => setTimeout(refreshMotion, 300));
})();
