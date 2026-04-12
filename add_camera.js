var fs = require('fs');
var c = fs.readFileSync('index.html', 'utf8');

// Add camera popup HTML before controls
var camHTML = `
<div class="popup" id="camPopup" style="min-width:300px">
  <div style="font-size:15px;font-weight:700;color:#32D74B;margin-bottom:8px" id="camTitle">Photo</div>
  <div style="position:relative;width:280px;margin:0 auto;border-radius:10px;overflow:hidden">
    <video id="camVideo" autoplay playsinline style="width:280px;display:block;background:#000"></video>
    <div id="camOvr" style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.75);padding:8px 10px;backdrop-filter:blur(4px)">
      <div style="color:#FF9F0A;font-size:12px;font-weight:700" id="oTime">--</div>
      <div style="color:#fff;font-size:10px;line-height:1.5;margin-top:2px" id="oAddr">Detecting...</div>
      <div style="color:#999;font-size:9px;margin-top:2px" id="oCoord">--</div>
    </div>
  </div>
  <canvas id="camCanvas" style="display:none"></canvas>
  <img id="camPreview" style="width:280px;border-radius:10px;display:none;margin:8px auto 0">
  <div id="camCount" style="color:#FF9F0A;font-size:12px;font-weight:600;margin-top:4px"></div>
  <div id="camBtns1">
    <button style="background:#32D74B;color:#000" onclick="snapPhoto()">Snap Before</button>
    <button style="background:#333;color:#fff" onclick="closeCam()">Cancel</button>
  </div>
  <div id="camBtns2" style="display:none">
    <button style="background:#FF9F0A;color:#000" onclick="snapAfter()">Snap After</button>
    <button style="background:#3DB551;color:#fff" onclick="shareAll()">Share to Slack</button>
    <button style="background:#0A84FF;color:#fff" onclick="saveAll()">Save Photos</button>
    <button style="background:#333;color:#fff" onclick="closeCam()">Done</button>
  </div>
</div>`;

c = c.replace('<div id="controls">', camHTML + '\n<div id="controls">');

// Add Photo button to bay popups - find the Navigate link
c = c.replace(
  "'>Navigate</a> \"+(bay.ts?",
  "'>Navigate</a> <button onclick='openCam(\"+i+\")' style='margin-top:6px;padding:6px 12px;background:#FF9F0A;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:12px'>Photo</button> \"+(bay.ts?"
);

// Add camera JS before renderBays() at the end
var camJS = `
var camS=null,camI=null,camIdx=null,camBlob=null,camPhotos=[],camAddrL=[],camLt=0,camLn=0;
function openCam(idx){
  camIdx=idx;camPhotos=[];camBlob=null;camAddrL=[];
  document.getElementById("camTitle").textContent=bays[idx].name;
  document.getElementById("camPreview").style.display="none";
  document.getElementById("camBtns2").style.display="none";
  document.getElementById("camBtns1").style.display="block";
  document.getElementById("camCount").textContent="";
  var btn=document.querySelector("#camBtns1 button");
  btn.textContent="Snap Before";btn.style.background="#32D74B";
  oP("camPopup");startCam();
}
function startCam(){
  document.getElementById("camVideo").style.display="block";
  document.getElementById("camOvr").style.display="block";
  camLt=uLat;camLn=uLng;
  navigator.geolocation.getCurrentPosition(function(p){
    camLt=p.coords.latitude;camLn=p.coords.longitude;
    document.getElementById("oCoord").textContent=camLt.toFixed(5)+"N  "+Math.abs(camLn).toFixed(5)+"W";
    fetch("https://nominatim.openstreetmap.org/reverse?format=json&lat="+camLt+"&lon="+camLn+"&zoom=18").then(function(r){return r.json()}).then(function(data){
      if(data.address){
        var a=data.address;
        var st=(a.house_number||"")+(a.house_number?" ":"")+( a.road||"");
        camAddrL=[st,a.city||a.town||a.suburb||"London",a.state||a.county||"England",a.postcode||"",a.country||"United Kingdom"].filter(function(x){return x});
        document.getElementById("oAddr").innerHTML=camAddrL.join("<br>");
      }
    }).catch(function(){camAddrL=[bays[camIdx].name];document.getElementById("oAddr").textContent=bays[camIdx].name});
  },function(){camAddrL=[bays[camIdx].name]},{enableHighAccuracy:true});
  camI=setInterval(function(){
    var now=new Date();
    var M=["January","February","March","April","May","June","July","August","September","October","November","December"];
    var d=now.getDate(),sf="th";if(d%10==1&&d!=11)sf="st";if(d%10==2&&d!=12)sf="nd";if(d%10==3&&d!=13)sf="rd";
    document.getElementById("oTime").textContent=d+sf+" "+M[now.getMonth()]+" "+now.getFullYear()+" "+now.toLocaleTimeString("en-GB");
  },500);
  navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1440}},audio:false}).then(function(s){
    camS=s;document.getElementById("camVideo").srcObject=s;
  }).catch(function(e){document.getElementById("camTitle").textContent="Camera: "+e.message});
}
function stopCam(){if(camS){camS.getTracks().forEach(function(t){t.stop()});camS=null}if(camI){clearInterval(camI);camI=null}}
function snapPhoto(){
  var v=document.getElementById("camVideo");
  var cv=document.getElementById("camCanvas");
  var ctx=cv.getContext("2d");
  cv.width=v.videoWidth||1920;cv.height=v.videoHeight||1440;
  ctx.drawImage(v,0,0);stopCam();
  v.style.display="none";document.getElementById("camOvr").style.display="none";
  var now=new Date();
  var M=["January","February","March","April","May","June","July","August","September","October","November","December"];
  var d=now.getDate(),sf="th";if(d%10==1&&d!=11)sf="st";if(d%10==2&&d!=12)sf="nd";if(d%10==3&&d!=13)sf="rd";
  var dateLine=d+sf+" "+M[now.getMonth()]+" "+now.getFullYear()+" "+now.toLocaleTimeString("en-GB");
  var lines=[dateLine].concat(camAddrL);
  var fs2=Math.round(cv.width*0.024);
  var pad=fs2*0.8;var lh=fs2*1.45;var bh=lines.length*lh+pad*2;var by=cv.height-bh;
  ctx.fillStyle="rgba(0,0,0,.72)";ctx.fillRect(0,by,cv.width,bh);
  for(var li=0;li<lines.length;li++){
    ctx.font=(li===0?"bold ":"")+fs2+"px -apple-system,Helvetica,sans-serif";
    ctx.fillStyle=li===0?"#FF9F0A":li===1?"#FFFFFF":"#CCCCCC";
    ctx.shadowColor="rgba(0,0,0,.8)";ctx.shadowBlur=3;
    ctx.fillText(lines[li],pad,by+pad+lh*(li+0.75));
  }
  ctx.shadowBlur=0;
  cv.toBlob(function(blob){
    camBlob=blob;
    document.getElementById("camPreview").src=URL.createObjectURL(blob);
    document.getElementById("camPreview").style.display="block";
    document.getElementById("camBtns1").style.display="none";
    document.getElementById("camBtns2").style.display="block";
    document.getElementById("camCount").textContent=(camPhotos.length+1)+" photo(s)";
  },"image/jpeg",0.88);
}
function snapAfter(){
  if(camBlob)camPhotos.push(camBlob);camBlob=null;
  document.getElementById("camPreview").style.display="none";
  document.getElementById("camBtns2").style.display="none";
  document.getElementById("camBtns1").style.display="block";
  var btn=document.querySelector("#camBtns1 button");
  btn.textContent="Snap After";btn.style.background="#0A84FF";
  startCam();
}
function shareAll(){
  if(camBlob)camPhotos.push(camBlob);
  if(!camPhotos.length)return;
  var bay=bays[camIdx];var label=bay.red?" red star":"";
  var msg=bay.name+label+"\\n"+(bay.ts||"tidy");
  var files=camPhotos.map(function(b,i){
    var lbl=camPhotos.length===1?"":i===0?"_before":"_after";
    return new File([b],bay.name.replace(/ /g,"_")+lbl+"_"+Date.now()+".jpg",{type:"image/jpeg"});
  });
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:files})){
    navigator.share({text:msg,files:files}).then(function(){
      toast("Shared "+files.length+" photo(s)!");camPhotos=[];closeCam();
    }).catch(function(){});
  }else{
    var ta=document.getElementById("copyText");ta.value=msg;oP("copyPopup");ta.focus();ta.select();saveAll();
  }
}
function saveAll(){
  if(camBlob)camPhotos.push(camBlob);
  camPhotos.forEach(function(b,i){
    var a=document.createElement("a");a.href=URL.createObjectURL(b);
    var lbl=camPhotos.length===1?"":i===0?"_before":"_after";
    a.download=bays[camIdx].name.replace(/ /g,"_")+lbl+"_"+Date.now()+".jpg";
    document.body.appendChild(a);a.click();document.body.removeChild(a);
  });
  toast(camPhotos.length+" photo(s) saved");camPhotos=[];
}
function closeCam(){stopCam();cP("camPopup");camPhotos=[];camBlob=null}
`;

c = c.replace('renderBays();', camJS + '\nrenderBays();');

// Verify
var sc = c.split('<script>')[1].split('<\/script>')[0];
try { new Function(sc); console.log("JS SYNTAX: OK"); } catch(e) { console.log("JS ERROR:", e.message); process.exit(1); }

fs.writeFileSync('index.html', c);
console.log("Camera added! Size:", c.length);
