const reverseGeocode = async (latitude, longitude) => {
  const defaultAddress = `Lat: ${Number(latitude).toFixed(4)}, Lng: ${Number(longitude).toFixed(4)}`;
  
  try {
    const userAgent = process.env.NOMINATIM_USER_AGENT || 'CleanCityApp/1.0';
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': 'en'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return defaultAddress;
    }

    const data = await response.json();
    if (data && data.display_name) {
      return data.display_name;
    }

    return defaultAddress;
  } catch (error) {
    console.warn(`[Geocoding Warning] Reverse geocoding failed or timed out: ${error.message}`);
    return defaultAddress;
  }
};

module.exports = { reverseGeocode };
