/**
 * CleanCity Report Waste Form & GPS Handling
 */
let reportMap = null;
let reportMarker = null;

document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth('citizen');
  renderNavbar('report');
  renderSidebar('report');

  initReportMap();
  setupFormListeners();
});

function initReportMap() {
  const defaultLat = 19.076;
  const defaultLng = 72.8777;

  reportMap = CleanCityMap.init('report-picker-map', { lat: defaultLat, lng: defaultLng, zoom: 13 });

  reportMarker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(reportMap);

  // Set initial hidden form coordinates
  updateCoordinatesInput(defaultLat, defaultLng);

  // Map Click Listener
  reportMap.on('click', (e) => {
    const { lat, lng } = e.latlng;
    reportMarker.setLatLng([lat, lng]);
    updateCoordinatesInput(lat, lng);
  });

  // Marker Drag End Listener
  reportMarker.on('dragend', () => {
    const { lat, lng } = reportMarker.getLatLng();
    updateCoordinatesInput(lat, lng);
  });
}

function updateCoordinatesInput(lat, lng) {
  document.getElementById('latitude').value = lat.toFixed(6);
  document.getElementById('longitude').value = lng.toFixed(6);
}

function handleUseGPS() {
  const gpsBtn = document.getElementById('btn-gps');
  const originalText = gpsBtn.innerHTML;

  if (!navigator.geolocation) {
    showToast('GPS Error', 'Geolocation is not supported by your browser', 'danger');
    return;
  }

  gpsBtn.disabled = true;
  gpsBtn.innerHTML = `<span class="animate-spin inline-block mr-1">⌛</span> Locating...`;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      updateCoordinatesInput(lat, lng);
      reportMarker.setLatLng([lat, lng]);
      reportMap.setView([lat, lng], 16);

      // Perform Reverse Geocoding
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.display_name) {
            document.getElementById('address').value = data.display_name;
          }
        })
        .catch(() => {})
        .finally(() => {
          gpsBtn.disabled = false;
          gpsBtn.innerHTML = originalText;
          showToast('Location Detected', 'Coordinates updated successfully', 'success');
        });
    },
    (error) => {
      gpsBtn.disabled = false;
      gpsBtn.innerHTML = originalText;
      showToast('GPS Denied/Failed', 'Please select location manually on the map', 'warning');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function setupFormListeners() {
  // Image preview handler
  const imageInput = document.getElementById('image');
  const imagePreview = document.getElementById('image-preview');
  const previewImg = document.getElementById('preview-img');

  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        previewImg.src = event.target.result;
        imagePreview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    } else {
      imagePreview.classList.add('hidden');
    }
  });

  // Submit Handler with Duplicate Check
  const form = document.getElementById('report-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    const imageFile = imageInput.files[0];

    if (!imageFile) {
      showToast('Missing Image', 'Please upload a photo of the waste', 'warning');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-report');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Checking duplicate reports...';

    try {
      // Step 1: Duplicate check
      const dupCheck = await API.checkDuplicate({
        category,
        latitude,
        longitude,
        radiusMeters: 150
      });

      if (dupCheck.data && dupCheck.data.isDuplicate) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Waste Complaint';
        showDuplicateModal(dupCheck.data.existingComplaint);
        return;
      }

      // Step 2: Proceed with creation
      await executeReportSubmission();
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Waste Complaint';
      showToast('Submission Error', err.message || 'Unable to submit report', 'danger');
    }
  });
}

function showDuplicateModal(existing) {
  const modalContent = document.getElementById('duplicate-modal-content');
  modalContent.innerHTML = `
    <div class="p-4 bg-amber-50 rounded-2xl border border-amber-200 mb-4 text-left">
      <div class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Active Report Found Nearby</div>
      <div class="font-bold text-slate-800 text-sm">${existing.complaintId}: ${existing.category}</div>
      <div class="text-xs text-slate-600 mt-1">${existing.address || 'Reported Location'}</div>
      <div class="text-xs font-semibold text-emerald-700 mt-2">Status: ${existing.status.toUpperCase()}</div>
    </div>
  `;

  document.getElementById('btn-view-duplicate').onclick = () => {
    window.location.href = `/citizen/complaint-details.html?id=${existing._id}`;
  };

  Modal.open('duplicate-modal');
}

async function forceSubmitComplaint() {
  Modal.close('duplicate-modal');
  const submitBtn = document.getElementById('btn-submit-report');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting report...';
  await executeReportSubmission();
}

async function executeReportSubmission() {
  const form = document.getElementById('report-form');
  const formData = new FormData(form);

  try {
    const response = await API.createComplaint(formData);
    showToast('Success! 🎉', `Complaint ${response.data.complaintId} created! +10 EcoPoints earned.`, 'success');
    setTimeout(() => {
      window.location.href = `/citizen/complaint-details.html?id=${response.data._id}`;
    }, 1500);
  } catch (err) {
    const submitBtn = document.getElementById('btn-submit-report');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Waste Complaint';
    showToast('Error', err.message || 'Submission failed', 'danger');
  }
}
