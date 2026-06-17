# Uzair Moazzam — Portfolio Website

A premium, recruiter-focused AI/ML Engineering portfolio built with vanilla HTML, CSS, and JavaScript + Three.js.

---

## Folder Structure

```
portfolio/
├── index.html               ← Entry point (all sections: Hero, About, Skills, Experience, Projects, Research, Contact, Footer + Modals)
├── css/
│   └── style.css            ← Full design system: tokens, glassmorphism, animations, responsive breakpoints
├── js/
│   └── main.js              ← All JS: Three.js neural network bg, typed text, cursor, modals, reveals, magnetic buttons, counters
├── assets/
│   └── (optional)           ← Drop your profile photo here as `profile.jpg` and link in index.html if desired
└── README.md                ← This file
```

---

## What's Included

### Design
- Dark professional theme (`#0b0d11` base)
- Electric indigo accent (`#6c63ff`) — communicates AI/tech identity
- Space Grotesk (display/body) + JetBrains Mono (code/data labels)
- Glassmorphism cards (`backdrop-filter: blur`)
- Animated gradient text on hero name
- Fully responsive: mobile → tablet → desktop

### Animations & 3D
- **Three.js neural network**: animated particle field with dynamic edge connections and floating wireframe polyhedra
- **Orbit graphic**: rotating ring system with technology node labels (PyTorch, React, Python, HuggingFace) with 3D tilt on hover
- **Typed role**: cycles through "AI/ML Engineer", "Deep Learning Researcher", "Full-Stack Developer", "NLP Enthusiast"
- **Hero canvas particles**: lightweight 2D canvas dots in the hero background
- **Magnetic buttons**: cursor-following push effect on all CTAs
- **Reveal on scroll**: `IntersectionObserver`-driven fade + slide-in for every section
- **Stat counters**: numbers count up when scrolled into view
- **Skill tag stagger**: each tag animates in sequentially when its card appears
- **3D card tilt**: hero orbit responds to mouse movement with `perspective` rotation
- **Parallax**: hero graphic floats slightly on scroll
- **Custom cursor**: dot + follower ring, grows on interactive elements
- **Loader**: animated logo pulse + fill bar

### Sections
| Section | Content Source |
|---|---|
| Hero | Name, roles, bio, social links, CTA buttons |
| About | Education (LGU, CGPA, courses), stats (papers, internships, systems shipped) |
| Skills | All 4 categories directly from CV: AI/ML, Languages, Full-Stack, Tools |
| Experience | Binary Brains (AI/ML, Nov 2025–Feb 2026) + Techtomyy (MERN, Jul–Sep 2025) — animated timeline |
| Projects | SignVerse, Tea Leaf Detection, SwiftQuery, Charity System — modal popups per project |
| Research | Both papers with status badges, accuracy metrics, collaborators |
| Contact | Email, phone, location + mailto-powered contact form |
| Footer | Minimal with social links |

> **No section contains invented content.** Every fact, metric, project name, technology, and date is taken directly from the provided CV.

---

## Setup & Deployment

### Local (zero build tool needed)
```bash
# Option 1: Python
cd portfolio && python -m http.server 8080
# Open http://localhost:8080

# Option 2: Node.js
npx serve .

# Option 3: VS Code
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

> **Important:** Open via a local server (not `file://`) so Three.js CDN loads correctly.

### Add Your Profile Photo (optional)
1. Place your photo in `assets/` named `profile.jpg`
2. Add inside `.hero-graphic` in `index.html`:
```html
<img src="assets/profile.jpg" alt="Uzair Moazzam" class="hero-photo" />
```
3. Add to `css/style.css`:
```css
.hero-photo {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 110px; height: 110px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--accent);
  z-index: 2;
}
```

### Deploy to GitHub Pages
```bash
# From your repo root
git add .
git commit -m "feat: add portfolio site"
git push origin main

# Go to repo Settings → Pages → Source: Deploy from branch → main / root
# URL: https://Uzairrr21.github.io/<repo-name>/
```

### Deploy to Vercel (1 click)
- Import GitHub repo at vercel.com → Framework: Other → Root: `/` → Deploy

### Deploy to Netlify
- Drag-and-drop the `portfolio/` folder at app.netlify.com/drop

---

## GitHub Project Links

Update the placeholder GitHub links in `index.html` once your repos are renamed:

| Project | Suggested Repo Name |
|---|---|
| SignVerse | `SignVerse` |
| Tea Leaf Detection | `SwinTeaClassifier` |
| Urdu Fake News | `urdu-fake-news-detection` |
| SwiftQuery | `SwiftQuery` |
| Charity System | `mern-charity-platform` |

Replace `https://github.com/Uzairrr21` with the direct repo URL in each `project-icon-link` and modal `btn-primary` link.

---

## Customisation Quick Reference

| What | Where |
|---|---|
| Accent colour | `--accent` in `:root` (css/style.css line 11) |
| Role strings in typed animation | `roles` array in `main.js` (section 6) |
| Particle count | `PARTICLE_COUNT` in `main.js` (section 3) |
| Add new project card | Copy `.project-card` block + matching modal in `index.html` |
| Add new skill tag | Add `<span class="stag">...</span>` inside correct `.skill-group` |

---

## Performance Notes
- Three.js particle connections recalculated every 3rd frame to reduce CPU cost
- `devicePixelRatio` capped at 1.5 for the WebGL renderer
- All `scroll` event listeners use `{ passive: true }`
- Fonts loaded with `preconnect` hints
- No jQuery, no heavy UI libraries — total JS (excl. Three.js CDN) < 12 KB

---

*Built exclusively from CV content. All metrics, dates, and achievements are factual and verifiable.*