document.addEventListener('DOMContentLoaded', () => {
  const yesBtn = document.getElementById('yesBtn');
  const noBtn  = document.getElementById('noBtn');
  const emoji  = document.getElementById('emoji');
  const riddle = document.getElementById('riddle');
  const logo   = document.getElementById('logoClue');
  const success= document.getElementById('success');
  const heartsBg = document.getElementById('hearts-bg');
  const confettiCanvas = document.getElementById('confetti');
  const ctx = confettiCanvas.getContext('2d');

  let attempts = 0;      // tentativi in cui il Sì è scappato
  let unlocked = false;  // quando risolvi l'indovinello cliccando il logo

  /* ===== Sfondo cuori che salgono ===== */
  (function floatingHearts(){
    function spawn(){
      const h = document.createElement('div');
      h.className = 'heart';
      h.textContent = Math.random() < 0.25 ? '💌' : (Math.random() < 0.5 ? '💖' : '💗');
      const size = 16 + Math.random()*30;
      const left = Math.random()*100;
      const dur  = 8 + Math.random()*10;
      const delay= Math.random()*-6;
      h.style.left = left + 'vw';
      h.style.fontSize = size + 'px';
      h.style.animationDuration = dur + 's';
      h.style.animationDelay = delay + 's';
      heartsBg.appendChild(h);
      setTimeout(()=>h.remove(), (dur*1000)+1500);
    }
    setInterval(spawn, 650);
    for (let i=0; i<10; i++) spawn();
  })();

  /* ===== Sì che scappa ===== */
  const area = document.querySelector('.btns');

  function moveYes(){
    if (unlocked) return; // se il gioco è sbloccato, non scappa più

    attempts++;

    const areaRect = area.getBoundingClientRect();
    const bw = yesBtn.offsetWidth, bh = yesBtn.offsetHeight;
    const padding = 8;

    const maxX = Math.max(0, areaRect.width  - bw - padding);
    const maxY = Math.max(0, areaRect.height - bh - padding);

    let x = padding + Math.random()*maxX;
    let y = padding + Math.random()*maxY;

    // piccola rotazione per l'effetto "furbetto"
    const rot = Math.random()*16 - 8;

    yesBtn.style.position = 'absolute';
    yesBtn.style.left = x + 'px';
    yesBtn.style.top  = y + 'px';
    yesBtn.style.transform = `translate(0,0) scale(0.95) rotate(${rot}deg)`;

    // Emoji che cambia ogni tanto
    if (attempts % 3 === 0) {
      emoji.textContent = '😅';
      setTimeout(()=> emoji.textContent = '🥰', 900);
    }

    // Dopo 5 tentativi mostra l'indovinello
    if (attempts === 5) {
      riddle.hidden = false;
      // piccolo glow sul logo (ma non troppo esplicito)
      logo.style.opacity = '.45';
      setTimeout(() => logo.style.opacity = '.35', 1600);
    }
  }

  // Eventi che fanno "scappare" il Sì (desktop+mobile+accessibilità)
  ['pointerenter','mouseenter','mouseover','pointerdown','touchstart','focus','click','keydown']
    .forEach(ev => yesBtn.addEventListener(ev, (e)=>{
      if (!unlocked) {
        e.preventDefault();
        e.stopPropagation();
        moveYes();
      }
    }, {passive:false}));

  // Il No è statico (opzionale: qualche micro-interazione)
  noBtn.addEventListener('click', () => {
    emoji.textContent = '🙃';
    setTimeout(()=> emoji.textContent = '🥰', 700);
  });

  /* ===== Soluzione indovinello: clicca il logo discreto in alto a destra ===== */
  logo.addEventListener('click', () => {
    if (unlocked) return;
    unlocked = true;
    riddle.querySelector('.riddle-text').innerHTML =
      '<em>Hai trovato il segno giusto. Ora il Sì si posa. ✨</em>';
    // ferma il Sì
    yesBtn.classList.add('stopped');
    yesBtn.style.left = '';
    yesBtn.style.top  = '';
    yesBtn.style.transform = '';
    // piccolo feedback
    yesBtn.animate(
      [{transform:'scale(0.92)'},{transform:'scale(1)'}],
      {duration:260, easing:'ease-out'}
    );
  });

  /* ===== Clic su Sì quando sbloccato → messaggio + confetti ===== */
  yesBtn.addEventListener('click', () => {
    if (!unlocked) return; // finché non risolvi, non fai partire il finale
    success.hidden = false;
    startConfetti();
  });

  /* ===== Confetti a cuori ===== */
  function resizeCanvas(){
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor(init=false){ this.reset(init); }
    reset(init=false){
      this.x = Math.random()*confettiCanvas.width;
      this.y = init ? -10 - Math.random()*120 : -10;
      this.size = 6 + Math.random()*12;
      this.vy = 1.8 + Math.random()*3;
      this.vx = -1 + Math.random()*2;
      this.rot = Math.random()*360;
      this.vr  = -3 + Math.random()*6;
      this.color = `hsl(${Math.random()*360}, 100%, 70%)`;
      this.isHeart = Math.random() > .5;
    }
    step(){
      this.y += this.vy; this.x += this.vx; this.rot += this.vr;
      if(this.y > confettiCanvas.height+20) this.reset();
    }
    draw(){
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot*Math.PI/180); ctx.fillStyle=this.color;
      if(this.isHeart){
        const s=this.size; ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.bezierCurveTo(-s/2,-s/2, -s, s/3, 0, s);
        ctx.bezierCurveTo( s, s/3,  s/2,-s/2, 0, 0);
        ctx.fill();
      }else{
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
      }
      ctx.restore();
    }
  }

  let particles=[], raf;
  function initParticles(){
    particles = [];
    const count = Math.min(160, Math.floor((confettiCanvas.width*confettiCanvas.height)/18000));
    for(let i=0;i<count;i++) particles.push(new Particle(true));
  }
  function animate(){
    ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
    particles.forEach(p=>{p.step(); p.draw();});
    raf = requestAnimationFrame(animate);
  }
  function startConfetti(){
    initParticles();
    cancelAnimationFrame(raf);
    animate();
  }
});