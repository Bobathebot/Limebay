// ===== LimeBay Algo v2.1 — Adaptive + Auto-Arrival + Explanations =====
var ALGO_V2 = {
  cycleMpm: 200,
  bre1:  { cooldownMin: 25, targetBph: 7, churn: 'predict' },
  wm:    { cooldownMin: 40, targetBph: 6, churn: 'off' },
  rbkc6: { cooldownMin: 25, targetBph: 6, churn: 'predict' }
};
var SHIFT_DONE_KEY = 'limebay_shift_done_v2';
var LUNCH_KEY = 'limebay_lunch_v2';
var lastObservation = {};
var currentlyAtBay = null;
var arrivalGpsTs = null;

function shiftDoneCount() { var r = localStorage.getItem(SHIFT_DONE_KEY); return r ? parseInt(r) : 0; }
function incrShiftDone() { localStorage.setItem(SHIFT_DONE_KEY, (shiftDoneCount()+1).toString()); }
function resetShiftDone() { localStorage.removeItem(SHIFT_DONE_KEY); }

function getLunch() { return JSON.parse(localStorage.getItem(LUNCH_KEY) || '{"paused":false,"pausedAt":0,"totalMs":0}'); }
function setLunch(s) { localStorage.setItem(LUNCH_KEY, JSON.stringify(s)); }
function toggleLunch() {
  var l = getLunch();
  if (l.paused) { l.totalMs += Date.now() - l.pausedAt; l.paused = false; l.pausedAt = 0; setLunch(l); toast('Lunch ended. Timer resumed.'); }
  else { l.paused = true; l.pausedAt = Date.now(); setLunch(l); toast('Lunch started. Timer paused.'); }
  pace();
}
function effectiveShiftMs() {
  if (!ss) return 0;
  var l = getLunch();
  var now = Date.now();
  var paused = l.totalMs + (l.paused ? (now - l.pausedAt) : 0);
  return Math.max(0, (now - ss) - paused);
}

function getBaseCooldown() { return (ALGO_V2[curZone] || ALGO_V2.bre1).cooldownMin; }
function bayCooldownMin(bay) {
  var cd = getBaseCooldown();
  var rate = getRefillRate(bay);
  if (rate > 0.1) cd = Math.max(15, Math.min(60, Math.round(3 / rate)));
  return cd;
}
function isCooldown(bay) {
  if (!bay.at) return false;
  return ((Date.now() - bay.at) / 60000) < bayCooldownMin(bay);
}
function cooldownRemainingMin(bay) {
  if (!bay.at) return 0;
  return Math.max(0, Math.round(bayCooldownMin(bay) - (Date.now() - bay.at)/60000));
}

function cycleMinTo(bay) {
  return Math.max(1, Math.ceil(dist(uLat, uLng, bay.lat, bay.lng) / ALGO_V2.cycleMpm));
}

function observeRefill() {
  var now = Date.now();
  var hour = new Date().getHours();
  bays.forEach(function(bay) {
    var bc = bikesAt(bay);
    if (bay.at && now > bay.at) {
      var mins = (now - bay.at) / 60000;
      if (mins > 5 && mins < 180) {
        var rate = bc / mins;
        if (!learnData[bay.name]) learnData[bay.name] = {visits:[],avgTime:5,timePerBike:1,baseTime:2};
        var ld = learnData[bay.name];
        ld.refillRate = ld.refillRate ? (0.7*ld.refillRate + 0.3*rate) : rate;
        ld.refillByHour = ld.refillByHour || {};
        var h = ld.refillByHour[hour] || {rate: rate, n: 0};
        h.rate = h.n > 0 ? (0.7*h.rate + 0.3*rate) : rate;
        h.n += 1;
        ld.refillByHour[hour] = h;
      }
    }
    lastObservation[bay.name] = {ts: now, bikes: bc};
  });
  localStorage.setItem(LEARN_KEY, JSON.stringify(learnData));
}
function getRefillRate(bay) {
  var ld = learnData[bay.name];
  if (!ld) return 0;
  var hour = new Date().getHours();
  if (ld.refillByHour && ld.refillByHour[hour] && ld.refillByHour[hour].n >= 2) return ld.refillByHour[hour].rate;
  return ld.refillRate || 0;
}

function predictBikesNow(bay) {
  var bc = bikesAt(bay);
  var rate = getRefillRate(bay);
  var lo = lastObservation[bay.name];
  if (rate && lo) {
    var mins = (Date.now() - lo.ts) / 60000;
    return bc + rate * mins;
  }
  return bc;
}

function scoreBay(bay) {
  var res = {bay:bay, score:-1, reasons:[]};
  if (bay.ts) { res.reasons.push('done this round'); return res; }
  if (isCooldown(bay)) { res.reasons.push('cooldown '+cooldownRemainingMin(bay)+'min'); return res; }
  var predicted = predictBikesNow(bay);
  var bc = bikesAt(bay);
  if (predicted < 1) { res.score = 0; res.reasons.push('no bikes'); return res; }
  var tidy = predictTime(bay);
  var travel = cycleMinTo(bay);
  var total = travel + tidy;
  var overCapBonus = bc > zData.maxCap ? 3 : 0;
  var bhPenalty = isBlackHole(bay) ? 0.5 : 1;
  var churnMode = (ALGO_V2[curZone] || ALGO_V2.bre1).churn;
  var churnMult = 1;
  if (churnMode === 'avoid' && isMessy(bay)) churnMult = 0.5;
  res.score = Math.round(((predicted + overCapBonus) / total) * bhPenalty * churnMult * 100) / 100;
  res.predicted = Math.round(predicted*10)/10;
  res.tidy = tidy; res.travel = travel; res.bikes = bc;
  if (overCapBonus) res.reasons.push('OVER CAP');
  if (bhPenalty < 1) res.reasons.push('black hole');
  if (churnMult < 1) res.reasons.push('high churn');
  return res;
}

function smartNext() {
  var all = bays.map(scoreBay).filter(function(r){return r.score > 0;});
  if (!all.length) {
    var cool = bays.filter(isCooldown);
    if (cool.length) {
      var n = cool.slice().sort(function(a,b){return cooldownRemainingMin(a)-cooldownRemainingMin(b)})[0];
      toast('Round done. Next ready: '+n.name+' in '+cooldownRemainingMin(n)+'min');
    } else toast('No bays with bikes. Refresh?');
    return;
  }
  all.sort(function(a,b){return b.score - a.score});
  var p = all[0];
  var idx = bays.indexOf(p.bay);
  map.setView([p.bay.lat, p.bay.lng], 16);
  if (bayMarks[idx]) bayMarks[idx].openPopup();
  var why = p.bikes+' bikes, ~'+p.tidy+'min tidy, '+p.travel+'min cycle';
  if (p.reasons.length) why += ' ['+p.reasons.join(', ')+']';
  var msg = '-> '+p.bay.name+'<br>'+why+'<br>Score '+p.score;
  if (all.length > 1) msg += '<br><span style="color:#888">runner-up: '+all[1].bay.name+' ('+all[1].score+')</span>';
  var t = document.getElementById('toast');
  t.innerHTML = msg;
  t.style.display = 'block';
  t.style.whiteSpace = 'normal';
  t.style.maxWidth = '85vw';
  t.style.textAlign = 'left';
  t.style.fontSize = '12px';
  t.style.lineHeight = '1.4';
  setTimeout(function(){ t.style.display='none'; }, 6500);
}

function startArrivalWatcher() {
  if (!navigator.geolocation) return;
  if (localStorage.getItem('autoArrive') === 'off') return;
  navigator.geolocation.watchPosition(function(p) {
    var lat = p.coords.latitude, lng = p.coords.longitude;
    var nearestIdx = null, nearestD = Infinity;
    for (var i = 0; i < bays.length; i++) {
      var d = dist(lat, lng, bays[i].lat, bays[i].lng);
      if (d < nearestD) { nearestD = d; nearestIdx = i; }
    }
    var here = (nearestIdx !== null && nearestD <= (zData.radius + 10)) ? nearestIdx : null;
    if (here !== currentlyAtBay) {
      if (here !== null) {
        currentlyAtBay = here;
        arrivalGpsTs = Date.now();
        arrivalTime = Date.now();
        arrivalBikes = bikesAt(bays[here]);
        arrivalSpread = bikeSpread(bays[here]);
        toast('Arrived: '+bays[here].name+' ('+arrivalBikes+' bikes)');
      } else {
        var left = currentlyAtBay; currentlyAtBay = null;
        if (arrivalGpsTs && (Date.now() - arrivalGpsTs) > 45000 && !bays[left].ts) {
          pendTidy = left;
          openTidy(left);
        }
        arrivalGpsTs = null;
      }
    }
  }, null, {enableHighAccuracy: true, maximumAge: 5000});
}

function shareTidyToSlack() {
  if (pendTidy === null) return;
  var b = bays[pendTidy];
  var label = b.red ? ' red star' : '';
  var ts = new Date().toLocaleString('en-GB', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  var msg = (b.red ? 'Red star bays:\n' : 'Other bays:\n') + b.name + label + '\n' + (b.ts || 'tidy') + '\n' + ts;
  if (navigator.share) { navigator.share({text: msg}).catch(function(){}); }
  else { var ta = document.getElementById('copyText'); ta.value = msg; oP('copyPopup'); ta.focus(); ta.select(); }
}

pace = function() {
  if (!ss) { document.getElementById('paceDisplay').textContent = ''; return; }
  var d = shiftDoneCount();
  var l = getLunch();
  if (!d && !l.paused) { document.getElementById('paceDisplay').textContent = ''; return; }
  var h = effectiveShiftMs() / 3600000;
  var bph = h > 0.01 ? (d/h).toFixed(1) : '0.0';
  var target = (ALGO_V2[curZone] || ALGO_V2.bre1).targetBph;
  var col = parseFloat(bph) >= target ? '#32D74B' : parseFloat(bph) >= (target-2) ? '#FF9F0A' : '#FF453A';
  var lbl = l.paused ? " <span style='color:#FF9F0A'>LUNCH</span>" : '';
  document.getElementById('paceDisplay').innerHTML = "<span style='color:"+col+"'>"+bph+" bph</span><span style='color:#666'> ("+d+" done, "+target+"/h)</span>"+lbl;
};
setInterval(function(){ pace(); }, 5000);

var _v2_confirm = confirmTidy;
confirmTidy = function(s) {
  var wasPend = pendTidy !== null;
  if (wasPend && s !== 'skipped') incrShiftDone();
  _v2_confirm(s);
};

resetBays = function() {
  if (!confirm('Reset round tags? Cooldowns + BPH counter preserved.')) return;
  bays.forEach(function(b){ b.ts = null; });
  save(); renderBays();
  toast('Round reset. Cooldowns still active.');
};

var _v2_endShift = endShift;
endShift = function() { _v2_endShift(); resetShiftDone(); localStorage.removeItem(LUNCH_KEY); };

nearestBay = smartNext;

var _v2_refresh = refreshOnly;
refreshOnly = function() { _v2_refresh(); setTimeout(observeRefill, 2500); };

osrmRoute = function(coords, callback) {
  if (coords.length < 2) { callback(coords); return; }
  var pts = coords.map(function(c){return c[1]+','+c[0]}).join(';');
  fetch('https://router.project-osrm.org/route/v1/bike/'+pts+'?overview=full&geometries=geojson')
    .then(function(r){return r.json()})
    .then(function(data){
      if (data.routes && data.routes[0]) callback(data.routes[0].geometry.coordinates.map(function(c){return [c[1],c[0]]}));
      else callback(coords);
    }).catch(function(){ callback(coords); });
};

(function() {
  var rows = document.querySelectorAll('#controls .row');
  if (rows.length >= 3) {
    var btn = document.createElement('button');
    btn.className = 'btn bo';
    btn.textContent = 'Lunch';
    btn.onclick = toggleLunch;
    rows[2].appendChild(btn);
  }
  var tp = document.getElementById('tidyPopup');
  if (tp) {
    var shareBtn = document.createElement('button');
    shareBtn.style.cssText = 'background:#5A3DC5;color:#fff';
    shareBtn.textContent = 'Share to Slack';
    shareBtn.onclick = shareTidyToSlack;
    var cancelBtn = tp.querySelector('button:last-child');
    tp.insertBefore(shareBtn, cancelBtn);
  }
})();

startArrivalWatcher();
console.log('[LimeBay Algo v2.1] loaded');