// Consolidated scripts for a reusable slider used by publications and certifications
// Global state
let allPublications = [];
let showingSelected = true;

// Initialize AOS (Animate On Scroll)
function initializeAOS() {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out-quad',
      once: true,
      offset: 100,
      disable: 'mobile' // Disable on mobile devices for better performance
    });
  }
}

// Dark mode toggle functionality
function initializeThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;
  
  // Check localStorage for saved theme preference
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    htmlElement.classList.add('dark-mode');
    updateThemeIcon(true);
  }
  
  // Add click listener to toggle button
  themeToggle.addEventListener('click', () => {
    const isDarkMode = htmlElement.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    updateThemeIcon(isDarkMode);
  });
}

function updateThemeIcon(isDarkMode) {
  const themeToggle = document.getElementById('theme-toggle');
  const icon = themeToggle.querySelector('i');
  if (isDarkMode) {
    icon.classList.remove('fa-moon-o');
    icon.classList.add('fa-sun-o');
  } else {
    icon.classList.remove('fa-sun-o');
    icon.classList.add('fa-moon-o');
  }
}

// Generic responsive slider class used for both publications and certifications
class Slider {
  constructor({ track, prevBtn, nextBtn, maxPerPage = 3, moveByPage = false, pageIndicator = null }) {
    this.track = track;
    this.prevBtn = prevBtn;
    this.nextBtn = nextBtn;
    this.maxPerPage = maxPerPage;
    this.moveByPage = moveByPage; // if true, next/prev move by a page (itemsPerView)
    this.pageIndicator = pageIndicator;

    this.items = Array.from(this.track.children);
    this.currentIndex = 0; // leftmost visible item index
    this.itemsPerView = 1;

    this._onResize = this.updateLayout.bind(this);
    window.addEventListener('resize', this._onResize);

    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.goPrev());
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.goNext());

    // small throttle for initial layout after images load
    window.requestAnimationFrame(() => this.updateLayout());
  }

  refreshItems() {
    this.items = Array.from(this.track.children);
    // ensure little gap on inline items for calculations
    this.items.forEach((it) => { it.style.marginRight = it.style.marginRight || '16px'; });
    this.updateLayout();
  }

  getViewportWidth() {
    return this.track.parentElement ? this.track.parentElement.clientWidth : this.track.clientWidth;
  }

  updateLayout() {
    if (!this.items || this.items.length === 0) return;

    const viewportWidth = this.getViewportWidth();

    // Measure natural item width (including right-gap) if present
    const firstRect = this.items[0].getBoundingClientRect();
    const computed = window.getComputedStyle(this.items[0]);
    const gap = 16; // approximate gap used in CSS/layout
    const naturalItemWidth = firstRect.width + gap;

    // Determine items per view by available width and maxPerPage constraint
    const possible = Math.max(1, Math.floor(viewportWidth / naturalItemWidth));
    this.itemsPerView = Math.min(this.maxPerPage, possible);

    // For better fit, compute a snug item width and apply as flex-basis when items are created by JS
    const totalGap = (this.itemsPerView - 1) * gap;
    const snugWidth = Math.floor((viewportWidth - totalGap) / this.itemsPerView);

    // Apply width for items we control (inline styles won't break existing CSS)
    this.items.forEach((it) => {
      it.style.flex = `0 0 ${snugWidth}px`;
    });

    // Recalculate maximum leftmost index
    const maxIndex = Math.max(0, this.items.length - this.itemsPerView);
    if (this.currentIndex > maxIndex) this.currentIndex = maxIndex;

    // Apply transform
    const offset = -(this.currentIndex * (snugWidth + gap));
    this.track.style.transform = `translateX(${offset}px)`;
    this.track.style.transition = 'transform 300ms ease';

    // Update controls
    if (this.prevBtn) this.prevBtn.disabled = this.currentIndex === 0;
    if (this.nextBtn) this.nextBtn.disabled = this.currentIndex >= maxIndex;

    // Update page indicator (if provided) to show pages for page-move sliders
    if (this.pageIndicator) {
      const totalPages = Math.max(1, Math.ceil(this.items.length / this.itemsPerView));
      const currentPage = Math.floor(this.currentIndex / this.itemsPerView) + 1;
      this.pageIndicator.textContent = `${currentPage} / ${totalPages}`;
    }
  }

  goPrev() {
    if (this.currentIndex === 0) return;
    const step = this.moveByPage ? this.itemsPerView : 1;
    this.currentIndex = Math.max(0, this.currentIndex - step);
    this.updateLayout();
  }

  goNext() {
    const maxIndex = Math.max(0, this.items.length - this.itemsPerView);
    if (this.currentIndex >= maxIndex) return;
    const step = this.moveByPage ? this.itemsPerView : 1;
    this.currentIndex = Math.min(maxIndex, this.currentIndex + step);
    this.updateLayout();
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
  }
}

// Hold reference to publication slider so we can refresh when content changes
let pubSlider = null;

// Fetch and apply dynamic background theme
async function applyDynamicBackground() {
  try {
    // Get random background image from Unsplash API (free tier, no key required for limited requests)
    // Using curated collections for academic/professional themes
    const query = 'minimal abstract professional';
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&w=1920`,
      {
        headers: {
          'Accept-Version': 'v1'
        }
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch background');
    
    const data = await response.json();
    const imageUrl = data.urls.regular;
    
    // Apply background with gradient overlay for readability
    document.body.style.backgroundImage = `
      linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.92) 100%),
      url('${imageUrl}')
    `;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundBlendMode = 'overlay';
    
  } catch (error) {
    console.log('Background theme not available, using default');
    // Fallback to default - no error needed
  }
}

// Initialize scroll animations with Intersection Observer
function initializeScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 0.8s ease-out forwards';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all sections
  document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    observer.observe(section);
  });
}

// Create 3D rotating cube for header
function initiate3DCube() {
  const container = document.getElementById('cube-container');
  if (!container) return;

  const scene = new THREE.Scene();
  const width = 120;
  const height = 120;
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  camera.position.z = 2;

  // Create rotating cube with gradient colors
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  
  const materials = [
    new THREE.MeshPhongMaterial({ color: 0x4a74b9 }), // Blue
    new THREE.MeshPhongMaterial({ color: 0x3a5c9e }), // Dark Blue
    new THREE.MeshPhongMaterial({ color: 0x00ccbb }), // Teal
    new THREE.MeshPhongMaterial({ color: 0x5865f2 }), // Purple
    new THREE.MeshPhongMaterial({ color: 0xa6ce39 }), // Green
    new THREE.MeshPhongMaterial({ color: 0x718096 })  // Gray
  ];
  
  const cube = new THREE.Mesh(geometry, materials);
  scene.add(cube);

  // Add lighting
  const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
  light1.position.set(5, 5, 5);
  scene.add(light1);

  const light2 = new THREE.DirectionalLight(0xffffff, 0.4);
  light2.position.set(-5, -5, 5);
  scene.add(light2);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    cube.rotation.x += 0.005;
    cube.rotation.y += 0.008;
    cube.rotation.z += 0.003;
    
    renderer.render(scene, camera);
  }
  animate();

  // Handle window resize
  window.addEventListener('resize', () => {
    renderer.setSize(width, height);
  });
}

// Create 3D VR Headset model for About section
function initiate3DRobot() {
  const container = document.getElementById('robot-container');
  if (!container) return;

  const scene = new THREE.Scene();
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);

  // Create VR headset group
  const vrHeadset = new THREE.Group();

  // Materials
  const headsetMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x2d2d44, 
    shininess: 80 
  });
  const lensMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x1a1a2e, 
    emissive: 0x4a74b9, 
    emissiveIntensity: 0.3,
    shininess: 100 
  });
  const accentMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x4a74b9,
    emissive: 0x4a74b9,
    emissiveIntensity: 0.5
  });
  const strapMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x3a3a52 
  });

  // Main headset body
  const bodyGeometry = new THREE.BoxGeometry(2.2, 1.2, 1.4);
  const body = new THREE.Mesh(bodyGeometry, headsetMaterial);
  body.position.z = 0;
  vrHeadset.add(body);

  // Front face plate (slightly protruding)
  const facePlateGeometry = new THREE.BoxGeometry(2.3, 1.25, 0.3);
  const facePlate = new THREE.Mesh(facePlateGeometry, headsetMaterial);
  facePlate.position.z = 0.85;
  vrHeadset.add(facePlate);

  // Left lens
  const lensGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 32);
  const leftLens = new THREE.Mesh(lensGeometry, lensMaterial);
  leftLens.rotation.x = Math.PI / 2;
  leftLens.position.set(-0.5, 0.1, 1);
  vrHeadset.add(leftLens);

  // Right lens
  const rightLens = new THREE.Mesh(lensGeometry, lensMaterial);
  rightLens.rotation.x = Math.PI / 2;
  rightLens.position.set(0.5, 0.1, 1);
  vrHeadset.add(rightLens);

  // Lens glow rings
  const glowRingGeometry = new THREE.TorusGeometry(0.37, 0.03, 16, 32);
  const leftGlow = new THREE.Mesh(glowRingGeometry, accentMaterial);
  leftGlow.rotation.x = Math.PI / 2;
  leftGlow.position.set(-0.5, 0.1, 1.05);
  vrHeadset.add(leftGlow);

  const rightGlow = new THREE.Mesh(glowRingGeometry, accentMaterial);
  rightGlow.rotation.x = Math.PI / 2;
  rightGlow.position.set(0.5, 0.1, 1.05);
  vrHeadset.add(rightGlow);

  // Top sensor bar
  const sensorBarGeometry = new THREE.BoxGeometry(1.8, 0.15, 0.15);
  const sensorBar = new THREE.Mesh(sensorBarGeometry, accentMaterial);
  sensorBar.position.set(0, 0.65, 0.9);
  vrHeadset.add(sensorBar);

  // Sensors on top bar
  for (let i = -1; i <= 1; i++) {
    const sensorGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    const sensor = new THREE.Mesh(sensorGeometry, accentMaterial);
    sensor.position.set(i * 0.6, 0.65, 0.95);
    vrHeadset.add(sensor);
  }

  // Side straps
  const strapGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 16);
  
  const leftStrap = new THREE.Mesh(strapGeometry, strapMaterial);
  leftStrap.rotation.z = Math.PI / 2;
  leftStrap.position.set(-1.85, 0, 0);
  vrHeadset.add(leftStrap);

  const rightStrap = new THREE.Mesh(strapGeometry, strapMaterial);
  rightStrap.rotation.z = Math.PI / 2;
  rightStrap.position.set(1.85, 0, 0);
  vrHeadset.add(rightStrap);

  // Top strap
  const topStrap = new THREE.Mesh(strapGeometry, strapMaterial);
  topStrap.rotation.x = Math.PI / 2;
  topStrap.position.set(0, 0.75, 0);
  vrHeadset.add(topStrap);

  // IPD adjustment dial (small detail)
  const dialGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
  const dial = new THREE.Mesh(dialGeometry, accentMaterial);
  dial.rotation.z = Math.PI / 2;
  dial.position.set(0, -0.65, 0.9);
  vrHeadset.add(dial);

  // Ventilation slots
  for (let i = -2; i <= 2; i++) {
    const slotGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.05);
    const slot = new THREE.Mesh(slotGeometry, strapMaterial);
    slot.position.set(i * 0.3, -0.2, 0.88);
    vrHeadset.add(slot);
  }

  scene.add(vrHeadset);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight1.position.set(5, 5, 5);
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0x4a74b9, 0.4);
  directionalLight2.position.set(-5, -3, 3);
  scene.add(directionalLight2);

  const pointLight = new THREE.PointLight(0x4a74b9, 0.8);
  pointLight.position.set(0, 0, 3);
  scene.add(pointLight);

  // Animation
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.01;

    // Smooth rotation
    vrHeadset.rotation.y = time * 0.3;
    vrHeadset.rotation.x = Math.sin(time * 0.5) * 0.1;

    // Gentle floating motion
    vrHeadset.position.y = Math.sin(time * 1.5) * 0.15;

    // Pulsing glow effect on lenses
    const glowIntensity = 0.3 + Math.sin(time * 2) * 0.2;
    lensMaterial.emissiveIntensity = glowIntensity;
    
    const accentGlow = 0.5 + Math.sin(time * 2) * 0.3;
    accentMaterial.emissiveIntensity = accentGlow;

    renderer.render(scene, camera);
  }
  animate();

  // Handle resize
  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

// Back to Top Button functionality
function initializeBackToTop() {
  const backToTopBtn = document.getElementById('backToTop');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// Horizontal panel navigation for side-by-side layout
function initializeHorizontalNavigation() {
  const main = document.querySelector('main');
  if (!main) return;
  if (window.innerWidth <= 900) return;

  const getScrollableContainer = (target) => {
    let el = target;
    while (el && el !== main && el !== document.body) {
      const style = window.getComputedStyle(el);
      const canScrollY = /(auto|scroll)/.test(style.overflowY);
      if (canScrollY && el.scrollHeight > el.clientHeight + 1) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  };

  // Map wheel to horizontal scroll unless the current section can scroll vertically
  document.addEventListener('wheel', (event) => {
    if (!main.contains(event.target)) return;

    const container = getScrollableContainer(event.target);
    if (container) {
      const atTop = container.scrollTop <= 0;
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1;
      const scrollingDown = event.deltaY > 0;

      if ((scrollingDown && !atBottom) || (!scrollingDown && !atTop)) {
        return; // allow vertical scrolling inside the section
      }
    }

    if (Math.abs(event.deltaY) >= Math.abs(event.deltaX)) {
      event.preventDefault();
      main.scrollLeft += event.deltaY;
    } else {
      event.preventDefault();
      main.scrollLeft += event.deltaX;
    }
  }, { passive: false });

  // Smooth scroll to section panels when clicking nav links
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;

      const targetId = hash.slice(1);
      const target = document.getElementById(targetId);
      if (!target) return;

      event.preventDefault();
      main.scrollTo({
        left: target.offsetLeft,
        behavior: 'smooth'
      });

      history.replaceState(null, '', hash);
    });
  });

  // If page loads with a hash, snap to that section
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash) {
    const target = document.getElementById(initialHash);
    if (target) {
      main.scrollTo({
        left: target.offsetLeft,
        behavior: 'auto'
      });
    }
  }
}

// Set panel height to keep horizontal panels scrollable vertically
function updatePanelHeight() {
  const nav = document.querySelector('nav');
  const navHeight = nav ? nav.offsetHeight : 0;
  const available = window.innerHeight - navHeight;
  const safeHeight = Math.max(360, available);
  document.documentElement.style.setProperty('--panel-height', `${safeHeight}px`);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  // Initialize theme toggle
  initializeThemeToggle();
  
  // Apply dynamic background theme
  applyDynamicBackground();
  
  // Initialize 3D cube in header
  initiate3DCube();
  
  // Initialize 3D robot in About section
  initiate3DRobot();
  
  // Load publications data (will create publication slider when ready)
  loadPublications();

  // Initialize scroll animations
  initializeScrollAnimations();

  // Initialize back to top button
  initializeBackToTop();

  // Initialize horizontal navigation for side-by-side layout
  initializeHorizontalNavigation();

  // Compute panel height for vertical scroll inside sections
  updatePanelHeight();
  window.addEventListener('resize', updatePanelHeight);

  // Education details toggles with animation
  const eduToggles = document.querySelectorAll('.edu-toggle');
  eduToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const list = document.getElementById(targetId);
      if (!list) return;

      const isOpen = list.classList.contains('is-open');
      if (isOpen) {
        list.classList.remove('is-open');
        btn.classList.remove('is-open');
      } else {
        list.classList.add('is-open');
        btn.classList.add('is-open');
      }
    });
  });

  // Contact form mailto submit (if present)
  const contactSubmit = document.getElementById('contact-submit');
  const contactForm = document.getElementById('contact-form');

  if (contactSubmit && contactForm) {
    contactSubmit.addEventListener('click', () => {
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const message = document.getElementById('contact-message').value.trim();

      const to = 'mdasifbinkarim@gmail.com';  // your email
      const subject = encodeURIComponent(`Website contact from ${name || 'visitor'}`);
      const bodyLines = [
        `Name: ${name}`,
        `Email: ${email}`,
        '',
        'Message:',
        message
      ];
      const body = encodeURIComponent(bodyLines.join('\n'));

      const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`;
      window.location.href = mailtoUrl;
    });
  }
  // Skills collapsible lists with animation
  const skillToggles = document.querySelectorAll('.skills-toggle');
  skillToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const list = document.getElementById(targetId);
      if (!list) return;

      const isOpen = list.classList.contains('is-open');
      if (isOpen) {
        list.classList.remove('is-open');
        btn.classList.remove('is-open');
      } else {
        list.classList.add('is-open');
        btn.classList.add('is-open');
      }
    });
  });
      // Certificate "View Certificate" fun popup
  const certLinks = document.querySelectorAll('.cert-link');
  const certModal = document.getElementById('cert-modal');
  const certModalClose = document.getElementById('cert-modal-close');

  certLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault(); // Don't navigate
      if (certModal) certModal.classList.add('show');
    });
  });

  // Close modal when X is clicked
  if (certModalClose && certModal) {
    certModalClose.addEventListener('click', () => {
      certModal.classList.remove('show');
    });
  }

  // Close modal when clicking outside
  if (certModal) {
    certModal.addEventListener('click', (e) => {
      if (e.target === certModal) {
        certModal.classList.remove('show');
      }
    });
  }



  // Experience details toggles with animation
  const expToggles = document.querySelectorAll('.exp-toggle');
  expToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const list = document.getElementById(targetId);
      if (!list) return;

      const isOpen = list.classList.contains('is-open');
      if (isOpen) {
        list.classList.remove('is-open');
        btn.classList.remove('is-open');
      } else {
        list.classList.add('is-open');
        btn.classList.add('is-open');
      }
    });
  });

  // Initialize certifications slider (existing HTML structure)
  const certTrack = document.getElementById('certifications-track');
  const certPrev = document.getElementById('certifications-prev');
  const certNext = document.getElementById('certifications-next');
  if (certTrack && certPrev && certNext) {
    // cert cards are already in DOM; use maxPerPage 4 (will clamp by viewport)
    // Slider disabled: certifications now wrap in a grid
  }
});

// Load publications from JSON file
function loadPublications() {
  fetch('publications.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      allPublications = data.publications || [];
      // Render publications into a track-based slider
      renderPublications();
    })
    .catch(error => {
      console.error('Error loading publications:', error);
      displayFallbackPubliclications();
    });
}

// Fallback if JSON loading fails
function displayFallbackPubliclications() {
  const container = document.getElementById('publications-container');
  if (container) {
    container.innerHTML = 'Error loading publications.';
  }
}

// Render publications (always show selected only)
function renderPublications() {
  const publicationsContainer = document.getElementById('publications-container');
  if (!publicationsContainer) return;

  // Filter publications - show only selected
  const pubsFiltered = allPublications.filter(pub => pub.selected === 1);

  // Prepare a viewport/track structure inside publicationsContainer
  publicationsContainer.innerHTML = '';

  const viewport = document.createElement('div');
  viewport.className = 'pub-viewport';
  viewport.style.overflow = 'hidden';
  viewport.style.width = '100%';

  const track = document.createElement('div');
  track.className = 'pub-track';
  track.style.display = 'flex';
  track.style.flexWrap = 'nowrap';
  track.style.transition = 'transform 300ms ease';
  track.style.willChange = 'transform';

  // Create publication cards as slider items
  pubsFiltered.forEach(publication => {
    const card = createPublicationCard(publication);
    card.classList.add('pub-card');
    card.style.boxSizing = 'border-box';
    card.style.flex = '0 0 auto';
    card.style.marginRight = '16px';
    track.appendChild(card);
  });

  viewport.appendChild(track);
  publicationsContainer.appendChild(viewport);

  // Initialize or refresh slider for publications
  const prevBtn = document.getElementById('pub-prev');
  const nextBtn = document.getElementById('pub-next');
  const indicator = document.getElementById('pub-page-indicator');

  // If there's an existing slider, destroy it and recreate
  if (pubSlider) pubSlider.destroy();

  pubSlider = new Slider({ track: track, prevBtn: prevBtn, nextBtn: nextBtn, maxPerPage: 2, moveByPage: true, pageIndicator: indicator });
  pubSlider.refreshItems();
}

// Create HTML element for a publication (card used by the slider)
function createPublicationCard(publication) {
  const pubItem = document.createElement('article');
  pubItem.className = 'publication-item';
  pubItem.style.display = 'flex';
  pubItem.style.alignItems = 'flex-start';
  pubItem.style.gap = '12px';
  pubItem.style.padding = '12px';
  pubItem.style.border = '1px solid rgba(0,0,0,0.04)';
  pubItem.style.borderRadius = '6px';
  pubItem.style.background = '#fff';

  // Create thumbnail
  const thumbnail = document.createElement('div');
  thumbnail.className = 'pub-thumbnail';
  thumbnail.style.cursor = 'pointer';
  thumbnail.onclick = () => openModal(publication.thumbnail);

  const thumbnailImg = document.createElement('img');
  thumbnailImg.src = publication.thumbnail;
  thumbnailImg.alt = `${publication.title} thumbnail`;
  thumbnail.appendChild(thumbnailImg);

  // Create content container
  const content = document.createElement('div');
  content.className = 'pub-content';
  content.style.flex = '1';

  // Add title
  const title = document.createElement('div');
  title.className = 'pub-title';
  title.textContent = publication.title;
  content.appendChild(title);

  // Add authors
  const authors = document.createElement('div');
  authors.className = 'pub-authors';
  authors.style.color = 'var(--text-secondary)';

  let authorsHTML = '';
  (publication.authors || []).forEach((author, index) => {
    authorsHTML += author;
    if (index < (publication.authors || []).length - 1) authorsHTML += ', ';
  });
  authors.innerHTML = authorsHTML;
  content.appendChild(authors);

  // Venue / award
  const venueContainer = document.createElement('div');
  venueContainer.className = 'pub-venue-container';
  venueContainer.style.display = 'flex';
  venueContainer.style.gap = '8px';

  const venue = document.createElement('div');
  venue.className = 'pub-venue';
  venue.textContent = publication.venue || '';
  venueContainer.appendChild(venue);

  if (publication.award) {
    const award = document.createElement('div');
    award.className = 'pub-award';
    award.textContent = publication.award;
    venueContainer.appendChild(award);
  }

  content.appendChild(venueContainer);

  // Links
  if (publication.links) {
    const links = document.createElement('div');
    links.className = 'pub-links';
    links.style.marginTop = '8px';
    if (publication.links.pdf) {
      const pdfLink = document.createElement('a');
      pdfLink.href = publication.links.pdf;
      pdfLink.textContent = '[PDF]';
      links.appendChild(pdfLink);
    }
    if (publication.links.code) {
      const codeLink = document.createElement('a');
      codeLink.href = publication.links.code;
      codeLink.textContent = '[Code]';
      links.appendChild(codeLink);
    }
    if (publication.links.project) {
      const projectLink = document.createElement('a');
      projectLink.href = publication.links.project;
      projectLink.textContent = '[Project Page]';
      links.appendChild(projectLink);
    }
    content.appendChild(links);
  }

  pubItem.appendChild(thumbnail);
  pubItem.appendChild(content);

  // Make sure thumbnail image fits
  thumbnail.style.width = '220px';
  thumbnail.style.height = '150px';
  thumbnail.style.flex = '0 0 auto';
  thumbnail.querySelector('img').style.width = '100%';
  thumbnail.querySelector('img').style.height = '100%';
  thumbnail.querySelector('img').style.objectFit = 'cover';

  return pubItem;
}

// Modal functionality for viewing original images
function openModal(imageSrc) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');

  if (!modal || !modalImg) return;

  modal.style.display = 'block';

  setTimeout(() => {
    modal.classList.add('show');
  }, 10);

  modalImg.src = imageSrc;
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  if (!modal) return;

  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

// Close modal when clicking outside the image
window.onclick = function(event) {
  const modal = document.getElementById('imageModal');
  if (modal && event.target === modal) {
    closeModal();
  }
};

document.getElementById('cv-puzzle-link').addEventListener('click', (e) => {
  e.preventDefault();
  window.open('puzzle.html', '_blank'); // Open puzzle in new tab
});

// Initialize all features on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeThemeToggle();
  initializeAOS();
});