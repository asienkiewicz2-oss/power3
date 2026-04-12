const fs = require('fs');

function replaceAll(s, a, b) { return s.split(a).join(b); }

function insertBefore(s, marker, ins) {
  var i = s.indexOf(marker);
  if (i === -1) { console.warn('  MARKER NOT FOUND: ' + marker.substring(0, 80)); return s; }
  return s.substring(0, i) + ins + s.substring(i);
}

function replaceBetween(s, start, end, rep) {
  var si = s.indexOf(start);
  if (si === -1) { console.warn('  START NOT FOUND: ' + start.substring(0, 80)); return s; }
  var ei = s.indexOf(end, si + start.length);
  if (ei === -1) { console.warn('  END NOT FOUND: ' + end.substring(0, 80)); return s; }
  return s.substring(0, si) + rep + s.substring(ei);
}

// ===== NEW TEAMS (Ardern → Oprah, local img paths) =====
var TEAMS_NEW = `var TEAMS=[
  {id:"morgan",name:"J.P. Morgan",initials:"JPM",color:"#D35400",img:"img/morgan.jpg",bioFile:"bios/morgan.html",subtitle:"1837\\u20131913 \\u2022 USA",desc:"Bankier, budowniczy imperium finansowego \\u2014 decyzyjno\\u015b\\u0107, w\\u0142adza, wizja strategiczna"},
  {id:"oprah",name:"Oprah Winfrey",initials:"OW",color:"#9B59B6",img:"img/oprah.jpg",bioFile:"bios/oprah.html",subtitle:"ur. 1954 \\u2022 USA",desc:"Prezenterka, filantropka \\u2014 autentyczno\\u015b\\u0107, wp\\u0142yw transformacyjny, empatia"},
  {id:"swiatek",name:"Iga \\u015awi\\u0105tek",initials:"I\\u015a",color:"#E74C3C",img:"img/swiatek.jpg",bioFile:"bios/swiatek.html",subtitle:"ur. 2001 \\u2022 Polska",desc:"Polska tenisistka nr 1 \\u2014 dyscyplina, si\\u0142a mentalna, determinacja"},
  {id:"obama",name:"Barack Obama",initials:"BO",color:"#2980B9",img:"img/obama.jpg",bioFile:"bios/obama.html",subtitle:"ur. 1961 \\u2022 USA",desc:"44. prezydent USA \\u2014 charyzma, wizja zmiany, inspirowanie milion\\u00f3w"}
];`;

// ===== NEW CSS: vertical bar chart + config-row fix =====
var CSS_ADDITIONS = `
.config-row{max-width:420px}
.vbar-chart{display:flex;align-items:flex-end;gap:6px;height:180px;padding:8px 0;justify-content:center}
.vbar-col{display:flex;flex-direction:column;align-items:center;flex:1;min-width:0;max-width:60px}
.vbar-bar{width:100%;border-radius:4px 4px 0 0;transition:height .5s;display:flex;align-items:flex-start;justify-content:center;padding-top:2px;font-size:.62rem;font-weight:700;color:#fff;min-height:2px}
.vbar-label{font-size:.58rem;color:var(--muted);text-align:center;margin-top:4px;line-height:1.2;word-break:break-word;max-width:60px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.sylwetka-row{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
.sylwetka-row>div{flex:1;min-width:140px}
.zespol-row{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
.zespol-row>div{flex:1;min-width:200px}
.zespol-left{max-width:220px;flex:0 0 220px}
@media(max-width:700px){.sylwetka-row,.zespol-row{flex-direction:column}.sylwetka-row>div,.zespol-row>div{min-width:100%;flex:1}.zespol-left{max-width:100%;flex:1}}
`;

// ===== mkVBar function =====
var MK_VBAR_FN = `
function mkVBar(items,maxVal,color){
  var chart=document.createElement('div');chart.className='vbar-chart';
  for(var i=0;i<items.length;i++){
    var col=document.createElement('div');col.className='vbar-col';
    var h=Math.round(items[i].c/Math.max(maxVal,1)*100);
    var bar=document.createElement('div');bar.className='vbar-bar';bar.style.height=Math.max(h,2)+'%';bar.style.background=typeof color==='string'?color:(color[items[i].key]||'#5B8A9A');
    if(items[i].c>0)bar.textContent=items[i].c;
    col.appendChild(bar);
    var lbl=document.createElement('div');lbl.className='vbar-label';lbl.textContent=items[i].label;
    col.appendChild(lbl);
    chart.appendChild(col);
  }
  return chart;
}
`;

// ===== NEW buildTeamStatsSection (Zespół layout: photo+members | ring | top10) =====
var NEW_BUILD_TEAM_STATS_SECTION = `
function buildTeamStatsSection(container,ts,team,titleOverride){
  var subtitle=titleOverride||('Zesp\\u00f3\\u0142: '+team.name);
  container.innerHTML='<div class="page-sub" style="margin-bottom:12px;text-align:left">'+esc(subtitle)+' \\u2014 '+ts.total+' os\\u00f3b</div>';
  // Main row: photo+members | ring | top10
  var mainRow=document.createElement('div');mainRow.className='zespol-row';
  // Left: team photo + members
  var leftCol=document.createElement('div');leftCol.className='zespol-left';
  var savedPhoto=null;try{savedPhoto=localStorage.getItem('teamPhoto_'+team.id);}catch(e){}
  if(savedPhoto){var pimg=document.createElement('img');pimg.className='team-photo-img';pimg.style.maxWidth='200px';pimg.src=savedPhoto;leftCol.appendChild(pimg);}
  else{var phPl=document.createElement('div');phPl.className='team-photo-upload';phPl.style.margin='0 0 8px';
  var lbl2=document.createElement('label');lbl2.innerHTML='\\ud83d\\udcf7 Zdj\\u0119cie zespo\\u0142u';
  var fileIn2=document.createElement('input');fileIn2.type='file';fileIn2.accept='image/*';
  fileIn2.addEventListener('change',function(){
    if(!this.files||!this.files[0])return;
    var reader=new FileReader();reader.onload=function(ev){
      var data=ev.target.result;if(data.length>300000){alert('Max ~200KB');return;}
      try{localStorage.setItem('teamPhoto_'+team.id,data);}catch(ex){}
      if(typeof sendP==='function')sendP({type:'teamPhoto',team:team.id,data:data});
      var ni=document.createElement('img');ni.className='team-photo-img';ni.style.maxWidth='200px';ni.src=data;
      phPl.parentElement.insertBefore(ni,phPl);phPl.remove();
    };reader.readAsDataURL(this.files[0]);
  });lbl2.appendChild(fileIn2);phPl.appendChild(lbl2);leftCol.appendChild(phPl);}
  var pids=getTeamPids(team.id);
  if(pids.length){
    var pTitle=document.createElement('div');pTitle.style.cssText='color:var(--muted);font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;margin:8px 0 4px';pTitle.textContent='Cz\\u0142onkowie ('+pids.length+')';leftCol.appendChild(pTitle);
    var pList=document.createElement('div');pList.className='people-list-compact';
    for(var pi=0;pi<pids.length;pi++){var sd=S.studentData?S.studentData[pids[pi]]:null;if(!sd)continue;var pe=document.createElement('div');pe.textContent=sd.name||'?';pList.appendChild(pe);}
    leftCol.appendChild(pList);
  }
  mainRow.appendChild(leftCol);
  // Center: Schwartz ring
  var centerCol=document.createElement('div');
  var svgId='stSec_'+Math.random().toString(36).substr(2,4);
  centerCol.innerHTML='<h4 style="color:var(--muted);font-size:.72rem;text-align:center;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Ko\\u0142o Schwartza</h4><div style="max-width:300px;margin:0 auto"><svg id="'+svgId+'" viewBox="-60 -60 720 720" style="width:100%;height:auto"></svg></div>';
  mainRow.appendChild(centerCol);
  setTimeout(function(){buildRingFromStats(svgId,ts);},50);
  // Right: top 10 values
  var rightCol=document.createElement('div');
  rightCol.innerHTML='<h4 style="color:var(--muted);font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Top 10 warto\\u015bci</h4>';
  var vc=ts.vc;
  var sorted=Object.keys(vc).map(function(k){return{id:parseInt(k),c:vc[k]};}).sort(function(a,b){return b.c-a.c;}).slice(0,10);
  var maxV=sorted.length?sorted[0].c:1;
  for(var si=0;si<sorted.length;si++){var sv=valById(sorted[si].id);rightCol.appendChild(mkBar(sv?sv.pl:'?',sorted[si].c,maxV,'#5B8A9A'));}
  mainRow.appendChild(rightCol);
  container.appendChild(mainRow);
  // Row 2: Kategorie (vertical!) + Wymiary
  var row2=document.createElement('div');row2.className='dash-row';row2.style.marginTop='16px';
  var catCard=document.createElement('div');catCard.className='dash-card';catCard.style.cursor='default';
  var ch=document.createElement('h3');ch.textContent='Ranking kategorii';catCard.appendChild(ch);
  var catArr=CO.map(function(ck){return{key:ck,c:ts.cc[ck]||0,label:CATS[ck].pl};}).sort(function(a,b){return b.c-a.c;});
  var maxCat=catArr.length?catArr[0].c:1;
  catCard.appendChild(mkVBar(catArr,maxCat,'#5B8A9A'));
  row2.appendChild(catCard);
  var dimCard=document.createElement('div');dimCard.className='dash-card';dimCard.style.cursor='default';
  var dh=document.createElement('h3');dh.textContent='Wymiary Schwartza';dimCard.appendChild(dh);
  var dCol2={openness:'#C0695C',enhancement:'#C5A55A',conservation:'#5B8A9A',transcendence:'#8A6BA8'};
  var dimArr=['openness','enhancement','conservation','transcendence'].map(function(dk){var s=0;DIM_CATS[dk].forEach(function(ck2){s+=(ts.cc[ck2]||0);});return{key:dk,c:s,label:DIMS[dk].pl};}).sort(function(a,b){return b.c-a.c;});
  var maxDim=dimArr.length?dimArr[0].c:1;
  for(var dii=0;dii<dimArr.length;dii++)dimCard.appendChild(mkBar(DIMS[dimArr[dii].key].pl,dimArr[dii].c,maxDim,dCol2[dimArr[dii].key]));
  row2.appendChild(dimCard);
  container.appendChild(row2);
}
`;

// ===== NEW buildStudentTeamDash (Sylwetka: photo|ring|dims|cats side-by-side) =====
var NEW_BUILD_STD = `function buildStudentTeamDash(container,ts,team){
  container.innerHTML='';
  var exDone=S.leaderEx&&S.leaderEx.done;
  // === Accordion: Sylwetka lidera ===
  var a1h=document.createElement('div');a1h.className='accordion-hdr'+(exDone?'':' accordion-locked');
  a1h.innerHTML='<h3>Sylwetka lidera: '+esc(team.name)+'</h3><span class="accordion-chv">\\u25bc</span>';
  var a1b=document.createElement('div');a1b.className='accordion-bdy';
  if(exDone){
    a1h.addEventListener('click',function(){a1h.classList.toggle('open');});
    var sRow=document.createElement('div');sRow.className='sylwetka-row';
    // Col1: photo+name
    var pCol=document.createElement('div');pCol.style.cssText='text-align:center;flex:0 0 120px;min-width:100px';
    var avDiv=document.createElement('div');avDiv.className='leader-avatar';avDiv.style.cssText='background:linear-gradient(135deg,'+team.color+',#333);width:80px;height:80px;font-size:1.4rem;margin:0 auto 6px';
    if(team.img){var im=document.createElement('img');im.src=team.img;im.alt=team.name;im.onerror=function(){this.style.display='none';avDiv.textContent=team.initials;};avDiv.appendChild(im);}
    else avDiv.textContent=team.initials;
    pCol.appendChild(avDiv);
    var nm=document.createElement('div');nm.style.cssText='color:var(--gold);font-weight:700;font-size:.82rem';nm.textContent=team.name;pCol.appendChild(nm);
    if(team.subtitle){var sub=document.createElement('div');sub.style.cssText='color:var(--muted);font-size:.68rem';sub.textContent=team.subtitle;pCol.appendChild(sub);}
    sRow.appendChild(pCol);
    // Col2: mini ring
    var rCol=document.createElement('div');rCol.style.cssText='min-width:160px;max-width:240px';
    var miniRingId='miniLR_'+team.id;
    rCol.innerHTML='<h4 style="color:var(--muted);font-size:.72rem;text-align:center;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Ko\\u0142o warto\\u015bci</h4><svg id="'+miniRingId+'" viewBox="-60 -60 720 720" style="width:100%;height:auto"></svg>';
    sRow.appendChild(rCol);
    setTimeout(function(){
      var fs={cc:{},vc:{},total:1};for(var ck in CATS)fs.cc[ck]=0;
      for(var lvi=0;lvi<S.leaderEx.vals.length;lvi++){var lid=S.leaderEx.vals[lvi];fs.vc[lid]=1;var lv=valById(lid);if(lv)fs.cc[lv.cat]=(fs.cc[lv.cat]||0)+1;}
      buildRingFromStats(miniRingId,fs);
    },50);
    // Col3: dims
    var dCol=document.createElement('div');dCol.innerHTML='<h4 style="color:var(--muted);font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Wymiary</h4>';
    for(var di=0;di<S.leaderEx.dims.length;di++)dCol.innerHTML+='<div class="profile-rank-item"><span class="profile-rank-num">'+(di+1)+'</span><span class="profile-rank-label">'+DIMS[S.leaderEx.dims[di]].pl+'</span></div>';
    sRow.appendChild(dCol);
    // Col4: top5 cats
    var cCol=document.createElement('div');cCol.innerHTML='<h4 style="color:var(--muted);font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Top 5 kategorii</h4>';
    for(var ci=0;ci<Math.min(5,S.leaderEx.cats.length);ci++){var ck2=S.leaderEx.cats[ci];cCol.innerHTML+='<div class="profile-rank-item"><span class="profile-rank-num">'+(ci+1)+'</span><span class="profile-rank-label">'+CATS[ck2].pl+'</span></div>';}
    sRow.appendChild(cCol);
    a1b.appendChild(sRow);
  }
  container.appendChild(a1h);container.appendChild(a1b);
  // === Accordion: Zesp\\u00f3\\u0142 ===
  var a2h=document.createElement('div');a2h.className='accordion-hdr open';
  a2h.innerHTML='<h3>Zesp\\u00f3\\u0142</h3><span class="accordion-chv">\\u25bc</span>';
  a2h.addEventListener('click',function(){a2h.classList.toggle('open');});
  var a2b=document.createElement('div');a2b.className='accordion-bdy';
  if(ts&&ts.total){
    buildTeamStatsSection(a2b,ts,team);
  } else {a2b.innerHTML='<p style="color:var(--muted)">Brak danych zespo\\u0142u.</p>';}
  container.appendChild(a2h);container.appendChild(a2b);
  // === Accordion: Wsp\\u00f3lnie ===
  var a3h=document.createElement('div');a3h.className='accordion-hdr'+(exDone?'':' accordion-locked');
  a3h.innerHTML='<h3>Wsp\\u00f3lnie (zesp\\u00f3\\u0142 + lider)</h3><span class="accordion-chv">\\u25bc</span>';
  var a3b=document.createElement('div');a3b.className='accordion-bdy';
  if(exDone&&ts&&ts.total){
    a3h.addEventListener('click',function(){a3h.classList.toggle('open');});
    var combined={cc:{},vc:{},total:ts.total+1};
    for(var ck4 in CATS)combined.cc[ck4]=ts.cc[ck4]||0;
    for(var vk in ts.vc)combined.vc[vk]=ts.vc[vk];
    for(var lvi2=0;lvi2<S.leaderEx.vals.length;lvi2++){var lid2=S.leaderEx.vals[lvi2];combined.vc[lid2]=(combined.vc[lid2]||0)+1;var lv2=valById(lid2);if(lv2)combined.cc[lv2.cat]=(combined.cc[lv2.cat]||0)+1;}
    buildTeamStatsSection(a3b,combined,team,'Zesp\\u00f3\\u0142 + '+team.name);
  }
  container.appendChild(a3h);container.appendChild(a3b);
}
`;

// ===== PATCH index.html =====
function patchIndex(path) {
  var h = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  console.log('Patching ' + path + ' (' + h.length + ' chars)');

  // 1. CSS additions before </style>
  h = insertBefore(h, '\n</style>\n</head>', CSS_ADDITIONS);
  console.log('  [1] CSS additions');

  // 2. Fix config-row width (already has CSS, we added max-width via CSS_ADDITIONS)
  // Nothing extra needed

  // 3. Fix search placeholder (HTML)
  h = replaceAll(h, 'placeholder="Szukaj warto\\u015bci..."', 'placeholder="Szukaj wartości..."');
  console.log('  [3] Fixed search placeholder (HTML): ' + !h.includes('Szukaj warto\\u015bci'));

  // 4. Fix search placeholder (JS - dynamically created)
  h = replaceAll(h, "srch.placeholder='Szukaj warto\\u015bci...'", "srch.placeholder='Szukaj wartości...'");
  console.log('  [4] Fixed search placeholder (JS)');

  // 5. Replace TEAMS
  h = replaceBetween(h, 'var TEAMS=[', '\nvar SK=', TEAMS_NEW + '\n');
  console.log('  [5] TEAMS replaced (Ardern→Oprah, local img)');

  // 6. Add mkVBar before mkBar
  h = insertBefore(h, '\nfunction mkBar(', MK_VBAR_FN);
  console.log('  [6] mkVBar function added');

  // 7. Replace buildTeamStatsSection
  h = replaceBetween(h,
    '\nfunction buildTeamStatsSection(',
    '\nfunction buildStudentTeamDash(',
    NEW_BUILD_TEAM_STATS_SECTION + '\n');
  console.log('  [7] buildTeamStatsSection replaced');

  // 8. Replace buildStudentTeamDash
  h = replaceBetween(h,
    'function buildStudentTeamDash(container,ts,team){',
    '\nfunction buildRingFromStats(',
    NEW_BUILD_STD + '\nfunction buildRingFromStats(');
  console.log('  [8] buildStudentTeamDash replaced');

  // 9. Replace category bars in buildDash with vertical bars
  // Old: for(var j=0;j<catArr.length;j++)c2.cnt.appendChild(mkBar(CATS[catArr[j].key].pl,catArr[j].c,maxCat,'#5B8A9A'));
  // New: vertical bars
  h = h.replace(
    "var c2=mkCard('Ranking kategorii');var catArr=CO.filter(function(ck){return activeCats[ck];}).map(function(ck){return{key:ck,c:cc[ck]||0};}).sort(function(a,b){return b.c-a.c;});\n  var maxCat=catArr.length?catArr[0].c:1;\n  for(var j=0;j<catArr.length;j++)c2.cnt.appendChild(mkBar(CATS[catArr[j].key].pl,catArr[j].c,maxCat,'#5B8A9A'));",
    "var c2=mkCard('Ranking kategorii');var catArr=CO.filter(function(ck){return activeCats[ck];}).map(function(ck){return{key:ck,c:cc[ck]||0,label:CATS[ck].pl};}).sort(function(a,b){return b.c-a.c;});\n  var maxCat=catArr.length?catArr[0].c:1;\n  c2.cnt.appendChild(mkVBar(catArr,maxCat,'#5B8A9A'));"
  );
  console.log('  [9] buildDash vertical bars');

  // 10. Delete old ardern bio ref (cleanup)
  // Not needed since TEAMS already changed

  fs.writeFileSync(path, h, 'utf8');
  console.log('  SAVED (' + h.length + ' chars)');
}

// ===== PATCH prowadzacy.html =====
function patchPresenter(path) {
  var h = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  console.log('Patching ' + path + ' (' + h.length + ' chars)');

  // 1. CSS additions
  h = insertBefore(h, '\n</style>\n</head>', CSS_ADDITIONS);
  console.log('  [1] CSS additions');

  // 3. Fix search placeholder (JS)
  h = replaceAll(h, "srch.placeholder='Szukaj warto\\u015bci...'", "srch.placeholder='Szukaj wartości...'");
  console.log('  [3] Fixed search placeholder (JS)');

  // 4. Replace TEAMS
  h = replaceBetween(h, 'var TEAMS=[', '\nvar SK=', TEAMS_NEW + '\n');
  console.log('  [4] TEAMS replaced');

  // 5. Add mkVBar before mkBar
  h = insertBefore(h, '\nfunction mkBar(', MK_VBAR_FN);
  console.log('  [5] mkVBar function added');

  // 6. Replace category bars in buildTeamStats with vertical
  h = h.replace(
    "for(var j=0;j<catArr.length;j++)c2.cnt.appendChild(mkBar(CATS[catArr[j].key].pl,catArr[j].c,maxCat,'#5B8A9A'));",
    "var catItems=catArr.map(function(ca){return{key:ca.key,c:ca.c,label:CATS[ca.key].pl};});\n  c2.cnt.appendChild(mkVBar(catItems,maxCat,'#5B8A9A'));"
  );
  console.log('  [6] buildTeamStats vertical bars');

  // 7. Replace category bars in buildDash with vertical
  h = h.replace(
    "var c2=mkCard('Ranking kategorii');var catArr=CO.filter(function(ck){return activeCats[ck];}).map(function(ck){return{key:ck,c:cc[ck]||0};}).sort(function(a,b){return b.c-a.c;});\n  var maxCat=catArr.length?catArr[0].c:1;\n  for(var j=0;j<catArr.length;j++)c2.cnt.appendChild(mkBar(CATS[catArr[j].key].pl,catArr[j].c,maxCat,'#5B8A9A'));",
    "var c2=mkCard('Ranking kategorii');var catArr=CO.filter(function(ck){return activeCats[ck];}).map(function(ck){return{key:ck,c:cc[ck]||0,label:CATS[ck].pl};}).sort(function(a,b){return b.c-a.c;});\n  var maxCat=catArr.length?catArr[0].c:1;\n  c2.cnt.appendChild(mkVBar(catArr,maxCat,'#5B8A9A'));"
  );
  console.log('  [7] buildDash vertical bars');

  fs.writeFileSync(path, h, 'utf8');
  console.log('  SAVED (' + h.length + ' chars)');
}

// ===== RUN =====
try { patchIndex('docs/index.html'); } catch(e) { console.error('INDEX ERR:', e.message, e.stack); }
try { patchPresenter('docs/prowadzacy.html'); } catch(e) { console.error('PRESENTER ERR:', e.message, e.stack); }
