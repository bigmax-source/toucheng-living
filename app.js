
const app=document.querySelector("#app");
const places=window.LIVING_PLACES||[];
const placeCount=document.querySelector("#placeCount");if(placeCount)placeCount.textContent=`店家與服務 ${places.length} 間`;
const categories=[["🍜","餐廳"],["🥐","早午餐"],["🌙","晚餐"],["🥢","小吃"],["🍰","點心"],["🧋","飲料"],["☕","咖啡"],["🩺","醫療照護"],["🧰","生活服務"],["🔧","居家修繕"],["🚕","交通接送"]];
let currentCategory="全部",query="";
// 同一個瀏覽 Session 使用固定亂數；新 Session 才重新洗牌。
const SESSION_KEY="tl-session-random-v1";
let savedRandom={};
try{savedRandom=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"{}")||{}}catch(e){savedRandom={}}
for(const p of places){if(typeof savedRandom[p.id]!=="number")savedRandom[p.id]=Math.random()}
try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(savedRandom))}catch(e){}
const pageRandomOrder=new Map(places.map(p=>[p.id,savedRandom[p.id]]));
function hasMainPhoto(s){return !!(s.images?.length)&&!s.photoPending;}
const dayNames=["日","一","二","三","四","五","六"];
const dayLong={一:"星期一",二:"星期二",三:"星期三",四:"星期四",五:"星期五",六:"星期六",日:"星期日"};

function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function mapsUrl(s){return`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`}
function telUrl(s){return s.phone.includes("暫無")?"#":"tel:"+s.phone.replace(/[^\d+]/g,"")}
function todayKey(date=new Date()){return dayNames[date.getDay()]}
function timeToMin(t){const m=String(t||"").match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null}
function prevDayKey(date=new Date()){const d=new Date(date);d.setDate(d.getDate()-1);return todayKey(d)}
function slotState(slot,nowMin,fromPrevious=false){
 const [a,b]=String(slot||"").split(/[–-]/),st=timeToMin(a),en=timeToMin(b);if(st==null||en==null)return null;
 const cross=en<=st;
 if(fromPrevious){if(cross&&nowMin<en)return {open:true,end:b,endMin:en};return null}
 if(cross){if(nowMin>=st)return {open:true,end:b,endMin:en+1440};return null}
 if(nowMin>=st&&nowMin<en)return {open:true,end:b,endMin:en};
 return null;
}
function currentOpenState(s,now=new Date()){
 if(s.status==="暫時關閉")return {open:false,label:"暫時關閉",rank:3};
 if(!s.hours)return {open:false,label:"營業時間等待店家補充",rank:4};
 const nowMin=now.getHours()*60+now.getMinutes(),today=s.hours[todayKey(now)];
 if(today&&today.status!=="休息")for(const slot of (today.slots||[])){const st=slotState(slot,nowMin,false);if(st?.open){const remain=st.endMin-nowMin;return {open:true,label:(remain<=60?"即將打烊":"營業中")+"・至 "+st.end,rank:0}}}
 const prev=s.hours[prevDayKey(now)];
 if(prev&&prev.status!=="休息")for(const slot of (prev.slots||[])){const st=slotState(slot,nowMin,true);if(st?.open)return {open:true,label:(st.endMin-nowMin<=60?"即將打烊":"營業中")+"・至 "+st.end,rank:0}}
 if(!today||today.status==="休息")return {open:false,label:"今日休息",rank:2};
 return {open:false,label:"已打烊・今日 "+(today.slots||[]).join("、"),rank:1};
}
function todayText(s){return currentOpenState(s).label}
function categoryIcon(cat){return Object.fromEntries(categories.map(x=>[x[1],x[0]]))[cat]||({"超市":"🛒","修車":"🛠"}[cat]||"📍")}
function fallbackIcon(s){if(s.category==="咖啡")return"☕";if(s.category==="生活服務")return"🧰";if(s.category==="居家修繕")return"🔧";if(s.category==="交通接送")return"🚕";if(s.category==="醫療照護")return"🩺";if(s.subcat.includes("碳")||s.subcat.includes("串"))return"🍢";if(s.category==="點心")return"🍰";return"🍜"}
function mainPhoto(s){if(s.images?.length)return `<img src="${s.images[0]}" alt="${esc(s.name)}" loading="lazy">`;return `<div class="placeholder">${fallbackIcon(s)}</div>`}
function card(s){
 const tags=(s.tags||[]).slice(0,2).map(t=>`<span class="tag">${esc(t)}</span>`).join("");
 const state=currentOpenState(s);
 return `<article class="postcard"><div class="photo">${mainPhoto(s)}${!s.verified?'<span class="photo-label">🌱 等待店家補充</span>':''}</div><div class="card-body"><span class="badge">${categoryIcon(s.category)} ${esc(s.subcat)}</span><h3>${esc(s.name)}</h3><div class="info"><div class="info-row"><span class="ico">⌖</span><div>${esc(s.address.replace("宜蘭縣頭城鎮",""))}</div></div><div class="info-row"><span class="ico">☎</span><div>${esc(s.phone)}</div></div><div class="info-row ${state.open?'today':'pending'}"><span class="ico">◷</span><div>${esc(state.label)}</div></div></div><div class="card-tags">${tags}</div><div class="card-actions"><a class="text-link" href="#place/${s.id}">閱讀更多 →</a><a class="claim-mini" href="#claim/${s.id}">🎁 領取</a></div></div></article>`
}
function hasTimeWindow(s,kind){
 if(!s.hours)return false;
 const slots=Object.values(s.hours).flatMap(h=>h?.slots||[]);
 return slots.some(slot=>{const [a,b]=slot.split(/[–-]/),st=timeToMin(a),en=timeToMin(b);if(st==null||en==null)return false;const end=en<=st?en+1440:en;return kind==="早午餐"?(st<15*60&&end>6*60):(st<24*60&&end>17*60)});
}
function categoryMatch(s,cat){
 if(cat==="全部")return true;
 if(cat==="早午餐"||cat==="晚餐")return ["餐廳","小吃","咖啡"].includes(s.category)&&hasTimeWindow(s,cat);
 if(cat==="點心"&&s.slug==="adan-taro-milk")return true;
 return s.category===cat;
}
function filtered(){
 return places.filter(s=>{const cat=categoryMatch(s,currentCategory);const q=!query||[s.name,s.category,s.subcat,s.address,s.phone,(s.tags||[]).join(" "),(s.recommended||[]).join(" ")].join(" ").toLowerCase().includes(query.toLowerCase());return cat&&q;}).sort((a,b)=>{
   const ar=currentOpenState(a).open?0:1,br=currentOpenState(b).open?0:1;if(ar!==br)return ar-br;
   return pageRandomOrder.get(a.id)-pageRandomOrder.get(b.id);
 });
}
function home(){
 app.innerHTML=`<section class="hero"><div class="hero-inner"><h1>頭城生活指南｜頭城生活中</h1><div class="since">頭城二三事 補充／規劃　｜　聯絡信箱 polonews@gmail.com　｜　Facebook 搜尋「頭城二三事」　｜　店家與服務 ${places.length} 間</div></div></section>
 <div class="container">
  <section class="section categories-section">
   <div class="categories">${categories.map(([i,n])=>`<button class="cat ${currentCategory===n?'active':''}" data-cat="${n}"><span>${i}</span>${n}</button>`).join("")}</div>
  </section>
  <section class="section results-section">
   <div class="toolbar"><input id="search" class="search" placeholder="搜尋店名、地址、推薦品項…" value="${esc(query)}"></div>
   <div id="cards"></div>
  </section>
 </div>`;
 document.querySelectorAll(".cat").forEach(b=>b.onclick=()=>{currentCategory=b.dataset.cat;renderCards();document.querySelectorAll(".cat").forEach(x=>x.classList.toggle("active",x===b));document.querySelector("#cards")?.scrollIntoView({behavior:"smooth",block:"start"})});
 document.querySelector("#search").oninput=e=>{query=e.target.value;renderCards()};
 renderCards();
}
function renderCards(){
 const arr=filtered();
 document.querySelector("#cards").innerHTML=arr.length?`<div class="cards">${arr.map(card).join("")}</div>`:`<div class="empty">這個分類目前還在蒐集中。你知道適合加入的頭城店家嗎？</div>`;
}
function gallery(s){
 if(!s.images?.length)return `<div class="gallery-main photo"><div class="placeholder">${fallbackIcon(s)}</div></div>`;
 return `<div class="gallery-main"><img id="mainImg" src="${s.images[0]}" alt="${esc(s.name)}"></div>
 <div class="gallery-thumbs">${s.images.map((im,i)=>`<button onclick="document.querySelector('#mainImg').src='${im}'"><img src="${im}" alt="${esc(s.name)} 照片 ${i+1}"></button>`).join("")}</div>`;
}
function hoursHtml(s){
 if(!s.hours)return `<div class="hours-box"><h3>🕒 營業時間</h3><div class="pending">等待店家補充</div></div>`;
 const today=todayKey();
 return `<div class="hours-box"><h3>🕒 營業時間</h3><div class="hours-list">${["一","二","三","四","五","六","日"].map(d=>{
   const h=s.hours[d],txt=!h||h.status==="休息"?"休息":(h.slots||[]).join("、");
   return `<div class="hour-line ${today===d?'current':''}"><span>${dayLong[d]}</span><span>${esc(txt)}</span></div>`;
 }).join("")}</div></div>`;
}
function detail(id){
 const s=places.find(x=>x.id===id);if(!s)return home();
 const rec=(s.recommended||[]).length?`<div class="story-box"><b>推薦品項</b><ul class="rec-list">${s.recommended.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`:"";
 const editorial=s.editorial?`<div class="editorial"><h3>${esc(s.editorial_title||"店家介紹")}</h3><p>${esc(s.editorial)}</p></div>`:"";
 const relations=(s.relations||[]).map(r=>{const p=places.find(x=>x.id===r.place_id);return p?`<div class="relation-box"><b>📍 ${esc(r.label||"附近店家")}</b><a href="#place/${p.id}">${esc(p.name)} →</a></div>`:""}).join("");
 app.innerHTML=`<div class="container page">
  <a class="back" href="#">← 回到 頭城生活中</a>
  <div class="detail">
    <section>${gallery(s)}</section>
    <section class="detail-panel">
      <span class="badge">${categoryIcon(s.category)} ${esc(s.subcat)} ・ ${esc(s.id)}</span>
      <h1>${esc(s.name)}</h1>
      <div class="detail-info">
       <div class="info-row"><span class="ico">⌖</span><div>${esc(s.address)}</div></div>
       <div class="info-row"><span class="ico">☎</span><div>${esc(s.phone)}</div></div>
       <div class="card-tags">${(s.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div>
      </div>
      <div class="action-row">
       <a class="btn btn-primary" target="_blank" rel="noopener" href="${mapsUrl(s)}">導航</a>
       <button class="btn btn-secondary" onclick="toggleFavorite('${s.id}',this)">♡ 收藏</button>
       <button class="btn btn-secondary" onclick="sharePage('${esc(s.name)}')">↗ 分享</button>
      </div>
      ${hoursHtml(s)}${rec}${editorial}${relations}
      <div class="claim-box"><h3>🎁 領取你的 Living Card</h3><p>如果你是店家負責人或經授權的人員，可以補充、修正照片與營業資訊。</p><a class="btn btn-primary" style="display:inline-block" href="#claim/${s.id}">開始更新</a></div>
    </section>
  </div>
 </div>`;
}
function sharePage(title){if(navigator.share)navigator.share({title,url:location.href});else navigator.clipboard?.writeText(location.href).then(()=>alert("網址已複製"))}
function toggleFavorite(id,btn){const k="tl-favorites";let a=JSON.parse(localStorage.getItem(k)||"[]");a=a.includes(id)?a.filter(x=>x!==id):[...a,id];localStorage.setItem(k,JSON.stringify(a));btn.textContent=a.includes(id)?"♥ 已收藏":"♡ 收藏"}

const draftKey=id=>`tl-draft-${id}`;
let wizard={step:1,total:7,store:null,data:{}};
function startClaim(id){
 const store=places.find(x=>x.id===id)||{id:"NEW",name:"",address:"",phone:"",category:"餐廳",subcat:""};
 const saved=JSON.parse(localStorage.getItem(draftKey(store.id))||"{}");
 wizard={step:1,total:7,store,data:{name:store.name,address:store.address,phone:store.phone,category:store.category,subcat:store.subcat,hours:store.hours,...saved}};
 renderWizard();
}
function saveDraft(){if(wizard.store)localStorage.setItem(draftKey(wizard.store.id),JSON.stringify(wizard.data))}
function val(id){return document.getElementById(id)?.value?.trim()||""}
function checked(id){return!!document.getElementById(id)?.checked}
function collect(){
 const d=wizard.data;
 if(wizard.step===2){d.name=val("name")||d.name;d.address=val("address")||d.address;d.phone=val("phone")||d.phone;d.intro=val("intro")}
 if(wizard.step===3){
  d.hours={};
  ["一","二","三","四","五","六","日"].forEach(day=>{
   const st=document.getElementById("st"+day)?.value||"營業";
   const a=document.getElementById("s"+day)?.value||"11:00",b=document.getElementById("e"+day)?.value||"20:00";
   d.hours[day]=st==="休息"?{status:"休息"}:{status:st,slots:[`${a}–${b}`]};
  });
  d.hoursNote=val("hoursNote");
 }
 if(wizard.step===4){d.facebook=val("facebook");d.instagram=val("instagram");d.website=val("website")}
 if(wizard.step===5){d.contact=val("contact");d.mobile=val("mobile");d.email=val("email");d.role=val("role");d.consent=checked("consent");d.photoConsent=checked("photoConsent")}
}
function go(n){collect();wizard.step=Math.min(wizard.total,Math.max(1,n));saveDraft();renderWizard();window.scrollTo({top:0,behavior:"smooth"})}
function shell(content){const pct=((wizard.step-1)/(wizard.total-1))*100;return`<div class="wizard-shell"><a class="back" href="#place/${wizard.store.id}">← 返回 Living Card</a><div class="progress-meta"><span>第 ${wizard.step} 步，共 ${wizard.total} 步</span><span>草稿自動儲存</span></div><div class="progress"><span style="width:${pct}%"></span></div><div class="wizard-card">${content}</div></div>`}
function nav(p,n,label="下一步"){return`<div class="wizard-nav">${p?`<button class="btn btn-secondary" onclick="go(${p})">上一步</button>`:"<span></span>"}<button class="btn btn-primary" onclick="go(${n})">${label}</button></div>`}
function initialForDay(day){
 const h=wizard.data.hours?.[day];if(!h||h.status==="休息")return {status:"休息",start:"11:00",end:"20:00"};
 const slot=(h.slots||["11:00–20:00"])[0].split("–");return {status:h.status||"營業",start:slot[0]||"11:00",end:slot[1]||"20:00"};
}
function renderWizard(){
 const d=wizard.data,s=wizard.store;let html="";
 if(wizard.step===1)html=shell(`<h2>🎁 歡迎領取 ${esc(s.name||"你的 Living Card")}</h2><p class="desc">基本資料已經幫你建立好。接下來只要確認與補充資訊，約 3～5 分鐘。</p><div class="notice">目前仍是 Alpha 測試版；送出內容暫存在本機，不會直接公開。</div>${nav(null,2,"開始更新")}`);
 if(wizard.step===2)html=shell(`<h2>📍 確認基本資料</h2><div class="field"><label>店家／機構名稱</label><input class="input" id="name" value="${esc(d.name||"")}"></div><div class="field"><label>地址</label><input class="input" id="address" value="${esc(d.address||"")}"></div><div class="field"><label>公開電話</label><input class="input" id="phone" value="${esc(d.phone||"")}"></div><div class="field"><label>一句話介紹（選填）</label><textarea id="intro" rows="3" maxlength="80">${esc(d.intro||"")}</textarea></div>${nav(1,3)}`);
 if(wizard.step===3){
  html=shell(`<h2>🕒 一般營業時間</h2><p class="desc">目前已有的營業時間會先帶入，你只要確認即可。</p>${["一","二","三","四","五","六","日"].map(day=>{const v=initialForDay(day);return`<div class="hours-day"><div class="hours-top"><b>${dayLong[day]}</b><select class="hour-status" id="st${day}"><option ${v.status==="營業"?"selected":""}>營業</option><option ${v.status==="休息"?"selected":""}>休息</option><option>24 小時</option><option>預約制</option><option>不固定</option></select></div><div class="time-row"><input type="time" id="s${day}" value="${v.start}"><span>－</span><input type="time" id="e${day}" value="${v.end}"></div></div>`}).join("")}<div class="field"><label>營業補充說明（選填）</label><input class="input" id="hoursNote" value="${esc(d.hoursNote||"")}" placeholder="例如：售完提早打烊"></div>${nav(2,4)}`)
 }
 if(wizard.step===4)html=shell(`<h2>📷 照片與網路資訊</h2><p class="desc">正式接上 Supabase 後，這裡會把照片送到 Storage。Alpha 版先測試流程。</p><div class="uploads"><label class="upload">主圖<input type="file" accept="image/*" style="display:none"></label><label class="upload">環境照<input type="file" accept="image/*" style="display:none"></label><label class="upload">特色照<input type="file" accept="image/*" style="display:none"></label></div><div class="field"><label>Facebook（選填）</label><input class="input" id="facebook" value="${esc(d.facebook||"")}"></div><div class="field"><label>Instagram（選填）</label><input class="input" id="instagram" value="${esc(d.instagram||"")}"></div><div class="field"><label>官方網站（選填）</label><input class="input" id="website" value="${esc(d.website||"")}"></div>${nav(3,5)}`);
 if(wizard.step===5)html=shell(`<h2>👤 聯絡與刊登確認</h2><p class="desc">以下聯絡資料不公開，只供審核與協助找回修改連結。</p><div class="field"><label>聯絡人姓名</label><input class="input" id="contact" value="${esc(d.contact||"")}"></div><div class="field"><label>聯絡手機</label><input class="input" id="mobile" value="${esc(d.mobile||"")}"></div><div class="field"><label>Email（選填）</label><input class="input" id="email" type="email" value="${esc(d.email||"")}"></div><div class="field"><label>填寫者身分</label><select id="role"><option>店家／機構負責人</option><option>店家工作人員</option><option>經店家授權代為填寫</option><option>其他</option></select></div><div class="field"><label><input type="checkbox" id="consent"> 我確認以上公開資料可刊登於 Toucheng Living。</label></div><div class="field"><label><input type="checkbox" id="photoConsent"> 我確認照片為本人拍攝、店家所有或已取得授權。</label></div>${nav(4,6,"預覽 Living Card")}`);
 if(wizard.step===6)html=shell(`<h2>👀 請確認你的 Living Card</h2><div>${card({...s,...d})}</div>${nav(5,7,"確認送出")}`);
 if(wizard.step===7){const token=Math.random().toString(36).slice(2,8).toUpperCase();html=shell(`<div class="success"><div class="big">🎉</div><h2>完成 Alpha 測試送出</h2><p class="desc">謝謝你協助測試 Toucheng Living。</p><div class="notice">正式版串接 Supabase 後，這一步會送進「Living Studio」待審核，並產生專屬修改連結。</div><p><b>測試編號：${wizard.store.id}-${token}</b></p><button class="btn btn-primary" onclick="location.hash=''">回到 頭城生活中</button></div>`);localStorage.removeItem(draftKey(wizard.store.id))}
 app.innerHTML=html;
}
function route(){const h=location.hash.slice(1);if(h.startsWith("place/"))detail(h.split("/")[1]);else if(h.startsWith("claim/"))startClaim(h.split("/")[1]);else home()}
window.addEventListener("hashchange",route);
document.querySelector("#joinBtn").onclick=()=>alert("Build006 目前先提供已建立 Living Card 的店家領取更新；新店家加入功能會在串接 Supabase 後開放。");
route();
