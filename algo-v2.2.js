/* LimeBay Algo v2.2 — schedule override + dynamic hotspots
 * Loads AFTER algo-v2.js. Re-wraps smartNext and confirmTidy.
 */
(function(){
  if (window.__LIMEBAY_V22__) return;
  window.__LIMEBAY_V22__ = true;
  console.log('[LimeBay Algo v2.2] loaded');

  // ---- Hotspot data ----
  const HOTSPOTS = {
    wm: [{
      id: 'baker-blandford',
      name: 'Baker/Blandford sweep',
      lat: 51.5175, lng: -0.1575,
      radius: 80,
      activateThreshold: 5,
      priorityMult: 1.5,
      cooldownMin: 30,
      addedBy: 'manager',
      notes: 'Sweep free-float bikes into Baker S/N/WM17/Blandford'
    }],
    bre1: [], rbkc6: []
  };

  // ---- Helpers ----
  function distM(lat1, lng1, lat2, lng2) {
    const R = 6371000, toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const h = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function getBikeList() {
    return (typeof bikes !== 'undefined' && Array.isArray(bikes)) ? bikes
         : (window.bikes || window.bikeList || window.prevBikePositions || []);
  }

  function countBikesNear(h) {
    const list = getBikeList();
    if (!list.length) return 0;
    return list.filter(b => {
      const bLat = b.lat ?? b.latitude ?? (b.location && b.location.lat);
      const bLng = b.lng ?? b.longitude ?? (b.location && b.location.lng);
      if (bLat == null || bLng == null) return false;
      return distM(h.lat, h.lng, bLat, bLng) <= h.radius;
    }).length;
  }

  function getActiveHotspots() {
    const list = HOTSPOTS[curZone] || [];
    return list.map(h => {
      const count = countBikesNear(h);
      const lastTs = parseInt(localStorage.getItem('limebay_hotspot_' + h.id) || '0', 10);
      const cooldownOk = !lastTs || (Date.now() - lastTs) > h.cooldownMin * 60 * 1000;
      return { ...h, currentBikes: count, active: count >= h.activateThreshold && cooldownOk };
    }).filter(h => h.active);
  }

  // ---- Schedule override ----
  function getActiveScheduleBay() {
    if (curZone !== 'wm' || typeof WM_SCHEDULE === 'undefined') return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    for (const entry of WM_SCHEDULE) {
      // Support {time, bay} or [time, bay]
      const time = entry.time || entry[0];
      const bayName = entry.bay || entry.name || entry[1];
      if (!time || !bayName) continue;
      const [h, m] = time.split(':').map(Number);
      const delta = (h * 60 + m) - nowMin;
      if (delta >= -15 && delta <= 15) {
        const bay = (bays || []).find(b => b.name === bayName || (b.name||'').includes(bayName));
        if (bay) return { bay, entry: { time, bay: bayName }, delta };
      }
    }
    return null;
  }

  // ---- Wrap Smart Next ----
  const _smartNext = window.smartNext;
  if (typeof _smartNext === 'function') {
    window.smartNext = function() {
      // 1) Schedule override
      const sched = getActiveScheduleBay();
      if (sched) {
        const mins = sched.delta >= 0 ? ('in ' + sched.delta + 'min') : ((-sched.delta) + 'min ago');
        try { showToast('📋 SCHEDULE: ' + sched.entry.bay + ' @ ' + sched.entry.time + ' (' + mins + ') — manager', 'blue'); } catch(e) {}
        return sched.bay;
      }

      // 2) Active hotspot?
      const active = getActiveHotspots();
      if (active.length) {
        const top = active.sort((a,b) => b.currentBikes - a.currentBikes)[0];
        const bestBay = _smartNext();
        const bayScore = (bestBay && bestBay._score) || 0;
        const cycleMin = distM(uLat, uLng, top.lat, top.lng) / 200;
        const sweepMin = 3 + top.currentBikes * 0.5;
        const hotspotScore = (top.currentBikes / (cycleMin + sweepMin)) * top.priorityMult;
        if (hotspotScore > bayScore) {
          try { showToast('🎯 HOTSPOT: ' + top.name + ' — ' + top.currentBikes + ' free-floats', 'orange'); } catch(e) {}
          return {
            name: top.name, lat: top.lat, lng: top.lng,
            isHotspot: true, hotspotId: top.id,
            bikesAt: top.currentBikes,
            _score: hotspotScore
          };
        }
      }

      // 3) Normal
      return _smartNext();
    };
  }

  // ---- Wrap Tidy (hotspot-aware) ----
  const _confirmTidy = window.confirmTidy;
  if (typeof _confirmTidy === 'function') {
    window.confirmTidy = function(target) {
      if (target && target.isHotspot) {
        const answer = prompt('Sweep at ' + target.name + '\nHow many bikes moved INTO bays?', String(target.bikesAt || 0));
        if (answer === null) return;
        const n = parseInt(answer, 10) || 0;
        localStorage.setItem('limebay_hotspot_' + target.hotspotId, String(Date.now()));
        try {
          ss.tidied = (ss.tidied || 0) + n;
          ss.hotspotSweeps = (ss.hotspotSweeps || 0) + 1;
          localStorage.setItem('limebay_shift7', JSON.stringify(ss));
        } catch(e) {}
        try { showToast('✅ Swept ' + n + ' bikes from ' + target.name, 'green'); } catch(e) {}
        return;
      }
      return _confirmTidy.apply(this, arguments);
    };
  }

  // ---- Map render ----
  let hotspotLayers = [];
  function renderHotspots() {
    if (typeof map === 'undefined' || !map) return;
    hotspotLayers.forEach(l => { try { map.removeLayer(l); } catch(e) {} });
    hotspotLayers = [];
    const list = HOTSPOTS[curZone] || [];
    list.forEach(h => {
      const count = countBikesNear(h);
      const isActive = count >= h.activateThreshold;
      const color = isActive ? '#ff8c00' : '#999999';
      const circle = L.circle([h.lat, h.lng], {
        radius: h.radius, color, fillColor: color,
        fillOpacity: isActive ? 0.20 : 0.08,
        dashArray: '8,6', weight: 2
      }).addTo(map).bindPopup(
        '<b>' + h.name + '</b><br>' + count + ' free-float bikes<br>' +
        (isActive ? '🎯 ACTIVE' : 'Below threshold (' + h.activateThreshold + ')')
      );
      hotspotLayers.push(circle);
    });
  }

  // Re-render after each refresh
  const _refreshOnly = window.refreshOnly;
  if (typeof _refreshOnly === 'function') {
    window.refreshOnly = async function() {
      const r = await _refreshOnly.apply(this, arguments);
      setTimeout(renderHotspots, 200);
      return r;
    };
  }
  setTimeout(renderHotspots, 2000);

  // Debug hook
  window.debugHotspots = () => (HOTSPOTS[curZone] || []).map(h => ({
    name: h.name, bikes: countBikesNear(h), threshold: h.activateThreshold
  }));
})();