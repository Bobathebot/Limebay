/* LimeBay Algo v2.2 — soft schedule boost + corridor hotspots
 * Loads AFTER algo-v2.js. Re-wraps smartNext and confirmTidy.
 */
(function(){
  if (window.__LIMEBAY_V22__) return;
  window.__LIMEBAY_V22__ = true;
  console.log('[LimeBay Algo v2.2] loaded');

  // ---- Hotspot data ----
  // type: 'corridor' = buffered polyline along road segments (covers road only)
  // type: 'circle'   = classic circle (use for open squares etc.)
  const HOTSPOTS = {
    wm: [{
      id: 'baker-blandford',
      name: 'Baker/Blandford corridor',
      type: 'corridor',
      // User-drawn LineString along Baker St + surrounds, extending north toward Marylebone Rd.
      // Each inner array is ONE polyline (list of [lat,lng] vertices). v2.2 walks consecutive
      // segments and checks 15m each side via pointToSegmentM.
      corridors: [[
        [51.51749735, -0.15541576],
        [51.51816267, -0.15571733],
        [51.51948760, -0.15631132],
        [51.51817088, -0.15567128],
        [51.51794330, -0.15705585],
        [51.51826029, -0.15503125],
        [51.51818714, -0.15572353],
        [51.51947947, -0.15631132],
        [51.51956075, -0.15565822],
        [51.51940632, -0.15669011],
        [51.51947947, -0.15632438],
        [51.52196642, -0.15744614],
        [51.52478260, -0.15868822]
      ]],
      width: 15,                    // metres each side of centre-line (30m total)
      lat: 51.5195, lng: -0.1565,   // approx centre for distance-from-user scoring
      activateThreshold: 5,
      priorityMult: 1.5,
      cooldownMin: 30,
      addedBy: 'manager',
      notes: 'Baker St + surrounds (user-drawn path) — road corridor only, excludes nearby bays'
    }],
    bre1: [], rbkc6: []
  };

  // ---- Helpers ----
  function toRad(x) { return x * Math.PI / 180; }

  function distM(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const h = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // Metres from point P to line segment AB. Flat-earth approx — accurate to <0.5% for <1km spans.
  function pointToSegmentM(pLat, pLng, aLat, aLng, bLat, bLng) {
    const mLat = 111320, mLng = 111320 * Math.cos(toRad(pLat));
    const px = (pLng - aLng) * mLng, py = (pLat - aLat) * mLat;
    const bx = (bLng - aLng) * mLng, by = (bLat - aLat) * mLat;
    const seg2 = bx*bx + by*by;
    if (seg2 === 0) return Math.hypot(px, py);
    const t = Math.max(0, Math.min(1, (px*bx + py*by) / seg2));
    return Math.hypot(px - t*bx, py - t*by);
  }

  function getBikeList() {
    const candidates = [
      (typeof bikes !== 'undefined') ? bikes : null,
      window.bikes, window.bikeList, window.prevBikePositions
    ];
    for (const c of candidates) {
      if (Array.isArray(c)) return c;
      if (c && typeof c === 'object') return Object.values(c);
    }
    return [];
  }

  function bikeInHotspot(b, h) {
    const bLat = b.lat ?? b.latitude ?? (b.location && b.location.lat);
    const bLng = b.lng ?? b.longitude ?? (b.location && b.location.lng);
    if (bLat == null || bLng == null) return false;
    if (h.type === 'corridor' && Array.isArray(h.corridors)) {
      const w = h.width || 15;
      for (const poly of h.corridors) {
        if (!Array.isArray(poly) || poly.length < 2) continue;
        for (let i = 0; i < poly.length - 1; i++) {
          const a = poly[i], bp = poly[i+1];
          const d = pointToSegmentM(bLat, bLng, a[0], a[1], bp[0], bp[1]);
          if (d <= w) return true;
        }
      }
      return false;
    }
    return distM(h.lat, h.lng, bLat, bLng) <= (h.radius || 80);
  }

  function countBikesNear(h) {
    return getBikeList().filter(b => bikeInHotspot(b, h)).length;
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

  // ---- Schedule soft boost ----
  // Returns { bay, entry, delta, boost } or null. Boost multiplies bay score;
  // algo is still free to pick something else if it scores higher.
  function getScheduleCandidate() {
    if (curZone !== 'wm' || typeof WM_SCHEDULE === 'undefined') return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    let best = null;
    for (const entry of WM_SCHEDULE) {
      const time = entry.time || entry[0];
      const bayName = entry.bay || entry.name || entry[1];
      if (!time || !bayName) continue;
      const [h, m] = time.split(':').map(Number);
      const delta = (h * 60 + m) - nowMin;  // +ve = upcoming, -ve = overdue
      let boost;
      if (delta >= 0 && delta <= 10) boost = 2.5;        // prime window
      else if (delta > 10 && delta <= 30) boost = 1.7;   // soon
      else if (delta > 30 && delta <= 60) boost = 1.25;  // mild nudge
      else if (delta < 0 && delta >= -20) boost = 1.8;   // catch-up (overdue)
      else continue;
      const bay = (bays || []).find(b => b.name === bayName || (b.name||'').includes(bayName));
      if (bay && (!best || boost > best.boost)) {
        best = { bay, entry: { time, bay: bayName }, delta, boost };
      }
    }
    return best;
  }

  // ---- Wrap Smart Next ----
  const _smartNext = window.smartNext;
  if (typeof _smartNext === 'function') {
    window.smartNext = function() {
      const bestBay = _smartNext();
      let winner = bestBay;
      let winnerScore = (bestBay && bestBay._score) || 0;
      let winnerKind = 'bay';
      let schedInfo = null;

      // Schedule soft boost
      const sched = getScheduleCandidate();
      if (sched) {
        if (typeof window.scoreBay === 'function') {
          try {
            const s = window.scoreBay(sched.bay) || 0;
            const boosted = s * sched.boost;
            if (boosted > winnerScore) {
              winner = sched.bay;
              winnerScore = boosted;
              winnerKind = 'schedule';
              schedInfo = sched;
            }
          } catch(e) {}
        } else if (!window.__v22_warnScoreBay) {
          console.warn('[v2.2] window.scoreBay not found — schedule boost disabled');
          window.__v22_warnScoreBay = true;
        }
      }

      // Hotspot
      const active = getActiveHotspots();
      if (active.length) {
        const top = active.sort((a,b) => b.currentBikes - a.currentBikes)[0];
        const cycleMin = distM(uLat, uLng, top.lat, top.lng) / 200;
        const sweepMin = 3 + top.currentBikes * 0.5;
        const hotspotScore = (top.currentBikes / (cycleMin + sweepMin)) * top.priorityMult;
        if (hotspotScore > winnerScore) {
          winner = {
            name: top.name, lat: top.lat, lng: top.lng,
            isHotspot: true, hotspotId: top.id,
            bikesAt: top.currentBikes, _score: hotspotScore
          };
          winnerScore = hotspotScore;
          winnerKind = 'hotspot';
        }
      }

      // Toast by winner kind
      try {
        if (winnerKind === 'schedule' && schedInfo) {
          const mins = schedInfo.delta >= 0 ? ('in ' + schedInfo.delta + 'min') : ((-schedInfo.delta) + 'min overdue');
          showToast('📋 PREFER: ' + schedInfo.entry.bay + ' @ ' + schedInfo.entry.time + ' (' + mins + ')', 'blue');
        } else if (winnerKind === 'hotspot') {
          showToast('🎯 HOTSPOT: ' + winner.name + ' — ' + winner.bikesAt + ' free-floats', 'orange');
        }
      } catch(e) {}

      return winner;
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

  // ---- Slack share: v2.3 format spec ----
  // Builds: <section>\n<bay> [red star | — HH:MM]\n<footer>\n<timestamp>
  // footer depends on pic count (prompted at share time)
  function getCurrentScheduleTimeForBay(bay) {
    if (!bay || curZone !== 'wm' || typeof WM_SCHEDULE === 'undefined') return null;
    const bayName = (bay.name || '').toLowerCase();
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const slots = [];
    for (const entry of WM_SCHEDULE) {
      const time = entry.time || entry[0];
      const eName = entry.bay || entry.name || entry[1];
      if (!time || !eName) continue;
      const en = String(eName).toLowerCase();
      if (!bayName.includes(en) && !en.includes(bayName)) continue;
      const [h, m] = time.split(':').map(Number);
      slots.push({ time, min: h * 60 + m });
    }
    if (!slots.length) return null;
    slots.sort((a, b) => a.min - b.min);
    // Cutoff = next slot's time, or +90min for last slot
    for (let i = 0; i < slots.length; i++) {
      const cutoff = slots[i+1] ? slots[i+1].min : slots[i].min + 90;
      if (nowMin < cutoff) return slots[i].time;
    }
    return slots[0].time;  // past all slots: show first of next day
  }

  const _shareTidyToSlack = window.shareTidyToSlack;
  if (typeof _shareTidyToSlack === 'function') {
    window.shareTidyToSlack = function() {
      if (typeof pendTidy === 'undefined' || pendTidy === null) {
        return _shareTidyToSlack.apply(this, arguments);
      }
      const b = bays[pendTidy];
      if (!b) return _shareTidyToSlack.apply(this, arguments);

      const picAns = prompt('How many photos are you sharing?\n1 = already tidy, 2+ = tidied', '2');
      if (picAns === null) return;  // user cancelled
      const picCount = Math.max(1, parseInt(picAns, 10) || 1);
      const footer = (picCount <= 1) ? 'already tidy' : 'tidied';

      let header = b.name;
      if (b.red) {
        header += ' red star';
      } else {
        const schedTime = getCurrentScheduleTimeForBay(b);
        if (schedTime) header += ' — ' + schedTime;
      }

      const ts = new Date().toLocaleString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const section = b.red ? 'Red star bays:' : 'Other bays:';
      const msg = section + '\n' + header + '\n' + footer + '\n' + ts;

      if (navigator.share) {
        navigator.share({ text: msg }).catch(function(){});
      } else {
        const ta = document.getElementById('copyText');
        if (ta) {
          ta.value = msg;
          if (typeof oP === 'function') oP('copyPopup');
          ta.focus(); ta.select();
        }
      }
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
      const popupHtml = '<b>' + h.name + '</b><br>' + count + ' free-float bikes<br>' +
        (isActive ? '🎯 ACTIVE' : 'Below threshold (' + h.activateThreshold + ')');
      let layer;
      if (h.type === 'corridor' && Array.isArray(h.corridors)) {
        const lines = h.corridors.map(seg => L.polyline(seg, {
          color, weight: 12, opacity: isActive ? 0.65 : 0.30,
          lineCap: 'round', lineJoin: 'round'
        }));
        layer = L.layerGroup(lines).addTo(map);
        lines.forEach(l => l.bindPopup(popupHtml));
      } else {
        layer = L.circle([h.lat, h.lng], {
          radius: h.radius || 80, color, fillColor: color,
          fillOpacity: isActive ? 0.20 : 0.08,
          dashArray: '8,6', weight: 2
        }).addTo(map).bindPopup(popupHtml);
      }
      hotspotLayers.push(layer);
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