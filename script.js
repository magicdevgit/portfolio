// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Reduced motion preference
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Detect coarse pointer (touch devices)
const isTouchPointer = window.matchMedia('(pointer: coarse)').matches;

// (navigation removed)

// Burger menu controller with focus trap and page scroll lock
(function burger(){
  const toggle = document.querySelector('.burger-toggle');
  const drawer = document.getElementById('site-menu');
  const closeBtn = document.querySelector('.burger-close');
  const backdrop = document.querySelector('.burger-backdrop');
  if (!toggle || !drawer || !backdrop) return;

  let lastFocused = null;
  const focusablesSelector = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
  let outsideClickHandler = null;

  function open(){
    lastFocused = document.activeElement;
    drawer.classList.add('open');
    toggle.setAttribute('aria-expanded','true');
    drawer.setAttribute('aria-hidden','false');
    if (!isDesktop()){
      backdrop.classList.add('show');
      document.body.style.overflow='hidden';
    } else {
      outsideClickHandler = (e) => {
        if (drawer.contains(e.target)) return;
        if (e.target.closest('.burger-toggle')) return;
        close();
      };
      document.addEventListener('mousedown', outsideClickHandler, { once: false });
    }
    const first = drawer.querySelector(focusablesSelector);
    if (first) first.focus();
    document.addEventListener('keydown', onKey);
  }
  function close(){
    drawer.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    drawer.setAttribute('aria-hidden','true');
    if (!isDesktop()){
      backdrop.classList.remove('show');
      document.body.style.overflow='';
    } else if (outsideClickHandler){
      document.removeEventListener('mousedown', outsideClickHandler);
      outsideClickHandler = null;
    }
    document.removeEventListener('keydown', onKey);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
  function onKey(e){
    if (e.key === 'Escape') return close();
    if (isDesktop()) return; // no focus trap on desktop
    if (e.key !== 'Tab') return;
    const items = drawer.querySelectorAll(focusablesSelector);
    if (!items.length) return;
    const first = items[0], last = items[items.length-1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }

  toggle.addEventListener('click', () => {
    const openState = drawer.classList.contains('open');
    openState ? close() : open();
  });
  backdrop.addEventListener('click', close);
  if (closeBtn) closeBtn.addEventListener('click', close);
  drawer.addEventListener('click', (e)=>{ if (e.target.closest('a')) close(); });
})();

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);


// Observe elements for animation
document.querySelectorAll('.skill-category, .portfolio-item, .about-content, .contact-content').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// (removed) seam scan observer

// Form submission
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const name = contactForm.querySelector('input[type="text"]').value;
        const email = contactForm.querySelector('input[type="email"]').value;
        const message = contactForm.querySelector('textarea').value;
        
        // Simple validation
        if (!name || !email || !message) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        // Simulate form submission
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправляется...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            alert('Сообщение отправлено! Я свяжусь с вами в ближайшее время.');
            contactForm.reset();
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 2000);
    });
}

// (Removed) Legacy skill bar animation: not used without progress bars in markup

// Unified, throttled scroll handler (navbar, parallax, active link, progress)
const sections = document.querySelectorAll('section[id]');
// Parallax targets per section (use inner content like in hero)
const fadeTargets = Array.from(sections).map(sec => {
    const target = sec.id === 'home' ? sec.querySelector('.hero-content') : (sec.querySelector('.container') || null);
    if (target) {
        target.style.willChange = 'opacity, transform';
    }
    return { section: sec, target, id: sec.id };
}).filter(x => x.target);

// Parallax without inertia
const PARALLAX_K = 0.06; // strength (легкий)
const navLinks = document.querySelectorAll('.nav-link');
let scrollTicking = false;
function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
        const y = window.scrollY || window.pageYOffset;
        // Navbar scrolled state
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (y > 100) navbar.classList.add('nav-scrolled');
            else navbar.classList.remove('nav-scrolled');
        }
        // Parallax like in hero for all sections: move inner content only (без инерции)
        if (!isReducedMotion) {
            const rectTops = fadeTargets.map(it => it.section.getBoundingClientRect().top);
            for (let i = 0; i < fadeTargets.length; i++) {
                const item = fadeTargets[i];
                const offset = rectTops[i] * PARALLAX_K;
                item.target.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
                item.target.style.opacity = '1';
            }
            // (removed) wave separators parallax
        }
        // Scroll progress
        handleScrollProgress();
        // Active nav link
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (y >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
        scrollTicking = false;
    });
}
window.addEventListener('scroll', onScroll, { passive: true });

// (active link handled inside onScroll)

// Interactive hover effects for portfolio items
document.querySelectorAll('.portfolio-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
        const icon = item.querySelector('.portfolio-icon');
        if (icon) {
            icon.style.transform = 'scale(1.1) rotate(5deg)';
        }
    });
    
    item.addEventListener('mouseleave', () => {
        const icon = item.querySelector('.portfolio-icon');
        if (icon) {
            icon.style.transform = 'scale(1) rotate(0deg)';
        }
    });
});

// Mobile carousel for cases
(function casesCarousel(){
  const grid = document.querySelector('.portfolio-grid[data-carousel="cases"]');
  const dotsWrap = document.querySelector('.carousel-dots[data-dots-for="cases"]');
  if (!grid || !dotsWrap) return;
  const items = Array.from(grid.querySelectorAll('.portfolio-item'));
  // Ensure initial alignment to the first card (avoid partial peek)
  requestAnimationFrame(()=>{ grid.scrollTo({ left: 0, behavior: 'auto' }); });
  // Build dots
  dotsWrap.innerHTML = '';
  items.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Слайд ${idx+1}`);
    dot.addEventListener('click', () => {
      const target = items[idx];
      // On mobile snap to start; on desktop center
      const isMobile = window.matchMedia('(max-width: 900px)').matches;
      const x = isMobile ? target.offsetLeft : (target.offsetLeft - (grid.clientWidth - target.clientWidth)/2);
      grid.scrollTo({ left: x, behavior: 'smooth' });
    });
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.querySelectorAll('.dot'));
  const setActive = () => {
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    if (isMobile) {
      const start = grid.scrollLeft;
      let active = 0;
      for (let i=0;i<items.length;i++){
        const el = items[i];
        const delta = Math.abs(el.offsetLeft - start);
        const deltaActive = Math.abs(items[active].offsetLeft - start);
        if (delta < deltaActive) active = i;
      }
      dots.forEach((d,i)=>d.classList.toggle('active', i===active));
    } else {
      const center = grid.scrollLeft + grid.clientWidth/2;
      let active = 0;
      for (let i=0;i<items.length;i++){
        const el = items[i];
        const mid = el.offsetLeft + el.clientWidth/2;
        if (Math.abs(mid - center) < Math.abs(items[active].offsetLeft + items[active].clientWidth/2 - center)) active = i;
      }
      dots.forEach((d,i)=>d.classList.toggle('active', i===active));
    }
  };
  grid.addEventListener('scroll', () => requestAnimationFrame(setActive), { passive: true });
  setActive();
})();

// Smooth reveal animation for stats
const stats = document.querySelectorAll('.stat');
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0) scale(1)';
        }
    });
}, { threshold: 0.5 });

stats.forEach(stat => {
    stat.style.opacity = '0';
    stat.style.transform = 'translateY(20px) scale(0.9)';
    stat.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    statsObserver.observe(stat);
});

// Replace old typing effect with markup-preserving reveal
function initCodeRevealTyping() {
    const lines = document.querySelectorAll('.code-content .code-line');
    const baseDelayMs = 500;
    const lineDelayMs = 650;
    const charIntervalMs = 20;

    lines.forEach((line, index) => {
        const originalHTML = line.innerHTML; // keep spans/colors
        const visibleChars = line.textContent.length;
        // Wrap with reveal span + caret
        line.innerHTML = `<span class="code-reveal">${originalHTML}</span><span class="code-caret"></span>`;
        const reveal = line.querySelector('.code-reveal');
        const caret = line.querySelector('.code-caret');
        reveal.style.width = '0ch';
        reveal.style.display = 'inline-block';
        reveal.style.whiteSpace = 'pre';
        reveal.style.overflow = 'hidden';
        caret.style.display = 'inline-block';

        // Animate reveal per character in ch units
        let current = 0;
        setTimeout(() => {
            const timer = setInterval(() => {
                current += 1;
                reveal.style.width = current + 'ch';
                if (current >= visibleChars) {
                    clearInterval(timer);
                }
            }, charIntervalMs);
        }, baseDelayMs + index * lineDelayMs);
    });
}

// Remove old typing init (if present) and use reveal typing instead
(function overrideTyping() {
    document.addEventListener('DOMContentLoaded', () => {
        initCodeRevealTyping();
    });
})();

// (Moved injected styles to CSS)

// Generate hero particles
function createHeroParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    // remove old
    hero.querySelectorAll('.particle').forEach(p => p.remove());
    const count = window.innerWidth < 768 ? 25 : 45;
    for (let i = 0; i < count; i++) {
        const dot = document.createElement('span');
        dot.className = 'particle';
        const size = Math.random() * 3 + 2;
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        dot.style.left = `${Math.random() * 100}%`;
        dot.style.bottom = `-${Math.random() * 40 + 10}px`;
        dot.style.animationDelay = `${Math.random() * 6}s`;
        dot.style.animationDuration = `${6 + Math.random() * 6}s`;
        hero.appendChild(dot);
    }
}

window.addEventListener('resize', () => {
    if (isReducedMotion) return;
    clearTimeout(window.__particlesTimer);
    window.__particlesTimer = setTimeout(createHeroParticles, 200);
});

document.addEventListener('DOMContentLoaded', () => {
    if (!isReducedMotion) createHeroParticles();
});

// Card tilt effect
function addTiltEffect(element, maxTilt = 10) {
    if (!element) return;
    const height = element.clientHeight;
    const width = element.clientWidth;

    function handleMove(e) {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateY = ((x - width / 2) / width) * (maxTilt * 2);
        const rotateX = -((y - height / 2) / height) * (maxTilt * 2);
        element.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    }

    function reset() {
        element.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg)';
    }

    element.addEventListener('mousemove', handleMove);
    element.addEventListener('mouseleave', reset);
}

// Apply tilt to cards after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (!isTouchPointer) {
        document.querySelectorAll('.portfolio-item, .skill-category, .stat').forEach(el => addTiltEffect(el, 8));
    }
});

// Create dynamic light trails in hero
function createLightTrails() {
    const container = document.querySelector('.light-trails');
    if (!container) return;
    container.innerHTML = '';
    const count = window.innerWidth < 768 ? 8 : 14;
    for (let i = 0; i < count; i++) {
        const trail = document.createElement('span');
        trail.className = 'trail';
        const y = Math.random() * window.innerHeight;
        trail.style.top = `${y}px`;
        trail.style.setProperty('--y', `${(Math.random() * 40 - 20)}px`);
        trail.style.animationDelay = `${Math.random() * 6}s`;
        trail.style.animationDuration = `${5 + Math.random() * 5}s`;
        container.appendChild(trail);
    }
}

// Parallax for cyber grid
(function attachParallaxToGrid(){
    const grid = document.querySelector('.cyber-grid');
    if (!grid) return;
    if (isTouchPointer) return; // disable mouse-driven parallax on touch devices
    let raf = false, lastX = 0, lastY = 0;
    window.addEventListener('mousemove', (e) => {
        lastX = e.clientX; lastY = e.clientY;
        if (raf || isReducedMotion) return;
        raf = true;
        requestAnimationFrame(() => {
            const rx = (lastY / window.innerHeight - 0.5) * 6;
            const ry = (lastX / window.innerWidth - 0.5) * -6;
            grid.style.transform = `rotate(-8deg) translate3d(${ry}px, ${rx}px, 0)`;
            raf = false;
        });
    });
    window.addEventListener('mouseleave', () => {
        grid.style.transform = 'rotate(-8deg) translate3d(0,0,0)';
    });
})();

// Initialize on load and resize
document.addEventListener('DOMContentLoaded', () => {
    if (!isReducedMotion) createLightTrails();
});
window.addEventListener('resize', () => {
    if (isReducedMotion) return;
    clearTimeout(window.__trailTimer);
    window.__trailTimer = setTimeout(createLightTrails, 200);
});

// Starfield canvas
function initStarfield() {
    const canvas = document.querySelector('.starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const stars = [];
    let w, h;

    function resize() {
        w = canvas.width = window.innerWidth;
        const heroEl = document.querySelector('.hero');
        const rect = heroEl ? heroEl.getBoundingClientRect() : { height: window.innerHeight };
        // Add a small safety margin to avoid 1px seams from subpixel rounding
        h = canvas.height = Math.ceil(rect.height) + 6;
        stars.length = 0;
        const count = w < 768 ? 80 : 160;
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                z: Math.random() * 2 + 0.2,
                o: Math.random() * 0.8 + 0.2
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        for (const s of stars) {
            ctx.fillStyle = `rgba(255,255,255,${s.o})`;
            ctx.fillRect(s.x, s.y, s.z, s.z);
            s.x += s.z * 0.2;
            if (s.x > w) { s.x = 0; s.y = Math.random() * h; }
        }
        requestAnimationFrame(draw);
    }

    if (!isReducedMotion) {
        resize();
        draw();
        window.addEventListener('resize', resize);
    }
}

// Sync glitch text
function syncGlitch() {
    document.querySelectorAll('.glitch').forEach(el => {
        el.setAttribute('data-text', el.textContent);
    });
}

// Scroll progress
function handleScrollProgress() {
    const el = document.querySelector('.scroll-progress');
    if (!el) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = Math.max(0, Math.min(1, window.scrollY / max));
    el.style.width = pct * 100 + '%';
}
// (scroll progress handled inside onScroll)

// Spotlight follow
if (!isTouchPointer) {
    window.addEventListener('mousemove', (e) => {
        const spot = document.querySelector('.spotlight');
        if (!spot) return;
        spot.style.setProperty('--mx', e.clientX + 'px');
        spot.style.setProperty('--my', e.clientY + 'px');
    });
}

// Magnetic buttons
function initMagnetic() {
    document.querySelectorAll('.magnetic').forEach(btn => {
        const strength = 25;
        btn.addEventListener('mousemove', (e) => {
            const r = btn.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            const y = e.clientY - r.top - r.height / 2;
            btn.style.transform = `translate(${x / strength}px, ${y / strength}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0,0)';
        });
    });
}

// Cursor trail
function initCursorTrail() {
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const outline = document.createElement('div');
    outline.className = 'cursor-dot-outline';
    document.body.appendChild(dot);
    document.body.appendChild(outline);

    let x = 0, y = 0, ox = 0, oy = 0;
    window.addEventListener('mousemove', (e) => {
        x = e.clientX; y = e.clientY;
        dot.style.transform = `translate(${x}px, ${y}px)`;
    });
    function render() {
        ox += (x - ox) * 0.12; oy += (y - oy) * 0.12;
        outline.style.transform = `translate(${ox}px, ${oy}px)`;
        requestAnimationFrame(render);
    }
    render();
}

// Click ripple
function initRipple() {
    document.body.addEventListener('click', (e) => {
        const r = document.createElement('span');
        r.className = 'ripple';
        r.style.left = e.clientX + 'px';
        r.style.top = e.clientY + 'px';
        document.body.appendChild(r);
        setTimeout(() => r.remove(), 700);
    });
    const style = document.createElement('style');
    style.textContent = `.ripple{position:fixed;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:9999;background:radial-gradient(circle, rgba(255,255,255,0.9), rgba(96,165,250,0) 60%);transform:translate(-50%,-50%) scale(1);animation:ripple 0.7s ease-out forwards}@keyframes ripple{to{transform:translate(-50%,-50%) scale(28);opacity:0}}`;
    document.head.appendChild(style);
}

// Init all extra FX
document.addEventListener('DOMContentLoaded', () => {
    initStarfield();
    syncGlitch();
    handleScrollProgress();
    if (!isReducedMotion && !isTouchPointer) {
        initMagnetic();
        initCursorTrail();
        initRipple();
    }
    // (removed smoothing loop to avoid lag)
}); 

// Lead modal
(function leadModal(){
  const modal = document.getElementById('lead-modal');
  const dialog = modal ? modal.querySelector('.modal-dialog') : null;
  const openBtn = document.getElementById('open-lead-modal');
  const openBtn2 = document.getElementById('open-lead-modal-duplicate');
  const closeBtn = document.getElementById('close-lead-modal');
  const form = document.getElementById('lead-modal-form');
  if (!modal || !dialog || !openBtn || !closeBtn) return;

  let lastFocused = null;
  const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

  function trapFocus(e){
    const focusables = dialog.querySelectorAll(focusableSelector);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function open(){
    lastFocused = document.activeElement;
    modal.style.display = 'block';
    requestAnimationFrame(()=>{
      modal.classList.add('show');
      modal.setAttribute('aria-hidden','false');
      // Lock background scroll on mobile while modal is open
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onKeyDown);
      dialog.addEventListener('keydown', trapFocus);
      // focus first field
      const firstField = dialog.querySelector('input, textarea, button');
      if (firstField) firstField.focus();
    });
  }
  function close(){
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    document.removeEventListener('keydown', onKeyDown);
    dialog.removeEventListener('keydown', trapFocus);
    // Restore background scroll
    document.body.style.overflow = '';
    setTimeout(()=>{ 
      modal.style.display = 'none'; 
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }, 200);
  }
  function onKeyDown(e){ if(e.key === 'Escape') close(); }

  openBtn.addEventListener('click', open);
  if (openBtn2) openBtn2.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  modal.querySelector('.modal-backdrop').addEventListener('click', close);

  if (form) {
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      // Here you could POST to backend; keeping UX consistent
      close();
    });
  }
})(); 

// Low-end device guard
(function lowEndGuard(){
  const lowRam = navigator.deviceMemory && navigator.deviceMemory <= 4;
  const smallScreen = window.innerWidth < 768;
  const off = lowRam || smallScreen || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (!off) return;
  // Remove heavy visual effects
  document.querySelectorAll('.light-trails, .starfield').forEach(el => el.remove());
})(); 