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