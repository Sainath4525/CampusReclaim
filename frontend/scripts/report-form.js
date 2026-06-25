function startFormWizard() {
  initFormWizard();
  initCategorySelector();
  initDragAndDrop();
  initDescriptionCounter();
  initMapPicker();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startFormWizard);
} else {
  startFormWizard();
}

// Wizard Steps Logic
function initFormWizard() {
  const form = document.getElementById('report-item-form');
  if (!form) return;

  const steps = document.querySelectorAll('.form-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  const progressLine = document.getElementById('progress-line');

  const btnNextList = document.querySelectorAll('.btn-next');
  const btnPrevList = document.querySelectorAll('.btn-prev');
  const btnToReview = document.getElementById('btn-to-review');

  const updateProgressLine = (stepNum) => {
    if (!progressLine) return;
    // Calculate percentage based on current step
    const percentage = ((stepNum - 1) / (progressSteps.length - 1)) * 100;
    progressLine.style.setProperty('--progress-width', `${percentage}%`);
  };

  const showStep = (stepNum) => {
    steps.forEach(step => {
      if (parseInt(step.getAttribute('data-step')) === stepNum) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });

    progressSteps.forEach(pStep => {
      const stepIdx = parseInt(pStep.getAttribute('data-step'));
      if (stepIdx === stepNum) {
        pStep.className = 'progress-step active';
      } else if (stepIdx < stepNum) {
        pStep.className = 'progress-step completed';
      } else {
        pStep.className = 'progress-step';
      }
    });

    updateProgressLine(stepNum);
    // Smooth scroll to top of form container
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Next Buttons click handlers
  btnNextList.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentStepVal = parseInt(btn.closest('.form-step').getAttribute('data-step'));
      
      // Perform validation for current step
      if (validateStep(currentStepVal)) {
        const nextStepVal = parseInt(btn.getAttribute('data-next'));
        showStep(nextStepVal);
      } else {
        window.showToast('Please fix the errors in this step before proceeding.', 'error');
      }
    });
  });

  // Back Buttons click handlers
  btnPrevList.forEach(btn => {
    btn.addEventListener('click', () => {
      const prevStepVal = parseInt(btn.getAttribute('data-prev'));
      showStep(prevStepVal);
    });
  });

  // Prepare Review Page Details on Step 4 Transition
  if (btnToReview) {
    btnToReview.addEventListener('click', () => {
      populateReviewData();
    });
  }

  // Handle Form Submission
  form.addEventListener('submit', handleFormSubmit);

  // Success Reset Controls
  const successPanel = document.getElementById('form-success-panel');
  const btnPostAnother = document.getElementById('btn-post-another');

  if (btnPostAnother) {
    btnPostAnother.addEventListener('click', () => {
      successPanel.classList.add('hidden');
      form.classList.remove('hidden');
      document.querySelector('.progress-bar-container').classList.remove('hidden');
      form.reset();
      resetFormInputs();
      showStep(1);
    });
  }
}

// Custom line style for progress bar container to support CSS variables
document.write('<style>.progress-line::before { width: var(--progress-width, 0%); }</style>');

// ----------------------------------------------------
// Form Validation Logic
// ----------------------------------------------------
function validateStep(stepNum) {
  let isValid = true;
  
  // Clear existing errors
  document.querySelectorAll('.error-msg').forEach(el => el.innerText = '');

  if (stepNum === 1) {
    const title = document.getElementById('item-title').value.trim();
    const category = document.getElementById('item-category').value;
    const description = document.getElementById('item-description').value.trim();

    if (!title) {
      document.getElementById('error-title').innerText = 'Item Name is required.';
      isValid = false;
    }
    if (!category) {
      document.getElementById('error-category').innerText = 'Please select an item category.';
      isValid = false;
    }
    if (!description) {
      document.getElementById('error-description').innerText = 'Please describe the item.';
      isValid = false;
    } else if (description.length < 10) {
      document.getElementById('error-description').innerText = 'Description must be at least 10 characters long.';
      isValid = false;
    }
  }

  else if (stepNum === 2) {
    const location = document.getElementById('item-location').value;
    const dateLost = document.getElementById('item-dateLost').value;

    if (!location) {
      document.getElementById('error-location').innerText = 'Please select the location zone.';
      isValid = false;
    }
    if (!dateLost) {
      document.getElementById('error-dateLost').innerText = 'Please select date and approximate time.';
      isValid = false;
    } else {
      const selectedDate = new Date(dateLost);
      const now = new Date();
      if (selectedDate > now) {
        document.getElementById('error-dateLost').innerText = 'Report date cannot be in the future.';
        isValid = false;
      }
    }
  }

  else if (stepNum === 3) {
    const name = document.getElementById('reporter-name').value.trim();
    const email = document.getElementById('reporter-email').value.trim();

    if (!name) {
      document.getElementById('error-reporterName').innerText = 'Your Full Name is required.';
      isValid = false;
    }
    if (!email) {
      document.getElementById('error-reporterEmail').innerText = 'Campus Email Address is required.';
      isValid = false;
    } else {
      // Basic email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        document.getElementById('error-reporterEmail').innerText = 'Please enter a valid email address.';
        isValid = false;
      }
    }
  }

  return isValid;
}

// Reset custom items styling upon form reset
function resetFormInputs() {
  // Clear category selector
  document.querySelectorAll('.category-card').forEach(card => card.classList.remove('selected'));
  document.getElementById('item-category').value = '';

  // Clear Map zone selector
  document.querySelectorAll('.map-zone').forEach(zone => zone.classList.remove('selected'));

  // Reset file uploader preview
  const previewContainer = document.getElementById('image-preview-container');
  const previewImg = document.getElementById('image-preview');
  previewContainer.classList.add('hidden');
  previewImg.src = '';

  // Reset char counter
  document.getElementById('description-char-count').innerText = '0';
}

// ----------------------------------------------------
// Icon Grid Category Selector
// ----------------------------------------------------
function initCategorySelector() {
  const hiddenInput = document.getElementById('item-category');
  const cards = document.querySelectorAll('.category-card');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      hiddenInput.value = card.getAttribute('data-val');
      document.getElementById('error-category').innerText = ''; // Clear error
    });
  });
}

// ----------------------------------------------------
// Description character counter
// ----------------------------------------------------
function initDescriptionCounter() {
  const textarea = document.getElementById('item-description');
  const counterSpan = document.getElementById('description-char-count');

  if (!textarea || !counterSpan) return;

  textarea.addEventListener('input', () => {
    counterSpan.innerText = textarea.value.length;
  });
}

// ----------------------------------------------------
// Drag & Drop Image Uploader
// ----------------------------------------------------
function initDragAndDrop() {
  const dropZone = document.getElementById('drag-drop-zone');
  const fileInput = document.getElementById('item-image-input');
  const previewContainer = document.getElementById('image-preview-container');
  const previewImg = document.getElementById('image-preview');
  const removeBtn = document.getElementById('remove-preview-btn');

  if (!dropZone || !fileInput) return;

  // Let drag zone act as click trigger
  dropZone.addEventListener('click', (e) => {
    if (e.target !== removeBtn && !removeBtn.contains(e.target)) {
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
  });

  // Drag over effects
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  ['dragleave', 'dragend'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('dragover');
    });
  });

  // Drop files
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    fileInput.files = files; // bind files to hidden input
    handleFiles(files);
  });

  // Remove preview logic
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent file picker opening
    fileInput.value = ''; // reset file input
    previewImg.src = '';
    previewContainer.classList.add('hidden');
    window.showToast('Image removed.', 'info');
  });

  function handleFiles(files) {
    if (files.length === 0) return;
    const file = files[0];

    // Verify file type is image
    if (!file.type.startsWith('image/')) {
      window.showToast('Please upload an image file only.', 'error');
      fileInput.value = '';
      return;
    }

    // Verify file size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      window.showToast('Image size cannot exceed 5MB.', 'error');
      fileInput.value = '';
      return;
    }

    // Set preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewContainer.classList.remove('hidden');
      window.showToast('Image loaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  }
}

// ----------------------------------------------------
// Campus Map Zone Selection Logic
// ----------------------------------------------------
function initMapPicker() {
  const zones = document.querySelectorAll('.map-zone');
  const dropdown = document.getElementById('item-location');

  if (!dropdown || zones.length === 0) return;

  // 1. Zone click syncs with Location dropdown
  zones.forEach(zone => {
    zone.addEventListener('click', () => {
      zones.forEach(z => z.classList.remove('selected'));
      zone.classList.add('selected');
      
      const zoneName = zone.getAttribute('data-zone');
      dropdown.value = zoneName;
      document.getElementById('error-location').innerText = ''; // Clear error
    });
  });

  // 2. Location dropdown change syncs with Map zone highlights
  dropdown.addEventListener('change', () => {
    const selectedVal = dropdown.value;
    zones.forEach(zone => {
      if (zone.getAttribute('data-zone') === selectedVal) {
        zone.classList.add('selected');
      } else {
        zone.classList.remove('selected');
      }
    });
  });
}

// ----------------------------------------------------
// Review Page Data Binder
// ----------------------------------------------------
function populateReviewData() {
  const title = document.getElementById('item-title').value.trim();
  const category = document.getElementById('item-category').value;
  const description = document.getElementById('item-description').value.trim();
  const location = document.getElementById('item-location').value;
  const dateLost = document.getElementById('item-dateLost').value;
  const isLost = document.querySelector('input[name="status"]:checked').value === 'lost';
  const name = document.getElementById('reporter-name').value.trim();
  const email = document.getElementById('reporter-email').value.trim();

  // Badge configuration
  const typeBadge = document.getElementById('review-type-badge');
  typeBadge.innerText = isLost ? 'LOST' : 'FOUND';
  typeBadge.className = isLost ? 'review-badge badge-lost' : 'review-badge badge-found';

  // Fill in textual values
  document.getElementById('review-title').innerText = title || 'Untitled Item';
  document.getElementById('review-category').innerText = category || 'Not selected';
  document.getElementById('review-location').innerText = location || 'Not selected';
  document.getElementById('review-description').innerText = description || 'No description provided';
  document.getElementById('review-contact').innerText = `${name} (${email})`;

  if (dateLost) {
    const d = new Date(dateLost);
    document.getElementById('review-date').innerText = d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } else {
    document.getElementById('review-date').innerText = 'Not selected';
  }
}

// ----------------------------------------------------
// Submit Form Handler (Multipart FormData submission)
// ----------------------------------------------------
async function handleFormSubmit(e) {
  e.preventDefault();

  const form = document.getElementById('report-item-form');
  const spinner = document.getElementById('submit-spinner');
  const submitBtn = document.getElementById('submit-form-btn');
  const successPanel = document.getElementById('form-success-panel');

  try {
    spinner.classList.remove('hidden');
    submitBtn.setAttribute('disabled', 'true');

    // Compile FormData to handle file uploads
    const formData = new FormData(form);

    // Call absolute Backend URL
    const response = await fetch('http://localhost:3000/api/items', {
      method: 'POST',
      body: formData // DO NOT set Content-Type header
    });

    const data = await response.json();
    spinner.classList.add('hidden');
    submitBtn.removeAttribute('disabled');

    if (data.success) {
      window.showToast('Item reported successfully!', 'success');
      
      // CONFETTI ANIMATION BURST!
      triggerConfetti();

      // Switch panels
      form.classList.add('hidden');
      document.querySelector('.progress-bar-container').classList.add('hidden');
      successPanel.classList.remove('hidden');

      // Refresh items list
      if (typeof window.refreshItems === 'function') {
        window.refreshItems();
      }
    } else {
      window.showToast(data.message || 'Failed to submit report. Please check details.', 'error');
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    spinner.classList.add('hidden');
    submitBtn.removeAttribute('disabled');
    window.showToast('Server connection failed. Is the API up?', 'error');
  }
}

// Confetti Helper
function triggerConfetti() {
  if (typeof confetti !== 'undefined') {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { x: 0.2, y: 0.6 }
    });
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { x: 0.8, y: 0.6 }
    });
  }
}
