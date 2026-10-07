/* SacMusicals — page behaviour: smooth scroll, header, the tabla dive, reveals */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  if (!reduced && window.Lenis && hasGSAP) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  // in-page links go through Lenis so the glide matches
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = document.querySelector(id); if (!el) return;
    e.preventDefault(); closeMenu();
    if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.4 }); else el.scrollIntoView();
    el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true });
  }));

  /* ---------- header + menu ---------- */
  const header = $('#header'), menuBtn = $('#menuBtn'), menu = $('#mobileMenu');
  const onScroll = () => header && header.classList.toggle('scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function closeMenu() { if (menu && !menu.hidden) { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); } }
  menuBtn && menuBtn.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); });
  menu && $$('a', menu).forEach((a) => a.addEventListener('click', closeMenu));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- the tabla + dive ---------- */
  const stage = $('#stage');
  if (stage) {
    let tabla = null;
    const proxy = { p: 0 };
    import('./tabla.js').then(({ mountTabla }) => {
      tabla = mountTabla(stage, {
        reducedMotion: reduced,
        stampUrl: 'assets/logo/logo-stamp.svg',
        onBol: (bol, x, y) => {
          const el = document.createElement('span');
          el.className = 'float-bol'; el.textContent = bol;
          el.style.left = x + 'px'; el.style.top = y + 'px';
          document.body.appendChild(el); setTimeout(() => el.remove(), 1000);
        },
      });
      tabla.setDive(proxy.p);
    }).catch((err) => { console.warn('3D tabla unavailable', err); stage.classList.add('no-webgl'); });

    /* play with the keyboard, like keerat.fyi: J K L on the dayan, D F on the bayan */
    const keyMap = { j: 'Na', k: 'Tin', l: 'Tun', d: 'Ge', f: 'Ke' };
    const flash = (bol) => { const b = $(`#bolKeys [data-bol="${bol}"]`); if (b) { b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 160); } };
    const strike = (bol) => { if (tabla && tabla.play(bol)) flash(bol); };
    let heroInView = true;
    new IntersectionObserver(([e]) => { heroInView = e.isIntersecting; }, { threshold: 0.25 }).observe($('#dive'));
    addEventListener('keydown', (e) => {
      if (!heroInView || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (/input|textarea|select/i.test(document.activeElement.tagName) || document.querySelector('dialog[open]')) return;
      const bol = keyMap[e.key.toLowerCase()];
      if (bol) { e.preventDefault(); strike(bol); }
    });
    $$('#bolKeys button').forEach((b) => b.addEventListener('click', () => strike(b.dataset.bol)));

    const iris = $('#iris');
    if (hasGSAP && !reduced) {
      const wide = matchMedia('(min-width: 961px)').matches;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '#dive', start: 'top top', end: '+=260%', pin: true, scrub: 0.7, anticipatePin: 1 },
      });
      tl.to('#heroCopy', { autoAlpha: 0, y: -40, duration: 0.14, ease: 'power1.in' }, 0)
        .to(['#tapHint', '#scrollCue', '#bolKeys'], { autoAlpha: 0, duration: 0.06 }, 0)
        .to(stage, { '--shadow-o': 0, duration: 0.2 }, 0.04);
      if (wide) tl.to(stage, { left: 0, duration: 0.3, ease: 'power1.inOut' }, 0.02);
      else tl.to(stage, { bottom: 0, duration: 0.3, ease: 'power1.inOut' }, 0.02);
      tl.to(proxy, { p: 1, duration: 0.72, onUpdate: () => tabla && tabla.setDive(proxy.p) }, 0.06)
        .to('#syahiFill', { scale: 15, duration: 0.12, ease: 'power2.in' }, 0.72)
        .to(iris, { clipPath: 'circle(80% at 50% 50%)', duration: 0.15, ease: 'power2.out' }, 0.85)
        .from('.iris-inner', { scale: 0.86, autoAlpha: 0, duration: 0.13, ease: 'power2.out' }, 0.88);
    } else if (iris) {
      // reduced motion: no dive; the statement simply follows the hero
      iris.classList.add('iris-static');
      $('#dive').after(iris);
      $('#syahiFill') && $('#syahiFill').remove();
    }
  }

  /* ---------- reveals ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));
  // fast jumps (anchor links, flung scrolls) can skip past the observer, so sweep anything already passed
  let sweepQ = false;
  const sweep = () => { sweepQ = false; $$('.reveal:not(.in)').forEach((el) => { if (el.getBoundingClientRect().top < innerHeight * 0.92) { el.classList.add('in'); io.unobserve(el); } }); };
  addEventListener('scroll', () => { if (!sweepQ) { sweepQ = true; requestAnimationFrame(sweep); } }, { passive: true });

  /* ---------- scroll-scrubbed image zooms ---------- */
  if (hasGSAP && !reduced) {
    $$('.zoom img').forEach((img) => gsap.fromTo(img, { scale: 1.22 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom 40%', scrub: 0.6 },
    }));
    $$('.zoom-band img').forEach((img) => gsap.fromTo(img, { yPercent: -12, scale: 1.25 }, {
      yPercent: 12, scale: 1.05, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    }));
  }

  /* ---------- scales: pick a note, the portal swaps ---------- */
  const scaleVideo = $('#scaleVideo'), portal = $('#portal'), portalPlay = $('#portalPlay'), caption = $('#portalCaption');
  if (scaleVideo) {
    const setPlaying = (on) => portal.classList.toggle('playing', on);
    scaleVideo.addEventListener('play', () => setPlaying(true));
    scaleVideo.addEventListener('pause', () => setPlaying(false));
    scaleVideo.addEventListener('ended', () => setPlaying(false));
    portalPlay.addEventListener('click', () => { scaleVideo.controls = true; scaleVideo.play().catch(() => {}); });
    $$('.note').forEach((btn) => btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      $$('.note').forEach((b) => { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('is-active'); btn.setAttribute('aria-pressed', 'true');
      const v = btn.dataset.video, note = $('b', btn).textContent;
      const detail = $('span', btn).childNodes[0].textContent.trim();
      const wood = $('small', btn) ? ', ' + $('small', btn).textContent.toLowerCase() : '';
      const swap = () => {
        const wasPlaying = !scaleVideo.paused;
        scaleVideo.pause();
        scaleVideo.poster = `assets/video/${v}.jpg`;
        scaleVideo.src = `assets/video/${v}.mp4`;
        scaleVideo.setAttribute('aria-label', `Dayan tuned to ${note}`);
        portalPlay.setAttribute('aria-label', `Play the ${note} scale dayan`);
        caption.textContent = `${note} scale · ${detail}${wood}`;
        if (wasPlaying) scaleVideo.play().catch(() => {}); else { scaleVideo.controls = false; setPlaying(false); }
      };
      swap();
      if (hasGSAP && !reduced) gsap.fromTo(portal, { scale: 0.82, autoAlpha: 0.25 }, { scale: 1, autoAlpha: 1, duration: 0.7, ease: 'expo.out', overwrite: true });
    }));
  }

  /* ---------- products: video dialog ---------- */
  const vmodal = $('#vmodal');
  if (vmodal) {
    const vv = $('#vmodalVideo'), vc = $('#vmodalCaption');
    let opener = null;
    $$('.vplay').forEach((btn) => btn.addEventListener('click', () => {
      opener = btn;
      const v = btn.dataset.video;
      vv.poster = `assets/video/${v}.jpg`; vv.src = `assets/video/${v}.mp4`;
      vc.innerHTML = btn.closest('figure').querySelector('figcaption').innerHTML;
      vmodal.showModal(); lenis && lenis.stop();
      vv.play().catch(() => {});
    }));
    const close = () => vmodal.close();
    $('.vmodal-close', vmodal).addEventListener('click', close);
    vmodal.addEventListener('click', (e) => { if (e.target === vmodal) close(); });
    vmodal.addEventListener('close', () => { vv.pause(); vv.removeAttribute('src'); vv.load(); lenis && lenis.start(); opener && opener.focus(); });
  }

  /* ---------- FAQs: term definitions ---------- */
  const termModal = $('#termModal');
  if (termModal) {
    let opener = null;
    $$('.term').forEach((btn) => btn.addEventListener('click', () => {
      const tpl = $('#term-' + btn.dataset.term); if (!tpl) return;
      opener = btn;
      $('#termTitle').textContent = btn.dataset.term[0].toUpperCase() + btn.dataset.term.slice(1);
      const body = $('#termBody'); body.replaceChildren(tpl.content.cloneNode(true));
      termModal.showModal(); lenis && lenis.stop();
    }));
    $('.term-close', termModal).addEventListener('click', () => termModal.close());
    termModal.addEventListener('click', (e) => { if (e.target === termModal) termModal.close(); });
    termModal.addEventListener('close', () => { lenis && lenis.start(); opener && opener.focus(); });
  }

  /* ---------- contact: service cards prefill, friendly validation ---------- */
  const form = $('#contactForm');
  if (form) {
    const msg = $('#message'), note = $('#formNote');
    $$('[data-topic]').forEach((a) => a.addEventListener('click', () => {
      if (!msg.value.trim()) msg.value = `Hi! I'm interested in: ${a.dataset.topic}.\n\n`;
    }));
    // the browser blocks submit on invalid fields and fires 'invalid' instead
    form.addEventListener('invalid', () => {
      note.textContent = 'Please fill in the required fields marked *.'; note.className = 'form-note full is-error';
    }, true);
    form.addEventListener('input', () => { if (form.checkValidity()) { note.textContent = ''; note.className = 'form-note full'; } });
    form.addEventListener('submit', (e) => {
      if (form.botcheck && form.botcheck.checked) { e.preventDefault(); return; }
      note.textContent = 'Sending…'; note.className = 'form-note full';
      $('button[type=submit]', form).disabled = true;
    });
  }

  window.smSite = { lenis };
})();
