/* ======= EDIT ME ======= */
const CONFIG = {
  her:  'Keisha',     // her name (envelope + letter)
  you:  'aziz',    // signature
  date: 'February 14',  // date under the heading
  songs: [              // files live in assets/music/ ; she switches with the "next" button
    { title: '', file: 'assets/music/1.mp3' },
    { title: '', file: 'assets/music/2.mp3' },
    { title: '', file: 'assets/music/3.mp3' },
    { title: '', file: 'assets/music/4.mp3' }
  ],
  roamLines: [          // shown one by one each time she taps the character
    'Soon: #1 global roam player ✦',
    'you didnt lose... ㅤㅤㅤ ✦your teammates sucked✦'
  ]
};
/* ======================== */

const $ = (s, r = document) => r.querySelector(s);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, RM ? Math.min(ms, 80) : ms));

function fill() {
  document.querySelectorAll('[data-fill]').forEach(el => { el.textContent = CONFIG[el.dataset.fill]; });
  document.title = 'A letter for ' + CONFIG.her;
}

/* floating hearts + sparkles */
function makeParticles() {
  if (RM) return;
  const box = $('#particles'), n = innerWidth < 600 ? 14 : 24;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i'), sp = Math.random() > .55;
    p.textContent = sp ? '✦' : '♥';
    if (sp) p.className = 's';
    p.style.cssText = `left:${Math.random()*100}%;font-size:${8+Math.random()*10}px;` +
      `animation-duration:${14+Math.random()*14}s;animation-delay:${-Math.random()*20}s;--dx:${(Math.random()-.5)*80}px`;
    box.appendChild(p);
  }
}

/* character: appears at the end, tap for a message */
const guest = $('#guest'), hit = $('#guestHit'), roam = $('#roamText');
let ri = 0, rt;
function setGuest(on) {
  guest.classList.toggle('show', on);
  hit.classList.toggle('on', on);
  hit.tabIndex = on ? 0 : -1;
  if (!on) { roam.classList.remove('on'); clearTimeout(rt); }
}
hit.addEventListener('click', () => {
  const lines = CONFIG.roamLines || [];
  if (!lines.length) return;
  roam.textContent = lines[ri++ % lines.length];
  roam.classList.remove('on'); void roam.offsetWidth; roam.classList.add('on');
  clearTimeout(rt); rt = setTimeout(() => roam.classList.remove('on'), 4200);
  guest.classList.remove('tap'); void guest.offsetWidth; guest.classList.add('tap');
  if (RM) return;
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('span'), a = Math.random() * 6.28, d = 40 + Math.random() * 60;
    s.className = 'spark'; s.textContent = '✦';
    s.style.cssText = `--x:${Math.cos(a)*d}px;--y:${Math.sin(a)*d - 30}px`;
    hit.appendChild(s); setTimeout(() => s.remove(), 1500);
  }
});

/* scroll reveals */
let io, gio;
function observe() {
  io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
    if (e.target.classList.contains('close')) signature();
  }), { threshold: .25 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  gio = new IntersectionObserver(([e]) => setGuest(e.isIntersecting), { threshold: .6 });
  gio.observe($('#end'));
}

function signature() {
  const sig = $('#sig');
  setTimeout(() => sig.classList.add('go'), RM ? 0 : 700);
  if (RM) return;
  setTimeout(() => {
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('span'), a = Math.random() * 6.28, d = 50 + Math.random() * 70;
      s.className = 'spark'; s.textContent = '✦';
      s.style.cssText = `--x:${Math.cos(a)*d}px;--y:${Math.sin(a)*d}px`;
      sig.appendChild(s); setTimeout(() => s.remove(), 1500);
    }
  }, 2600);
}

/* hidden messages */
document.addEventListener('click', e => {
  const gem = e.target.closest('.gem');
  if (!gem) return;
  const open = gem.getAttribute('aria-expanded') === 'true';
  const p = gem.parentElement, old = p.querySelector('.tip');
  if (old) old.remove();
  gem.setAttribute('aria-expanded', String(!open));
  if (!open) {
    const t = document.createElement('span');
    t.className = 'tip'; t.setAttribute('role', 'status'); t.textContent = gem.dataset.msg;
    p.appendChild(t);
  }
});

/* open sequence */
let busy = false;
async function openLetter() {
  if (busy) return; busy = true;
  Music.start();                         // inside the tap, so iOS allows audio
  const intro = $('#intro'), env = $('#envelope'), seal = $('#seal');
  intro.classList.add('busy');
  seal.classList.add('pop');             await wait(380);
  env.classList.add('open');             await wait(1000);
  env.classList.add('out');              await wait(1100);
  intro.classList.add('leaving');        await wait(750);
  intro.style.display = 'none';
  const view = $('#letterView');
  view.hidden = false; view.classList.add('show');
  document.body.classList.remove('locked');
  scrollTo(0, 0);
  observe();
  busy = false;
}

/* replay */
async function replay() {
  scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
  await wait(600);
  const view = $('#letterView'), intro = $('#intro'), env = $('#envelope');
  view.hidden = true; view.classList.remove('show');
  view.querySelectorAll('.in,.go').forEach(el => el.classList.remove('in', 'go'));
  view.querySelectorAll('.tip').forEach(t => t.remove());
  view.querySelectorAll('.gem').forEach(g => g.setAttribute('aria-expanded', 'false'));
  if (io) io.disconnect();
  if (gio) gio.disconnect();
  setGuest(false);
  env.classList.remove('open', 'out'); $('#seal').classList.remove('pop');
  intro.classList.remove('busy', 'leaving');
  intro.style.display = '';
  document.body.classList.add('locked');
  scrollTo(0, 0);
}

$('#seal').addEventListener('click', openLetter);
$('#openBtn').addEventListener('click', openLetter);
$('#replay').addEventListener('click', replay);
fill(); makeParticles();

/* music: one small play/pause + next button */
const Music = (() => {
  const songs = CONFIG.songs || [], bad = new Set(), box = $('#player');
  if (!songs.length) return { start() {} };
  const audio = new Audio(), pp = $('#ppBtn'), nx = $('#nextBtn'), label = $('#trackName');
  let i = 0, started = false;
  audio.preload = 'none'; audio.volume = .7;
  const good = () => songs.length - bad.size;
  const setUI = on => {
    box.classList.toggle('playing', on);
    $('use', pp).setAttribute('href', on ? '#pause' : '#play');
    pp.setAttribute('aria-label', on ? 'Pause music' : 'Play music');
  };
  const load = k => { i = k; audio.src = songs[k].file; label.textContent = songs[k].title || 'Song ' + (k + 1); };
  const play = () => { const p = audio.play(); if (p) p.catch(() => setUI(false)); };
  const next = () => {
    if (!good()) { box.hidden = true; return; }
    let k = i; do { k = (k + 1) % songs.length; } while (bad.has(k));
    load(k); play();
  };
  audio.addEventListener('play', () => setUI(true));
  audio.addEventListener('pause', () => setUI(false));
  audio.addEventListener('ended', next);
  audio.addEventListener('error', () => { bad.add(i); good() ? next() : (box.hidden = true); });
  pp.addEventListener('click', () => { started = true; audio.paused ? play() : audio.pause(); });
  nx.addEventListener('click', () => { started = true; next(); });
  nx.hidden = songs.length < 2;
  load(0); box.hidden = false;
  return { start() { if (!started) { started = true; play(); } } };
})();
