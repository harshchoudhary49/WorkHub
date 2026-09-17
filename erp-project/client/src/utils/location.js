export const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        let msg = 'Could not get location.';
        if (err.code === 1) msg = 'Location permission denied. Please enable it in your browser settings to check in at the office.';
        if (err.code === 2) msg = 'Location position unavailable.';
        if (err.code === 3) msg = 'Location request timed out.';
        reject(new Error(msg));
      },
      { timeout: 10000, maximumAge: 0 }
    );
  });
