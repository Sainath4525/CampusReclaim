// Global State & Configuration
const BACKEND_URL = 'http://localhost:3000';
const API_URL = `${BACKEND_URL}/api/items`;
let currentItems = [];
let activeItem = null;

// Debounce helper
function debounce(func, delay = 350) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// ----------------------------------------------------
// UI Initialization & Event Listeners
// ----------------------------------------------------
function startApp() {
  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Theme Toggler
  initTheme();
  
  // Hero Particle System
  initParticles();

  // Scroll Animations (Intersection Observer)
  initScrollAnimations();

  // Load items from Server
  fetchItems();

  // Set up Filter Listeners
  setupFilters();

  // Detail Modal Controls
  setupModalControls();

  // Stats Counter Animation
  initStatsCounter();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// ----------------------------------------------------
// Theme Toggle Logic
// ----------------------------------------------------
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('theme') || 'dark';
  
  if (storedTheme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  }

  themeToggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
      showToast('Switched to light theme', 'info');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
      showToast('Switched to dark theme', 'info');
    }
  });
}

// ----------------------------------------------------
// Toast Notification Engine
// ----------------------------------------------------
function showToast(message, type = 'success') {
  const portal = document.getElementById('toast-portal');
  if (!portal) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle-2';
  if (type === 'error') iconName = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <div class="toast-content">${message}</div>
    <button class="toast-close" aria-label="Close message"><i data-lucide="x"></i></button>
  `;

  portal.appendChild(toast);
  
  // Re-run lucide to render the newly injected icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons({ attrs: { class: 'toast-icon' } });
  }

  // Remove toast on click of close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px) scale(0.95)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Export showToast globally so report-form.js can use it
window.showToast = showToast;

// ----------------------------------------------------
// Scroll Reveal Observer
// ----------------------------------------------------
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // Reveal only once
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
}

// ----------------------------------------------------
// Stats Bar Animating Counters
// ----------------------------------------------------
function initStatsCounter() {
  const stats = document.querySelectorAll('.stat-number');
  
  const animateStats = () => {
    stats.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-target'));
      const count = +stat.innerText;
      // Increment speed divider
      const speed = target / 100;
      
      const updateCount = () => {
        const current = +stat.innerText;
        if (current < target) {
          stat.innerText = Math.ceil(current + speed);
          setTimeout(updateCount, 15);
        } else {
          stat.innerText = target.toLocaleString();
        }
      };
      updateCount();
    });
  };

  // Trigger when stats bar enters viewport
  const statsBar = document.querySelector('.stats-bar');
  if (!statsBar) return;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animateStats();
      observer.unobserve(statsBar);
    }
  }, { threshold: 0.5 });

  observer.observe(statsBar);
}

// ----------------------------------------------------
// Canvas Particle Field (Signature Hero Background)
// ----------------------------------------------------
function initParticles() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId;

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 2 + 1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
      if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;
    }

    draw() {
      // Dynamic particle color based on current theme variables
      const isLightTheme = document.body.classList.contains('light-theme');
      ctx.fillStyle = isLightTheme ? 'rgba(79, 70, 229, 0.4)' : 'rgba(240, 244, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Populate particles list based on screen size
  const populateParticles = () => {
    particles = [];
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 16000), 100);
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  };
  populateParticles();
  window.addEventListener('resize', populateParticles);

  const drawLines = () => {
    const isLightTheme = document.body.classList.contains('light-theme');
    const strokeColor = isLightTheme ? 'rgba(79, 70, 229, 0.05)' : 'rgba(240, 244, 255, 0.06)';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.8;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Connect if close enough
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  };

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    drawLines();
    animationId = requestAnimationFrame(animate);
  };
  animate();
}

// ----------------------------------------------------
// Card 3D Tilt Effect
// ----------------------------------------------------
function applyTiltEffect(card) {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within element
    const y = e.clientY - rect.top;  // y position within element
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Max rotation 5 degrees
    const rotateX = ((centerY - y) / centerY) * 4;
    const rotateY = ((x - centerX) / centerX) * 4;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
  });
}

// ----------------------------------------------------
// API & Fetching Logic
// ----------------------------------------------------
async function fetchItems() {
  const grid = document.getElementById('items-grid');
  const skeletons = document.getElementById('items-skeletons');
  const emptyState = document.getElementById('items-empty-state');

  // Show skeleton loader
  grid.classList.add('hidden');
  emptyState.classList.add('hidden');
  skeletons.classList.remove('hidden');

  try {
    // Read current filter states
    const search = document.getElementById('filter-search').value;
    const category = document.getElementById('filter-category').value;
    const location = document.getElementById('filter-location').value;
    const dateFrom = document.getElementById('filter-date-from').value;
    const dateTo = document.getElementById('filter-date-to').value;
    const sortBy = document.getElementById('filter-sort').value;

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (location) params.append('location', location);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (sortBy) params.append('sortBy', sortBy);

    const response = await fetch(`${API_URL}?${params.toString()}`);
    const data = await response.json();

    skeletons.classList.add('hidden');

    if (data.success && data.items.length > 0) {
      currentItems = data.items;
      renderItems(data.items);
      grid.classList.remove('hidden');
    } else {
      emptyState.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error fetching items:', error);
    skeletons.classList.add('hidden');
    emptyState.classList.remove('hidden');
    showToast('Failed to load items. Is the backend server running?', 'error');
  }
}

// Render the fetched items to grid
function renderItems(items) {
  const grid = document.getElementById('items-grid');
  grid.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card glass-card';
    card.dataset.id = item._id;

    // Format Date
    const formattedDate = new Date(item.dateLost).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const isLost = item.status === 'lost';
    const isFound = item.status === 'found';
    
    let statusClass = 'badge-lost';
    if (isFound) statusClass = 'badge-found';
    if (item.status === 'claimed') statusClass = 'badge-claimed';

    const statusText = item.status;

    // Image logic (resolve absolute backend URLs)
    const imgUrl = item.imageUrl ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${BACKEND_URL}${item.imageUrl}`) : '';
    const imgHtml = item.imageUrl 
      ? `<img src="${imgUrl}" alt="${item.title}" class="item-card-img" onerror="this.src=''; this.parentElement.innerHTML='<div class=\\'item-img-placeholder\\'><i data-lucide=\\'image\\'></i><span>Image Unavailable</span></div>';">` 
      : `<div class="item-img-placeholder"><i data-lucide="image"></i><span>No Image Provided</span></div>`;

    card.innerHTML = `
      <div class="item-img-container">
        <div class="badge-overlay">
          <span class="badge ${statusClass}">${statusText}</span>
        </div>
        ${imgHtml}
      </div>
      <div class="item-card-content">
        <div class="category-pill">${item.category}</div>
        <h3 class="item-title">${escapeHTML(item.title)}</h3>
        <p class="item-desc">${escapeHTML(item.description)}</p>
        <div class="item-meta">
          <div class="meta-item"><i data-lucide="map-pin"></i> <span>${item.location}</span></div>
          <div class="meta-item"><i data-lucide="calendar"></i> <span>${formattedDate}</span></div>
        </div>
      </div>
      <div class="view-details-hover">
        <button class="btn btn-primary btn-glow">View Details</button>
      </div>
    `;

    // Apply card click handler to open modal
    card.addEventListener('click', () => {
      openDetailModal(item._id);
    });

    // Apply hover tilt
    applyTiltEffect(card);

    grid.appendChild(card);
  });

  // Re-run lucide to render dynamic icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// HTML Escaping Helper to prevent XSS
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Exposed globally to reload list when form submits
window.refreshItems = fetchItems;

// ----------------------------------------------------
// Filters Event Listeners
// ----------------------------------------------------
function setupFilters() {
  const searchInput = document.getElementById('filter-search');
  const catSelect = document.getElementById('filter-category');
  const locSelect = document.getElementById('filter-location');
  const dateFrom = document.getElementById('filter-date-from');
  const dateTo = document.getElementById('filter-date-to');
  const sortSelect = document.getElementById('filter-sort');

  const debouncedFetch = debounce(fetchItems, 300);

  searchInput.addEventListener('input', debouncedFetch);
  catSelect.addEventListener('change', fetchItems);
  locSelect.addEventListener('change', fetchItems);
  dateFrom.addEventListener('change', fetchItems);
  dateTo.addEventListener('change', fetchItems);
  sortSelect.addEventListener('change', fetchItems);
}

// Reset all search filters
function resetFilters() {
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-category').value = 'All';
  document.getElementById('filter-location').value = 'All';
  document.getElementById('filter-date-from').value = '';
  document.getElementById('filter-date-to').value = '';
  document.getElementById('filter-sort').value = 'newest';
  fetchItems();
}
window.resetFilters = resetFilters;

// ----------------------------------------------------
// Detailed Item Detail Modal Controls
// ----------------------------------------------------
function setupModalControls() {
  const modal = document.getElementById('detail-modal');
  const closeBtn = document.getElementById('modal-close');

  // Close when X is clicked or clicked outside card
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  // Action Buttons inside Modal
  const btnFoundThis = document.getElementById('btn-found-this');
  const btnDeleteReport = document.getElementById('btn-delete-report');

  btnFoundThis.addEventListener('click', () => {
    if (!activeItem) return;
    openFoundModal(activeItem._id);
  });

  btnDeleteReport.addEventListener('click', () => {
    if (!activeItem) return;
    openDeleteModal(activeItem._id);
  });

  // Sub-modal: Found submission
  const foundModal = document.getElementById('found-modal');
  const foundClose = document.getElementById('found-modal-close');
  foundClose.addEventListener('click', () => foundModal.classList.add('hidden'));
  foundModal.addEventListener('click', (e) => {
    if (e.target === foundModal) foundModal.classList.add('hidden');
  });

  const foundForm = document.getElementById('found-submit-form');
  foundForm.addEventListener('submit', handleFoundSubmit);

  // Sub-modal: Delete submission
  const deleteModal = document.getElementById('delete-modal');
  const deleteClose = document.getElementById('delete-modal-close');
  deleteClose.addEventListener('click', () => deleteModal.classList.add('hidden'));
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) deleteModal.classList.add('hidden');
  });

  const deleteForm = document.getElementById('delete-submit-form');
  deleteForm.addEventListener('submit', handleDeleteSubmit);
}

// Open and populate detail modal
async function openDetailModal(itemId) {
  const modal = document.getElementById('detail-modal');
  
  try {
    const response = await fetch(`${API_URL}/${itemId}`);
    const data = await response.json();

    if (!data.success) {
      showToast('Error loading item details', 'error');
      return;
    }

    const item = data.item;
    activeItem = item; // Store active item

    // Populate contents
    document.getElementById('modal-title').innerText = item.title;
    document.getElementById('modal-location').innerText = item.location;
    document.getElementById('modal-category-badge').innerText = item.category;
    document.getElementById('modal-description').innerText = item.description;
    document.getElementById('modal-views-count').innerText = item.views;

    const formattedDate = new Date(item.dateLost).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    document.getElementById('modal-date').innerText = formattedDate;

    // Image container setting (resolve absolute backend URLs)
    const imagePanel = document.getElementById('modal-image-panel');
    const modalImg = document.getElementById('modal-item-image');
    const modalImgPlaceholder = document.getElementById('modal-image-placeholder');

    if (item.imageUrl) {
      modalImg.src = item.imageUrl.startsWith('http') ? item.imageUrl : `${BACKEND_URL}${item.imageUrl}`;
      modalImg.classList.remove('hidden');
      modalImgPlaceholder.classList.add('hidden');
    } else {
      modalImg.classList.add('hidden');
      modalImgPlaceholder.classList.remove('hidden');
    }

    // Status Badge classes
    const statusBadge = document.getElementById('modal-status-badge');
    statusBadge.innerText = item.status;
    statusBadge.className = 'badge'; // reset
    if (item.status === 'lost') statusBadge.classList.add('badge-lost');
    else if (item.status === 'found') statusBadge.classList.add('badge-found');
    else statusBadge.classList.add('badge-claimed');

    // Reporter Details Section
    document.getElementById('modal-reporter-name').innerText = item.reportedBy.name;
    document.getElementById('modal-reporter-pref').innerText = item.reportedBy.preferContact.toUpperCase();

    // Toggle contact information based on preference
    const contactBox = document.getElementById('modal-contact-details');
    const phoneRow = document.getElementById('modal-phone-row');
    
    document.getElementById('modal-reporter-email').innerText = item.reportedBy.email;
    if (item.reportedBy.phone) {
      document.getElementById('modal-reporter-phone').innerText = item.reportedBy.phone;
      phoneRow.classList.remove('hidden');
    } else {
      phoneRow.classList.add('hidden');
    }

    // Standard styling for "I Found This!" buttons based on status
    const btnFoundThis = document.getElementById('btn-found-this');
    if (item.status === 'claimed') {
      btnFoundThis.classList.add('hidden');
    } else {
      btnFoundThis.classList.remove('hidden');
      if (item.status === 'found') {
        btnFoundThis.innerHTML = `<i data-lucide="gift"></i> Claim This Item!`;
      } else {
        btnFoundThis.innerHTML = `<i data-lucide="heart"></i> I Found This!`;
      }
    }

    // Re-render Lucide icons inside modal
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    modal.classList.remove('hidden');
  } catch (error) {
    console.error('Error fetching single item details:', error);
    showToast('Failed to connect to the server.', 'error');
  }
}

// Sub-modal launchers
function openFoundModal(itemId) {
  document.getElementById('found-modal').classList.remove('hidden');
  document.getElementById('found-submit-form').reset();
}

// Open Delete Verification Modal
function openDeleteModal(itemId) {
  document.getElementById('delete-modal').classList.remove('hidden');
  document.getElementById('delete-submit-form').reset();
}

// Handle Finder Form Submit
async function handleFoundSubmit(e) {
  e.preventDefault();
  const finderName = document.getElementById('found-finderName').value.trim();
  const finderEmail = document.getElementById('found-finderEmail').value.trim();
  const finderPhone = document.getElementById('found-finderPhone').value.trim();
  const finderMessage = document.getElementById('found-finderMessage').value.trim();

  const spinner = document.getElementById('found-spinner');
  const btn = document.getElementById('submit-found-btn');

  // Simple validation
  if (!finderName || !finderEmail || !finderMessage) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  try {
    spinner.classList.remove('hidden');
    btn.setAttribute('disabled', 'true');

    const response = await fetch(`${API_URL}/${activeItem._id}/found`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        finderName,
        finderEmail,
        finderPhone,
        finderMessage
      })
    });

    const data = await response.json();
    spinner.classList.add('hidden');
    btn.removeAttribute('disabled');

    if (data.success) {
      showToast('Notification sent successfully to owner!', 'success');
      document.getElementById('found-modal').classList.add('hidden');
    } else {
      showToast(data.message || 'Error sending report.', 'error');
    }
  } catch (error) {
    console.error('Error notifying found item:', error);
    spinner.classList.add('hidden');
    btn.removeAttribute('disabled');
    showToast('Failed to connect to server.', 'error');
  }
}

// Handle Delete Form Submit
async function handleDeleteSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('delete-email').value.trim();
  const studentId = document.getElementById('delete-studentId').value.trim();

  const spinner = document.getElementById('delete-spinner');
  const btn = document.getElementById('submit-delete-btn');

  if (!email && !studentId) {
    showToast('Please enter either the Email or Student ID.', 'error');
    return;
  }

  try {
    spinner.classList.remove('hidden');
    btn.setAttribute('disabled', 'true');

    const response = await fetch(`${API_URL}/${activeItem._id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, studentId })
    });

    const data = await response.json();
    spinner.classList.add('hidden');
    btn.removeAttribute('disabled');

    if (data.success) {
      showToast('Report deleted successfully.', 'success');
      document.getElementById('delete-modal').classList.add('hidden');
      document.getElementById('detail-modal').classList.add('hidden');
      fetchItems(); // reload grid
    } else {
      showToast(data.message || 'Ownership validation failed.', 'error');
    }
  } catch (error) {
    console.error('Error deleting report:', error);
    spinner.classList.add('hidden');
    btn.removeAttribute('disabled');
    showToast('Server error during deletion.', 'error');
  }
}
