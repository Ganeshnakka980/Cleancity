/**
 * CleanCity Leaflet Map Utility Helper
 */
const CleanCityMap = {
  map: null,
  markersGroup: null,
  userLocationMarker: null,
  radiusCircle: null,

  init(containerId, options = {}) {
    const defaultLat = Number.isFinite(options.lat) ? options.lat : 19.076; // Default Mumbai center
    const defaultLng = Number.isFinite(options.lng) ? options.lng : 72.8777;
    const defaultZoom = options.zoom || 12;

    const el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!el) {
      console.warn(`[CleanCityMap] Container element #${containerId} not found.`);
      return null;
    }

    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {}
      this.map = null;
    }

    if (el._leaflet_id) {
      el._leaflet_id = null;
    }

    this.map = L.map(el).setView([defaultLat, defaultLng], defaultZoom);

    // OpenStreetMap Tile Layer with required Referrer-Policy
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors | CleanCity',
      referrerPolicy: 'origin-when-cross-origin'
    }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);

    return this.map;
  },

  getMarkerColor(status, priority) {
    if (status === 'resolved' || status === 'verified') return '#10B981'; // Green
    if (status === 'rejected') return '#6B7280'; // Gray
    if (priority === 'critical') return '#EF4444'; // Red
    if (priority === 'high') return '#F97316'; // Orange
    if (priority === 'medium') return '#F59E0B'; // Amber
    return '#3B82F6'; // Blue
  },

  createCustomIcon(color) {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  },

  addComplaintMarkers(complaints, onMarkerClick = null) {
    if (!this.map || !this.markersGroup) return;
    this.markersGroup.clearLayers();

    const bounds = [];

    complaints.forEach((c) => {
      if (!c.location || !c.location.coordinates) return;
      const lng = c.location.coordinates[0];
      const lat = c.location.coordinates[1];

      bounds.push([lat, lng]);
      const color = this.getMarkerColor(c.status, c.priority);
      const icon = this.createCustomIcon(color);

      const marker = L.marker([lat, lng], { icon });

      const detailUrl = c.assignedTo ? `/staff/complaint-details.html?id=${c._id}` : `/citizen/complaint-details.html?id=${c._id}`;

      const popupHtml = `
        <div class="p-1 max-w-xs">
          <div class="relative mb-2 rounded-lg overflow-hidden bg-slate-100 h-28">
            <img src="${c.image || '/uploads/seed-waste-1.svg'}" class="w-full h-full object-cover" alt="Waste photo"/>
            <span class="absolute top-2 right-2 px-2 py-0.5 text-xs font-bold rounded-full badge-${c.status}">
              ${c.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div class="font-bold text-slate-800 text-sm mb-1">${c.complaintId}: ${c.category}</div>
          <p class="text-xs text-slate-600 mb-2 truncate">${c.address || 'Location specified'}</p>
          <div class="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <span class="font-semibold text-slate-500">Priority: <span class="capitalize font-bold text-slate-700">${c.priority}</span></span>
            <a href="${detailUrl}" class="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-bold">
              Details &rarr;
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(c));
      }

      this.markersGroup.addLayer(marker);
    });

    if (bounds.length > 0 && complaints.length > 1) {
      this.map.fitBounds(bounds, { padding: [40, 40] });
    }
  },

  addUserLocationMarker(lat, lng, radiusKm = null) {
    if (!this.map) return;

    if (this.userLocationMarker) {
      this.map.removeLayer(this.userLocationMarker);
    }
    if (this.radiusCircle) {
      this.map.removeLayer(this.radiusCircle);
    }

    const userIcon = L.divIcon({
      className: 'user-loc-pin',
      html: `<div style="
        background-color: #2563EB;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    this.userLocationMarker = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
    this.userLocationMarker.bindPopup('<b>Your Current Location</b>').openPopup();

    if (radiusKm) {
      this.radiusCircle = L.circle([lat, lng], {
        color: '#2563EB',
        fillColor: '#3B82F6',
        fillOpacity: 0.15,
        radius: radiusKm * 1000
      }).addTo(this.map);
    }

    this.map.setView([lat, lng], 14);
  },

  addHotspotOverlays(hotspots) {
    if (!this.map) return;

    hotspots.forEach((spot) => {
      const circle = L.circle([spot.latitude, spot.longitude], {
        color: '#EF4444',
        fillColor: '#F87171',
        fillOpacity: 0.3,
        radius: spot.radius || 500
      }).addTo(this.map);

      const popupHtml = `
        <div class="p-1">
          <div class="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">🚨 Waste Hotspot Detected</div>
          <div class="text-sm font-bold text-slate-800">${spot.area}</div>
          <div class="text-xs text-slate-600 my-1">Total Reports: <b>${spot.complaintCount}</b></div>
          <div class="text-xs text-slate-600">Top Issue: <span class="font-semibold text-emerald-700">${spot.topCategory}</span></div>
        </div>
      `;
      circle.bindPopup(popupHtml);
    });
  }
};
