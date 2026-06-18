/* ================================================================
   UZAIR MOAZZAM — PORTFOLIO v2 — MAIN SCRIPT
   1. Loader
   2. Custom cursor
   3. Three.js 3D scene (rotating wireframe icosahedron core +
      orbiting particle shell + connecting edges + depth fog)
   4. Header scroll / active link
   5. Mobile menu
   6. Typed role text
   7. Reveal-on-scroll (IntersectionObserver)
   8. Magnetic buttons (.mag)
   9. Counter animation (stats)
   10. Project filter tabs
   11. Project modals
   12. Contact form → mailto
   13. Hero profile parallax tilt
================================================================ */
'use strict';

/* ---------- 1. LOADER ---------- */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => {
    loader.classList.add('gone');
    document.querySelectorAll('.hero .fade-in').forEach((el, i) => {
      setTimeout(() => el.classList.add('vis'), i * 110);
    });
  }, 1700);
});

/* ---------- 2. CUSTOM CURSOR ---------- */
(function cursor(){
  const dot = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');
  if(!dot || !ring) return;
  let mx=0,my=0,rx=0,ry=0;

  document.addEventListener('mousemove', e=>{
    mx=e.clientX; my=e.clientY;
    dot.style.left=mx+'px'; dot.style.top=my+'px';
  });
  (function loop(){
    rx += (mx-rx)*0.15; ry += (my-ry)*0.15;
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll('a,button,.proj-card,.glass,.cinfo').forEach(el=>{
    el.addEventListener('mouseenter', ()=>document.body.classList.add('hovered'));
    el.addEventListener('mouseleave', ()=>document.body.classList.remove('hovered'));
  });
})();

/* ---------- 3. THREE.JS 3D SCENE ---------- */
(function scene3d(){
  const canvas = document.getElementById('webgl');
  if(!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0,0,9);

  // Fog for depth
  scene.fog = new THREE.FogExp2(0x080c14, 0.045);

  /* --- Group that holds everything, rotates as a whole slowly --- */
  const root = new THREE.Group();
  scene.add(root);

  /* --- Core: wireframe icosahedron (the "brain" of the scene) --- */
  const coreGeo = new THREE.IcosahedronGeometry(1.6, 1);
  const coreMat = new THREE.MeshBasicMaterial({ color:0x7c3aed, wireframe:true, transparent:true, opacity:0.35 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  root.add(core);

  // Inner solid faint core for depth
  const innerMat = new THREE.MeshBasicMaterial({ color:0x06b6d4, transparent:true, opacity:0.04 });
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(1.55,1), innerMat);
  root.add(inner);

  /* --- Orbiting ring of small nodes (neural-style) --- */
  const NODE_COUNT = 70;
  const nodeGeo = new THREE.BufferGeometry();
  const nodePos = new Float32Array(NODE_COUNT*3);
  const nodeData = [];
  for(let i=0;i<NODE_COUNT;i++){
    const radius = 3 + Math.random()*4.5;
    const theta = Math.random()*Math.PI*2;
    const phi = Math.acos((Math.random()*2)-1);
    const x = radius*Math.sin(phi)*Math.cos(theta);
    const y = radius*Math.sin(phi)*Math.sin(theta);
    const z = radius*Math.cos(phi);
    nodePos[i*3]=x; nodePos[i*3+1]=y; nodePos[i*3+2]=z;
    nodeData.push({ baseX:x, baseY:y, baseZ:z, speed:0.1+Math.random()*0.25, offset:Math.random()*Math.PI*2 });
  }
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos,3));
  const nodeMat = new THREE.PointsMaterial({ color:0x9d96ff, size:0.045, transparent:true, opacity:0.85, sizeAttenuation:true });
  const nodeCloud = new THREE.Points(nodeGeo, nodeMat);
  root.add(nodeCloud);

  /* --- Connection lines between nearby orbiting nodes --- */
  const MAX_LINES = 90;
  const linePos = new Float32Array(MAX_LINES*6);
  const lineGeo = new THREE.BufferGeometry();
  const linePosAttr = new THREE.BufferAttribute(linePos,3);
  linePosAttr.setUsage(THREE.DynamicDrawUsage);
  lineGeo.setAttribute('position', linePosAttr);
  lineGeo.setDrawRange(0,0);
  const lineMat = new THREE.LineBasicMaterial({ color:0x7c3aed, transparent:true, opacity:0.12 });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  root.add(lines);

  /* --- Floating geometric shapes drifting in background --- */
  const shapes = [];
  const shapeGeos = [
    new THREE.TetrahedronGeometry(0.22),
    new THREE.OctahedronGeometry(0.2),
    new THREE.TorusGeometry(0.18,0.05,8,16),
  ];
  for(let i=0;i<10;i++){
    const g = shapeGeos[i % shapeGeos.length];
    const m = new THREE.MeshBasicMaterial({ color: i%2===0?0x06b6d4:0x7c3aed, wireframe:true, transparent:true, opacity:0.22 });
    const mesh = new THREE.Mesh(g,m);
    mesh.position.set((Math.random()-0.5)*16,(Math.random()-0.5)*11,(Math.random()-0.5)*8 - 3);
    mesh.userData = {
      rx:(Math.random()-0.5)*0.01, ry:(Math.random()-0.5)*0.01,
      floatPhase:Math.random()*Math.PI*2, floatSpeed:0.004+Math.random()*0.004,
      baseY:mesh.position.y
    };
    scene.add(mesh);
    shapes.push(mesh);
  }

  /* --- Mouse parallax (camera + root rotation) --- */
  let tx=0, ty=0, cx=0, cy=0;
  document.addEventListener('mousemove', e=>{
    tx = (e.clientX/window.innerWidth - 0.5);
    ty = (e.clientY/window.innerHeight - 0.5);
  });

  let t=0;
  function animate(){
    requestAnimationFrame(animate);
    t += 0.01;

    cx += (tx-cx)*0.04; cy += (ty-cy)*0.04;
    camera.position.x = cx*1.4;
    camera.position.y = -cy*1.0;
    camera.lookAt(0,0,0);

    root.rotation.y += 0.0016;
    root.rotation.x = Math.sin(t*0.15)*0.08;
    core.rotation.y -= 0.002;
    core.rotation.x += 0.001;
    inner.rotation.y -= 0.002;
    inner.rotation.x += 0.001;

    // animate node cloud gentle bob
    const posAttr = nodeGeo.attributes.position;
    for(let i=0;i<NODE_COUNT;i++){
      const d = nodeData[i];
      posAttr.array[i*3+1] = d.baseY + Math.sin(t*d.speed + d.offset)*0.25;
    }
    posAttr.needsUpdate = true;

    // recompute connection lines occasionally
    if(Math.floor(t*60) % 4 === 0){
      let count=0;
      const DIST_SQ = 3.0;
      for(let a=0; a<NODE_COUNT && count<MAX_LINES; a++){
        for(let b=a+1; b<NODE_COUNT && count<MAX_LINES; b++){
          const dx=posAttr.array[a*3]-posAttr.array[b*3];
          const dy=posAttr.array[a*3+1]-posAttr.array[b*3+1];
          const dz=posAttr.array[a*3+2]-posAttr.array[b*3+2];
          if(dx*dx+dy*dy+dz*dz < DIST_SQ){
            const base=count*6;
            linePos[base]=posAttr.array[a*3]; linePos[base+1]=posAttr.array[a*3+1]; linePos[base+2]=posAttr.array[a*3+2];
            linePos[base+3]=posAttr.array[b*3]; linePos[base+4]=posAttr.array[b*3+1]; linePos[base+5]=posAttr.array[b*3+2];
            count++;
          }
        }
      }
      lineGeo.setDrawRange(0,count*2);
      linePosAttr.needsUpdate = true;
    }

    // drift shapes
    shapes.forEach(s=>{
      s.rotation.x += s.userData.rx;
      s.rotation.y += s.userData.ry;
      s.userData.floatPhase += s.userData.floatSpeed;
      s.position.y = s.userData.baseY + Math.sin(s.userData.floatPhase)*0.5;
    });

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

/* ---------- 4. HEADER SCROLL + ACTIVE NAV ---------- */
(function header(){
  const hdr = document.getElementById('hdr');
  const links = document.querySelectorAll('.nl');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', ()=>{
    if(window.scrollY>50) hdr.classList.add('stuck'); else hdr.classList.remove('stuck');
    let cur='';
    sections.forEach(s=>{ if(window.scrollY >= s.offsetTop-140) cur=s.id; });
    links.forEach(l=>{
      l.classList.toggle('on', l.getAttribute('href')==='#'+cur);
    });
  }, {passive:true});
})();

/* ---------- 5. MOBILE MENU ---------- */
(function mobileMenu(){
  const ham = document.getElementById('ham');
  const nav = document.getElementById('navLinks');
  if(!ham||!nav) return;
  ham.addEventListener('click', ()=>{
    const open = nav.classList.toggle('open');
    ham.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  nav.querySelectorAll('.nl').forEach(l=>l.addEventListener('click', ()=>{
    nav.classList.remove('open'); ham.classList.remove('open'); document.body.style.overflow='';
  }));
  document.addEventListener('click', e=>{
    if(!nav.contains(e.target) && !ham.contains(e.target)){
      nav.classList.remove('open'); ham.classList.remove('open'); document.body.style.overflow='';
    }
  });
})();

/* ---------- 6. TYPED ROLE TEXT ---------- */
(function typed(){
  const el = document.getElementById('typed');
  if(!el) return;
  const roles = ['Junior AI/ML Engineer','Deep Learning Practitioner','Full-Stack Developer','Computer Vision Builder'];
  let ri=0, ci=0, deleting=false;

  function step(){
    const word = roles[ri];
    if(deleting){
      ci--; el.textContent = word.slice(0,ci);
      if(ci===0){ deleting=false; ri=(ri+1)%roles.length; setTimeout(step,350); return; }
      setTimeout(step,40);
    } else {
      ci++; el.textContent = word.slice(0,ci);
      if(ci===word.length){ deleting=true; setTimeout(step,2000); return; }
      setTimeout(step,75);
    }
  }
  setTimeout(step,2000);
})();

/* ---------- 7. REVEAL ON SCROLL ---------- */
(function reveal(){
  const targets = document.querySelectorAll('.reveal,.reveal-l,.reveal-r');
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('vis'); });
  }, {threshold:0.12, rootMargin:'0px 0px -50px 0px'});
  targets.forEach(t=>obs.observe(t));
})();

/* ---------- 8. MAGNETIC BUTTONS ---------- */
(function magnetic(){
  document.querySelectorAll('.mag').forEach(el=>{
    el.addEventListener('mousemove', e=>{
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width/2;
      const y = e.clientY - r.top - r.height/2;
      el.style.transform = `translate(${x*0.2}px, ${y*0.2}px)`;
    });
    el.addEventListener('mouseleave', ()=>{ el.style.transform=''; });
  });
})();

/* ---------- 9. COUNTER ANIMATION ---------- */
(function counters(){
  const nums = document.querySelectorAll('.snum');
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.target);
      const isDecimal = el.classList.contains('decimal');
      const duration = 1100;
      const start = performance.now();
      function tick(now){
        const p = Math.min((now-start)/duration,1);
        const eased = 1 - Math.pow(1-p,3);
        const val = target*eased;
        el.textContent = isDecimal ? val.toFixed(2) : Math.round(val);
        if(p<1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, {threshold:0.5});
  nums.forEach(n=>obs.observe(n));
})();

/* ---------- 10. PROJECT FILTER TABS ---------- */
(function filters(){
  const tabs = document.querySelectorAll('.ftab');
  const cards = document.querySelectorAll('.proj-card');
  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      tabs.forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      cards.forEach(card=>{
        const cats = (card.dataset.cat||'').split(' ');
        const show = filter==='all' || cats.includes(filter);
        card.classList.toggle('hidden', !show);
      });
    });
  });
})();

/* ---------- 11. PROJECT MODALS ---------- */
(function modals(){
  document.querySelectorAll('.pc-detail').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const card = btn.closest('[data-modal]');
      const id = card?.dataset.modal;
      if(!id) return;
      const modal = document.getElementById(id);
      if(modal) open(modal);
    });
  });
  // allow clicking the card itself (not on a link) to open
  document.querySelectorAll('.proj-card[data-modal]').forEach(card=>{
    card.addEventListener('click', e=>{
      if(e.target.closest('a') || e.target.closest('.pc-detail')) return;
      const modal = document.getElementById(card.dataset.modal);
      if(modal) open(modal);
    });
  });
  document.querySelectorAll('[data-close]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const modal = el.closest('.modal');
      if(modal) close(modal);
    });
  });
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape') document.querySelectorAll('.modal.open').forEach(close);
  });
  function open(modal){ modal.classList.add('open'); document.body.style.overflow='hidden'; }
  function close(modal){ modal.classList.remove('open'); document.body.style.overflow=''; }
})();

/* ---------- 12. CONTACT FORM → MAILTO ---------- */
function sendMsg(){
  const name = document.getElementById('fname').value.trim();
  const email = document.getElementById('femail').value.trim();
  const subject = document.getElementById('fsubject').value.trim();
  const msg = document.getElementById('fmsg').value.trim();
  const status = document.getElementById('form-status');
  const btn = document.getElementById('sendBtn');

  status.className='form-status';

  if(!name||!email||!subject||!msg){
    status.classList.add('err');
    status.textContent='⚠ Please fill in all required fields.';
    return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    status.classList.add('err');
    status.textContent='⚠ Please enter a valid email address.';
    return;
  }

  const mailSubject = encodeURIComponent(subject);
  const mailBody = encodeURIComponent(`${msg}\n\n— ${name}\n${email}`);
  window.location.href = `mailto:umoazzam58@gmail.com?subject=${mailSubject}&body=${mailBody}`;

  btn.innerHTML = '<i class="fas fa-check"></i> Opening mail app…';
  status.classList.add('ok');
  status.textContent = 'Your email client should open now. If it doesn\'t, email umoazzam58@gmail.com directly.';

  setTimeout(()=>{
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
    status.textContent='';
    status.className='form-status';
    document.getElementById('fname').value='';
    document.getElementById('femail').value='';
    document.getElementById('fsubject').value='';
    document.getElementById('fmsg').value='';
  }, 5000);
}

/* ---------- 13. PROFILE TILT (hero) ---------- */
(function skillGlobe(){
  const stage = document.querySelector('.globe-stage');
  const canvas = document.getElementById('skillGlobe');
  if(!stage || !canvas || typeof THREE === 'undefined') return;

  // Text-label badges — no external glyph-font dependency, so rendering
  // never silently breaks on a wrong/unsupported icon codepoint.
  const ICONS = [
    {label:'Python',     short:'Py',   color:'#3776ab', img:'python'},
    {label:'PyTorch',    short:'PT',   color:'#ee4c2c', img:'pytorch'},
    {label:'TensorFlow', short:'TF',   color:'#ff8f00', img:'tensorflow'},
    {label:'React',      short:'⚛',    color:'#61dafb', img:'react'},
    {label:'Node.js',    short:'JS',   color:'#5fa04e', img:'nodejs'},
    {label:'TypeScript', short:'TS',   color:'#3178c6', img:'typescript'},
    {label:'Docker',     short:'Dk',   color:'#2496ed', img:'docker'},
    {label:'GitHub',     short:'Git',  color:'#e6edf3', img:'github'},
    {label:'HuggingFace',short:'🤗',   color:'#ffcc4d', img:'huggingface'},
    {label:'MongoDB',    short:'Mg',   color:'#47a248', img:'mongodb'},
    {label:'OpenCV',     short:'CV',   color:'#5c3ee8', img:'opencv'},
    {label:'C++',        short:'C++',  color:'#00599c', img:'cpp'},
    {label:'FastAPI',    short:'API',  color:'#06b6d4', img:'fastapi'},
    {label:'Deep Learning', short:'AI',color:'#a855f7', img:'ai'},
    {label:'Vercel',     short:'▲',    color:'#a1a1aa', img:'vercel'},
    {label:'LangChain',  short:'LC',   color:'#22d3ee', img:'langchain'},
    {label:'Linux',      short:'Lx',   color:'#fcc624', img:'linux'},
    {label:'NumPy',      short:'Np',   color:'#4d77cf', img:'numpy'},
  ];

  function makeIconSprite(item){
    const size = 160;
    const cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    const ctx = cv.getContext('2d');

    function drawBase(){
      ctx.clearRect(0,0,size,size);
      // outer circle
      ctx.beginPath();
      ctx.arc(size/2, size/2, size/2-10, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(13,18,32,0.94)';
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.stroke();
      // inner ring accent
      ctx.beginPath();
      ctx.arc(size/2, size/2, size/2-16, 0, Math.PI*2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = item.color + '88';
      ctx.stroke();
    }

    drawBase();

    const slug = (item.img || item.label).toString().toLowerCase().replace(/[^a-z0-9]/g,'');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `assets/icons/${slug}.png`;
    // if image exists, draw clipped circular image, else draw text fallback
    img.onload = ()=>{
      drawBase();
      const s = size*0.62;
      ctx.save();
      ctx.beginPath();
      ctx.arc(size/2, size/2, s/2, 0, Math.PI*2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, size/2 - s/2, size/2 - s/2, s, s);
      ctx.restore();
      tex.needsUpdate = true;
    };
    img.onerror = ()=>{
      // text fallback
      const fontSize = item.short.length > 2 ? 38 : 50;
      ctx.font = `800 ${fontSize}px 'Fira Code', monospace`;
      ctx.fillStyle = item.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 22;
      ctx.fillText(item.short, size/2, size/2+2);
      tex.needsUpdate = true;
    };

    const tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent:true, depthWrite:false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.48,0.48,0.48);
    sprite.userData.label = item.label;
    return sprite;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0,0,7.2);

  const globeRoot = new THREE.Group();
  scene.add(globeRoot);

  const RADIUS = 2.5;

  // Wireframe sphere shell
  const wireGeo = new THREE.SphereGeometry(RADIUS, 22, 16);
  const wireMat = new THREE.MeshBasicMaterial({ color:0x3a4a7c, wireframe:true, transparent:true, opacity:0.35 });
  const wireSphere = new THREE.Mesh(wireGeo, wireMat);
  globeRoot.add(wireSphere);

  // Faint inner glow sphere
  const innerGeo = new THREE.SphereGeometry(RADIUS*0.97, 24, 24);
  const innerMat = new THREE.MeshBasicMaterial({ color:0x7c3aed, transparent:true, opacity:0.05 });
  globeRoot.add(new THREE.Mesh(innerGeo, innerMat));

  // Outer glow ring (rim light effect via slightly larger backside sphere)
  const rimGeo = new THREE.SphereGeometry(RADIUS*1.015, 24, 24);
  const rimMat = new THREE.MeshBasicMaterial({ color:0x06b6d4, transparent:true, opacity:0.06, side:THREE.BackSide });
  globeRoot.add(new THREE.Mesh(rimGeo, rimMat));

  // Distribute icons on sphere using Fibonacci lattice and apply simple relaxation
  const n = ICONS.length;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const positions = [];
  for(let i=0;i<n;i++){
    const yFrac = 1 - (i/(n-1))*2;          // 1 → -1
    const radiusAtY = Math.sqrt(1 - yFrac*yFrac);
    const theta = goldenAngle * i;
    const x = Math.cos(theta)*radiusAtY;
    const z = Math.sin(theta)*radiusAtY;
    positions.push(new THREE.Vector3(x,yFrac,z).multiplyScalar(RADIUS));
  }

  // basic pairwise repulsion on the sphere surface to reduce overlap
  const minSep = 0.9; // minimum separation (approx)
  for(let iter=0; iter<32; iter++){
    let moved = false;
    for(let a=0;a<n;a++){
      for(let b=a+1;b<n;b++){
        const pa = positions[a];
        const pb = positions[b];
        const d = pa.distanceTo(pb);
        if(d < minSep){
          const overlap = (minSep - d) * 0.5;
          const dir = pa.clone().sub(pb).normalize();
          pa.add(dir.clone().multiplyScalar(overlap));
          pb.add(dir.clone().multiplyScalar(-overlap));
          moved = true;
        }
      }
    }
    // reproject to sphere radius
    for(let k=0;k<n;k++) positions[k].setLength(RADIUS);
    if(!moved) break;
  }

  // create sprites at relaxed positions
  ICONS.forEach((item,i)=>{
    const sprite = makeIconSprite(item);
    sprite.position.copy(positions[i]);
    globeRoot.add(sprite);
  });

  // Subtle starfield dust around the globe
  const dustCount = 80;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount*3);
  for(let i=0;i<dustCount;i++){
    const r = RADIUS*1.7 + Math.random()*2.2;
    const theta = Math.random()*Math.PI*2;
    const phi = Math.acos(Math.random()*2-1);
    dustPos[i*3]   = r*Math.sin(phi)*Math.cos(theta);
    dustPos[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
    dustPos[i*3+2] = r*Math.cos(phi);
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos,3));
  const dustMat = new THREE.PointsMaterial({ color:0x9d96ff, size:0.03, transparent:true, opacity:0.5 });
  scene.add(new THREE.Points(dustGeo, dustMat));

  function resize(){
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if(w===0||h===0) return;
    renderer.setSize(w,h,false);
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* --- Drag-to-rotate + auto-spin --- */
  let autoSpin = true;
  let dragging = false;
  let lastX=0, lastY=0;
  let velY=0.0028, velX=0;

  function pointerDown(x,y){
    dragging = true; autoSpin = false;
    lastX = x; lastY = y;
    stage.style.cursor = 'grabbing';
  }
  function pointerMove(x,y){
    if(!dragging) return;
    const dx = x-lastX, dy = y-lastY;
    globeRoot.rotation.y += dx*0.005;
    globeRoot.rotation.x += dy*0.005;
    globeRoot.rotation.x = Math.max(-1.1, Math.min(1.1, globeRoot.rotation.x));
    velY = dx*0.0002;
    velX = dy*0.0002;
    lastX=x; lastY=y;
  }
  function pointerUp(){
    dragging = false;
    stage.style.cursor = 'grab';
    setTimeout(()=>{ if(!dragging) autoSpin = true; }, 2200);
  }

  stage.addEventListener('mousedown', e=>pointerDown(e.clientX,e.clientY));
  window.addEventListener('mousemove', e=>pointerMove(e.clientX,e.clientY));
  window.addEventListener('mouseup', pointerUp);

  stage.addEventListener('touchstart', e=>{
    const t = e.touches[0]; pointerDown(t.clientX,t.clientY);
  }, {passive:true});
  stage.addEventListener('touchmove', e=>{
    const t = e.touches[0]; pointerMove(t.clientX,t.clientY);
  }, {passive:true});
  stage.addEventListener('touchend', pointerUp);

  let visible = true;
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ visible = e.isIntersecting; });
  }, {threshold:0.05});
  io.observe(stage);

  function animate(){
    requestAnimationFrame(animate);
    if(!visible) return;

    if(autoSpin){
      globeRoot.rotation.y += 0.0024;
    } else if(!dragging){
      // momentum decay
      globeRoot.rotation.y += velY;
      globeRoot.rotation.x += velX;
      velY *= 0.94; velX *= 0.94;
    }

    // sprites always face camera automatically (THREE.Sprite default)
    renderer.render(scene, camera);
  }
  animate();

})();

/* ---------- 13. PROFILE TILT (hero) ---------- */
(function contactCopy(){
  // Delegated handler for copy buttons in contact cards
  document.addEventListener('click', async (e)=>{
    const btn = e.target.closest('.ci-copy');
    if(!btn) return;
    e.preventDefault();
    const value = btn.getAttribute('data-copy');
    if(!value) return;
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement('textarea');
        ta.value = value; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }
      // feedback
      btn.classList.add('copied');
      const icon = btn.querySelector('i');
      const old = icon ? icon.className : '';
      if(icon) icon.className = 'fas fa-check';
      setTimeout(()=>{
        btn.classList.remove('copied');
        if(icon) icon.className = old;
      }, 1400);
    }catch(err){
      console.error('Copy failed', err);
    }
  });
})();
(function profileTilt(){
  const frame = document.getElementById('profileFrame');
  if(!frame) return;
  frame.addEventListener('mousemove', e=>{
    const r = frame.getBoundingClientRect();
    const x = (e.clientX-r.left)/r.width - 0.5;
    const y = (e.clientY-r.top)/r.height - 0.5;
    frame.style.transform = `perspective(900px) rotateY(${x*12}deg) rotateX(${-y*12}deg)`;
  });
  frame.addEventListener('mouseleave', ()=>{
    frame.style.transition='transform .6s cubic-bezier(.34,1.56,.64,1)';
    frame.style.transform='';
    setTimeout(()=>frame.style.transition='', 600);
  });
})();
// Completed