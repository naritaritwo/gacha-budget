
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const STORAGE_KEY = "gachaBudgetApp_v1";
const V2_CACHE_KEY = "gachaBudgetApp_v2_cache";
const CLOUD_CONFIG_KEY = "gachaBudgetCloudConfig_v2";
const CLOUD_META_KEY = "gachaBudgetCloudMeta_v2";

const categories = ["月パス","バトルパス","ガチャ・石","選択券","衣装・スキン","パック","その他"];

const defaultData = {
  settings:{year:2026,annualBudget:600000,monthlyReference:50000,carryOver:true,legacyThroughMonth:8},
  legacyMonthlyTotals:{1:75320,2:100670,3:41553,4:30525,5:68279,6:34822,7:41489,8:53549},
  legacyGameTotals:{
    "プリコネ":81300,"ドルフロ2":53934,"鳴潮":44636,"ゼンゼロ":39774,"ステラソラ":37622,
    "スタレ":36493,"ウマ娘":29160,"原神":25090,"アークナイツ：エンドフィールド":24800,
    "ブルアカ":24668,"アークナイツ":23900,"FGO":10000,"モンギル":7550,"スノブレ":3680,"崩壊3rd":3600
  },
  games:[
    {id:"priconne",name:"プリコネ",status:"active",spendingEnabled:true},
    {id:"bluearchive",name:"ブルアカ",status:"active",spendingEnabled:true},
    {id:"arknights",name:"アークナイツ",status:"active",spendingEnabled:true},
    {id:"genshin",name:"原神",status:"active",spendingEnabled:true},
    {id:"starrail",name:"スタレ",status:"active",spendingEnabled:true},
    {id:"zzz",name:"ゼンゼロ",status:"active",spendingEnabled:true},
    {id:"endfield",name:"アークナイツ：エンドフィールド",status:"active",spendingEnabled:true},
    {id:"wuwa",name:"鳴潮",status:"active",spendingEnabled:true},
    {id:"uma",name:"ウマ娘",status:"active",spendingEnabled:true},
    {id:"gf2",name:"ドルフロ2",status:"active",spendingEnabled:true},
    {id:"stellasora",name:"ステラソラ",status:"active",spendingEnabled:true},
    {id:"fgo",name:"FGO",status:"active",spendingEnabled:true},
    {id:"mongil",name:"モンギル",status:"active",spendingEnabled:false},
    {id:"honkai3",name:"崩壊3rd",status:"active",spendingEnabled:false},
    {id:"snowbreak",name:"スノブレ",status:"active",spendingEnabled:false}
  ],
  subscriptions:[
    {id:"s1",gameId:"priconne",name:"デイリー",amount:1000,type:"月パス",cycle:"days",cycleValue:30,active:true},
    {id:"s2",gameId:"bluearchive",name:"マンスリー",amount:950,type:"月パス",cycle:"days",cycleValue:30,active:true},
    {id:"s3",gameId:"bluearchive",name:"バトルパス",amount:3325,type:"バトルパス",cycle:"annual",cycleValue:2,active:true},
    {id:"s4",gameId:"arknights",name:"月パス",amount:650,type:"月パス",cycle:"days",cycleValue:30,active:true},
    {id:"s5",gameId:"genshin",name:"空月",amount:610,type:"月パス",cycle:"days",cycleValue:30,active:true},
    {id:"s6",gameId:"genshin",name:"紀行",amount:1220,type:"バトルパス",cycle:"days",cycleValue:42,active:true},
    {id:"s7",gameId:"starrail",name:"列車補給",amount:610,type:"月パス",cycle:"days",cycleValue:30,active:true},
    {id:"s8",gameId:"starrail",name:"ナナシ",amount:1220,type:"バトルパス",cycle:"days",cycleValue:42,active:true},
    {id:"s9",gameId:"zzz",name:"インターノット",amount:610,type:"月パス",cycle:"days",cycleValue:30,active:true},
    {id:"s10",gameId:"zzz",name:"エリーファンド",amount:1220,type:"バトルパス",cycle:"days",cycleValue:42,active:true},
    {id:"s11",gameId:"endfield",name:"月パス",amount:610,type:"月パス",cycle:"days",cycleValue:30,active:true},
    {id:"s12",gameId:"endfield",name:"協約特注",amount:1220,type:"バトルパス",cycle:"days",cycleValue:42,active:true},
    {id:"s13",gameId:"wuwa",name:"月相観測パス",amount:660,type:"月パス",cycle:"days",cycleValue:30,active:true},
    {id:"s14",gameId:"wuwa",name:"先駆ラジオ",amount:1320,type:"バトルパス",cycle:"days",cycleValue:42,active:true},
    {id:"s15",gameId:"uma",name:"ウマスク",amount:980,type:"月パス",cycle:"monthly",cycleValue:1,active:true},
    {id:"s16",gameId:"uma",name:"プレミアムパス",amount:800,type:"バトルパス",cycle:"monthly",cycleValue:1,active:true},
    {id:"s17",gameId:"gf2",name:"ゴールドプラン",amount:750,type:"月パス",cycle:"days",cycleValue:30,active:true},
    {id:"s18",gameId:"gf2",name:"ハンタールート",amount:1500,type:"バトルパス",cycle:"days",cycleValue:21,active:true},
    {id:"s19",gameId:"stellasora",name:"デイリー",amount:617,type:"月パス",cycle:"days",cycleValue:30,active:true},
    {id:"s20",gameId:"stellasora",name:"事業支援",amount:1881,type:"バトルパス",cycle:"monthly",cycleValue:1,active:true}
  ],
  transactions:[],
  updatedAt:new Date().toISOString()
};

let data = loadLocalData();
let supabase = null;
let currentUser = null;
let currentPage = "home";
let syncTimer = null;
let syncing = false;

function clone(o){return JSON.parse(JSON.stringify(o));}
function loadLocalData(){
  try{
    const v2 = localStorage.getItem(V2_CACHE_KEY);
    if(v2) return JSON.parse(v2);
    const v1 = localStorage.getItem(STORAGE_KEY);
    if(v1){
      const parsed = JSON.parse(v1);
      parsed.updatedAt = parsed.updatedAt || new Date().toISOString();
      return parsed;
    }
  }catch(e){}
  return clone(defaultData);
}
function saveLocal(){
  data.updatedAt = new Date().toISOString();
  localStorage.setItem(V2_CACHE_KEY, JSON.stringify(data));
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }catch(e){}
}
function getCloudConfig(){
  try{return JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY)||"null")}catch(e){return null}
}
function setCloudConfig(cfg){localStorage.setItem(CLOUD_CONFIG_KEY,JSON.stringify(cfg))}
function getCloudMeta(){try{return JSON.parse(localStorage.getItem(CLOUD_META_KEY)||"{}")}catch(e){return {}}}
function setCloudMeta(meta){localStorage.setItem(CLOUD_META_KEY,JSON.stringify(meta))}
function initSupabase(){
  const cfg=getCloudConfig();
  if(!cfg?.url || !cfg?.key) return false;
  supabase=createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return true;
}

function setSyncBadge(text,kind=""){
  const b=document.getElementById("syncBadge");
  b.textContent=text; b.className="pill"+(kind?` ${kind}`:"");
}
function showAuth(message=""){
  document.getElementById("authGate").classList.remove("hidden");
  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("bottomNav").classList.add("hidden");
  const cfg=getCloudConfig();
  document.getElementById("cloudSetupPane").classList.toggle("hidden",!!cfg);
  document.getElementById("loginPane").classList.toggle("hidden",!cfg);
  document.getElementById("authMessage").textContent=message;
}
function showApp(){
  document.getElementById("authGate").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  document.getElementById("bottomNav").classList.remove("hidden");
  renderAll();
}

async function boot(){
  if("serviceWorker" in navigator){
    try{await navigator.serviceWorker.register("./sw.js")}catch(e){}
  }
  if(!initSupabase()){
    setSyncBadge("クラウド未設定","warn");
    showAuth();
    return;
  }
  const {data:sessionData}=await supabase.auth.getSession();
  currentUser=sessionData.session?.user||null;
  if(!currentUser){
    setSyncBadge(navigator.onLine?"未ログイン":"オフライン","warn");
    showAuth();
    return;
  }
  await hydrateFromCloud();
  showApp();
  subscribeAuth();
}
function subscribeAuth(){
  supabase.auth.onAuthStateChange(async(event,session)=>{
    currentUser=session?.user||null;
    if(!currentUser){showAuth("ログアウトしました。");return}
    if(event==="SIGNED_IN"){await hydrateFromCloud();showApp()}
  });
}

async function saveCloudConfigUI(){
  const url=document.getElementById("sbUrl").value.trim();
  const key=document.getElementById("sbKey").value.trim();
  if(!/^https:\/\/.+\.supabase\.co/.test(url) || !key){alert("Project URL とキーを確認してください。");return}
  setCloudConfig({url,key});
  location.reload();
}
async function login(){
  const email=document.getElementById("authEmail").value.trim();
  const password=document.getElementById("authPassword").value;
  if(!email||!password){setAuthMsg("メールアドレスとパスワードを入力してください。");return}
  setAuthMsg("ログイン中…");
  const {data:d,error}=await supabase.auth.signInWithPassword({email,password});
  if(error){setAuthMsg("ログインできません: "+error.message);return}
  currentUser=d.user; await hydrateFromCloud(); showApp();
}
async function signup(){
  const email=document.getElementById("authEmail").value.trim();
  const password=document.getElementById("authPassword").value;
  if(!email||password.length<6){setAuthMsg("メールアドレスと6文字以上のパスワードを入力してください。");return}
  setAuthMsg("登録中…");
  const {data:d,error}=await supabase.auth.signUp({email,password});
  if(error){setAuthMsg("登録できません: "+error.message);return}
  if(d.session){
    currentUser=d.user; await hydrateFromCloud(); showApp();
  }else{
    setAuthMsg("登録しました。Supabaseの設定によっては確認メールが届きます。メール内のリンクを開いた後、ログインしてください。");
  }
}
function setAuthMsg(s){document.getElementById("authMessage").textContent=s}
async function logout(){
  await flushCloud();
  await supabase.auth.signOut();
}
function changeCloud(){
  if(!confirm("Supabase接続設定を変更しますか？"))return;
  localStorage.removeItem(CLOUD_CONFIG_KEY);
  localStorage.removeItem(CLOUD_META_KEY);
  location.reload();
}

async function hydrateFromCloud(){
  if(!navigator.onLine){setSyncBadge("オフライン","warn");return}
  setSyncBadge("同期中…");
  const {data:row,error}=await supabase.from("app_state").select("data,updated_at").eq("user_id",currentUser.id).maybeSingle();
  if(error){setSyncBadge("同期エラー","danger");console.error(error);return}
  if(!row){
    await pushCloud(true);
    return;
  }
  const localMeta=getCloudMeta();
  const localDirty=localMeta.dirty===true;
  const cloudTime=new Date(row.updated_at).getTime();
  const localTime=new Date(data.updatedAt||0).getTime();

  if(localDirty && localTime>cloudTime){
    await pushCloud(true);
  }else{
    data=row.data;
    data.updatedAt=row.updated_at;
    saveLocal();
    setCloudMeta({dirty:false,lastCloudUpdatedAt:row.updated_at});
    setSyncBadge("同期済み","ok");
  }
}
function markDirtyAndSave(){
  saveLocal();
  const meta=getCloudMeta(); meta.dirty=true; setCloudMeta(meta);
  renderAll();
  queueCloudSync();
}
function queueCloudSync(){
  setSyncBadge(navigator.onLine?"同期待ち":"オフライン","warn");
  clearTimeout(syncTimer);
  syncTimer=setTimeout(()=>flushCloud(),800);
}
async function flushCloud(){ if(!currentUser||!navigator.onLine)return; await pushCloud(false); }
async function pushCloud(force=false){
  if(syncing||!currentUser||!navigator.onLine)return;
  syncing=true; setSyncBadge("同期中…");
  const stamp=new Date().toISOString();
  const payload=clone(data); payload.updatedAt=stamp;
  const {data:row,error}=await supabase.from("app_state")
    .upsert({user_id:currentUser.id,data:payload,updated_at:stamp},{onConflict:"user_id"})
    .select("updated_at").single();
  syncing=false;
  if(error){setSyncBadge("同期エラー","danger");console.error(error);return}
  data.updatedAt=row.updated_at; saveLocal(); setCloudMeta({dirty:false,lastCloudUpdatedAt:row.updated_at}); setSyncBadge("同期済み","ok");
}
window.addEventListener("online",()=>{setSyncBadge("再接続","warn");hydrateFromCloud()});
window.addEventListener("offline",()=>setSyncBadge("オフライン","warn"));

function yen(n){return "¥"+Math.round(n||0).toLocaleString("ja-JP")}
function pct(n){return (Math.round(n*10)/10).toFixed(1)+"%"}
function gameById(id){return data.games.find(g=>g.id===id)}
function legacyTotal(){return Object.values(data.legacyMonthlyTotals||{}).reduce((a,b)=>a+Number(b||0),0)}
function txInYear(year){return data.transactions.filter(t=>new Date(t.date+"T00:00:00").getFullYear()===Number(year))}
function detailedTotal(year){return txInYear(year).reduce((s,t)=>s+Number(t.amount||0),0)}
function spentYear(){return legacyTotal()+detailedTotal(data.settings.year)}
function currentDateForBudget(){const n=new Date();return n.getFullYear()===Number(data.settings.year)?n:new Date(Number(data.settings.year),8,1)}
function currentMonth(){return currentDateForBudget().getMonth()+1}
function txInMonth(m){return txInYear(data.settings.year).filter(t=>new Date(t.date+"T00:00:00").getMonth()+1===m)}
function monthDetailedTotal(m){return txInMonth(m).reduce((s,t)=>s+Number(t.amount||0),0)}
function monthTotal(m){return Number((data.legacyMonthlyTotals||{})[m]||0)+monthDetailedTotal(m)}
function annualSubscriptionCost(s){if(!s.active)return 0;if(s.cycle==="days")return Number(s.amount)*365/Number(s.cycleValue||30);if(s.cycle==="annual")return Number(s.amount)*Number(s.cycleValue||1);if(s.cycle==="monthly")return Number(s.amount)*12*Number(s.cycleValue||1);return 0}
function annualFixed(){return data.subscriptions.filter(s=>gameById(s.gameId)?.spendingEnabled!==false).reduce((a,s)=>a+annualSubscriptionCost(s),0)}
function avgMonthlyFixed(){return annualFixed()/12}
function monthsRemaining(){return Math.max(1,13-currentMonth())}
function remainingBudget(){return Number(data.settings.annualBudget)-spentYear()}
function avgRemainingPerMonth(){return remainingBudget()/monthsRemaining()}
function projectedYear(){const m=currentMonth(),elapsed=Math.max(1,m-1);const prev=Array.from({length:elapsed},(_,i)=>monthTotal(i+1)).reduce((a,b)=>a+b,0);const cur=monthTotal(m),future=12-m,run=cur>0?cur:avgMonthlyFixed();return prev+cur+future*Math.max(avgMonthlyFixed(),run)}
function freeRemaining(){const m=currentMonth(),remainFrac=(13-m)/12;return remainingBudget()-annualFixed()*remainFrac}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function switchPage(page){currentPage=page;document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===page));document.querySelectorAll(".bottom-nav button").forEach(x=>x.classList.toggle("active",x.dataset.page===page));window.scrollTo({top:0,behavior:"smooth"})}

function renderHome(){
  const el=document.getElementById("home"),used=spentYear(),budget=Number(data.settings.annualBudget),remain=budget-used,prog=Math.max(0,Math.min(100,used/budget*100)),m=currentMonth(),mSpent=monthTotal(m),mLimit=avgRemainingPerMonth(),fixed=avgMonthlyFixed(),free=Math.max(0,mLimit-fixed),project=projectedYear();
  const recent=[...data.transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  el.innerHTML=`
  <div class="grid two">
    <div class="card"><div class="eyebrow">${data.settings.year}年 年間予算</div><div class="big">${yen(remain)} <span class="muted small">残り</span></div><div class="row"><span>使用済み ${yen(used)}</span><span>${pct(used/budget*100)}</span></div><div class="progress ${used>budget?"danger":""}"><span style="width:${prog}%"></span></div><div class="muted small">年間予算 ${yen(budget)}</div></div>
    <div class="card"><div class="eyebrow">${m}月</div><div class="big">${yen(mSpent)}</div><div class="row"><span>今後の月平均上限</span><strong>${yen(mLimit)}</strong></div><div class="row"><span>固定費 月平均</span><strong>${yen(fixed)}</strong></div><div class="row"><span>自由課金の目安</span><strong>${yen(free)}</strong></div></div>
  </div>
  <div style="height:14px"></div>
  ${project<=budget?`<div class="success-box">現在のペースでは年間予算内の見込みです。予測 ${yen(project)} ／ 余裕 ${yen(budget-project)}</div>`:`<div class="warning-box">現在のペースでは年間予算を ${yen(project-budget)} 超過する見込みです。予測 ${yen(project)}</div>`}
  <div style="height:14px"></div>
  <div class="grid two">
    <div class="card"><h3>自由課金 残り目安</h3><div class="metric">${yen(Math.max(0,freeRemaining()))}</div><div class="muted small">年間残額から今後の固定費見込みを差し引いた概算です。</div><div class="form-actions"><button class="secondary" onclick="openSimulation()">購入前チェック</button><button class="ghost" onclick="switchPage('add')">課金を登録</button></div></div>
    <div class="card"><h3>固定課金</h3><div class="metric">${yen(annualFixed())}<span class="small muted"> / 年</span></div><div class="row"><span>月平均</span><strong>${yen(avgMonthlyFixed())}</strong></div></div>
  </div>
  <div style="height:14px"></div>
  <div class="card"><div class="row"><h3>最近の課金</h3><button class="ghost" onclick="switchPage('history')">すべて見る</button></div><div class="list">${recent.length?recent.map(t=>`<div class="list-item"><div><strong>${escapeHtml(gameById(t.gameId)?.name||"不明")}</strong><div class="muted small">${t.date} ・ ${escapeHtml(t.category)}${t.productName?` ・ ${escapeHtml(t.productName)}`:""}</div></div><div class="amount">${yen(t.amount)}</div></div>`).join(""):`<div class="muted">詳細課金の登録はまだありません。</div>`}</div></div>`;
}
function renderHistory(){
  const rows=[...data.transactions].sort((a,b)=>b.date.localeCompare(a.date));
  document.getElementById("history").innerHTML=`<div class="card"><div class="row wrap"><div><h2>課金履歴</h2><div class="muted small">詳細入力した課金を表示します。</div></div><div class="form-actions"><button class="secondary" onclick="exportCSV()">CSV出力</button></div></div><div class="table-wrap"><table><thead><tr><th>日付</th><th>ゲーム</th><th>種類</th><th>商品</th><th>金額</th><th></th></tr></thead><tbody>${rows.length?rows.map(t=>`<tr><td>${t.date}</td><td>${escapeHtml(gameById(t.gameId)?.name||"")}</td><td>${escapeHtml(t.category)}</td><td>${escapeHtml(t.productName||"")}</td><td class="amount">${yen(t.amount)}</td><td><button class="danger-btn small" onclick="deleteTx('${t.id}')">削除</button></td></tr>`).join(""):`<tr><td colspan="6" class="muted">詳細履歴はまだありません。</td></tr>`}</tbody></table></div></div>`;
}
function renderAdd(){
  const d=currentDateForBudget().toISOString().slice(0,10),games=data.games.filter(g=>g.status!=="retired");
  document.getElementById("add").innerHTML=`<div class="card"><h2>課金を登録</h2><div class="form-grid"><label>日付<input id="txDate" type="date" value="${d}"></label><label>ゲーム<select id="txGame">${games.map(g=>`<option value="${g.id}">${escapeHtml(g.name)}${g.spendingEnabled===false?"（課金停止）":""}</option>`).join("")}</select></label><label>種類<select id="txCategory">${categories.map(c=>`<option>${c}</option>`).join("")}</select></label><label>金額<input id="txAmount" type="number" min="0" step="1" placeholder="例: 1500"></label><label>商品名<input id="txProduct" type="text" placeholder="例: ハンタールート"></label><label>メモ<input id="txMemo" type="text" placeholder="任意"></label></div><div class="form-actions"><button class="primary" onclick="addTransaction()">登録</button><button class="secondary" onclick="openSimulationFromForm()">購入前チェック</button></div></div>`;
}
function gameSeries(){const sums={...(data.legacyGameTotals||{})};txInYear(data.settings.year).forEach(t=>{const n=gameById(t.gameId)?.name||"不明";sums[n]=(sums[n]||0)+Number(t.amount||0)});return Object.entries(sums).map(([name,amount])=>({name,amount})).sort((a,b)=>b.amount-a.amount)}
function bars(items,labelKey,valueKey){const max=Math.max(1,...items.map(x=>Number(x[valueKey]||0)));return items.map(x=>`<div class="bar-row"><div class="bar-head"><span>${escapeHtml(String(x[labelKey]))}${labelKey==="month"?"月":""}</span><strong>${yen(x[valueKey])}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(2,Number(x[valueKey]||0)/max*100)}%"></div></div></div>`).join("")}
function renderAnalysis(){
  const monthly=Array.from({length:12},(_,i)=>({month:i+1,amount:monthTotal(i+1)})),games=gameSeries();
  const sums={};categories.forEach(c=>sums[c]=0);txInYear(data.settings.year).forEach(t=>sums[t.category]=(sums[t.category]||0)+Number(t.amount||0));const cats=Object.entries(sums).map(([name,amount])=>({name,amount})).filter(x=>x.amount>0).sort((a,b)=>b.amount-a.amount);
  document.getElementById("analysis").innerHTML=`<div class="grid two"><div class="card"><h2>月別</h2>${bars(monthly.filter(x=>x.amount>0),"month","amount")}</div><div class="card"><h2>ゲーム別</h2>${bars(games.slice(0,15),"name","amount")}</div></div><div style="height:14px"></div><div class="card"><h2>種類別（詳細入力分）</h2>${cats.length?bars(cats,"name","amount"):`<div class="muted">詳細課金を登録すると表示されます。</div>`}</div>`;
}
function renderSettings(){
  document.getElementById("settings").innerHTML=`
  <div class="card"><div class="row wrap"><div><h2>クラウド</h2><div class="muted small">${escapeHtml(currentUser?.email||"")}</div></div><button class="ghost" onclick="logout()">ログアウト</button></div><div class="note-box" style="margin-top:12px">同期状態は画面右上に表示されます。オフライン時は端末に保存し、再接続時にクラウドへ同期します。</div></div>
  <div style="height:14px"></div>
  <div class="card"><h2>予算設定</h2><div class="form-grid"><label>年度<input id="setYear" type="number" value="${data.settings.year}"></label><label>年間予算<input id="setAnnual" type="number" value="${data.settings.annualBudget}"></label><label>月間基準額<input id="setMonthly" type="number" value="${data.settings.monthlyReference}"></label></div><div class="form-actions"><button class="primary" onclick="saveSettings()">保存</button></div></div>
  <div style="height:14px"></div>
  <div class="card"><div class="row wrap"><div><h2>ゲーム</h2><div class="muted small">並べ替え・名前変更・追加・課金停止</div></div><button class="secondary" onclick="addGame()">＋ゲーム追加</button></div><div class="list game-list" style="margin-top:10px">${data.games.map((g,index)=>`<div class="list-item game-list-item ${g.spendingEnabled===false?"status-off":""}"><div class="game-info"><strong>${escapeHtml(g.name)}</strong><div class="muted small">${g.spendingEnabled===false?"課金停止":"課金可"}</div></div><div class="game-actions"><div class="reorder-controls" aria-label="${escapeHtml(g.name)}の並べ替え"><button class="ghost reorder-btn" onclick="moveGame('${g.id}',-1)" ${index===0?"disabled":""} aria-label="${escapeHtml(g.name)}を上へ" title="上へ">↑</button><button class="ghost reorder-btn" onclick="moveGame('${g.id}',1)" ${index===data.games.length-1?"disabled":""} aria-label="${escapeHtml(g.name)}を下へ" title="下へ">↓</button></div><div class="form-actions game-edit-actions"><button class="ghost" onclick="renameGame('${g.id}')">名前変更</button><button class="${g.spendingEnabled===false?"secondary":"danger-btn"}" onclick="toggleSpending('${g.id}')">${g.spendingEnabled===false?"課金再開":"課金停止"}</button></div></div></div>`).join("")}</div></div>
  <div style="height:14px"></div>
  <div class="card"><div class="row wrap"><div><h2>固定課金</h2><div class="muted small">価格と周期は自由に修正できます。</div></div><button class="secondary" onclick="addSubscriptionPrompt()">＋追加</button></div><div class="table-wrap"><table><thead><tr><th>ゲーム</th><th>商品</th><th>金額</th><th>周期</th><th>有効</th><th></th></tr></thead><tbody>${data.subscriptions.map(s=>{const c=s.cycle==="days"?`${s.cycleValue}日ごと`:s.cycle==="annual"?`年${s.cycleValue}回`:"毎月";return `<tr><td>${escapeHtml(gameById(s.gameId)?.name||"")}</td><td>${escapeHtml(s.name)}</td><td>${yen(s.amount)}</td><td>${c}</td><td><input type="checkbox" ${s.active?"checked":""} onchange="toggleSub('${s.id}',this.checked)"></td><td><button class="ghost small" onclick="editSubscription('${s.id}')">編集</button></td></tr>`}).join("")}</tbody></table></div><div class="note-box" style="margin-top:12px">固定費予測：${yen(annualFixed())}/年（平均 ${yen(avgMonthlyFixed())}/月）</div></div>
  <div style="height:14px"></div>
  <div class="card"><h2>バックアップ</h2><div class="form-actions"><button class="secondary" onclick="exportBackup()">JSONバックアップ</button><button class="ghost" onclick="document.getElementById('jsonInput').click()">JSON復元</button><input id="jsonInput" type="file" accept=".json,application/json" style="display:none" onchange="importBackup(event)"><button class="ghost" onclick="changeCloud()">Supabase設定変更</button></div></div>`;
}
function renderAll(){renderHome();renderHistory();renderAdd();renderAnalysis();renderSettings();switchPage(currentPage)}

function addTransaction(){const date=document.getElementById("txDate").value,gameId=document.getElementById("txGame").value,category=document.getElementById("txCategory").value,amount=Number(document.getElementById("txAmount").value),productName=document.getElementById("txProduct").value.trim(),memo=document.getElementById("txMemo").value.trim();if(!date||!gameId||!amount||amount<0){alert("日付・ゲーム・金額を確認してください。");return}const g=gameById(gameId);if(g?.spendingEnabled===false&&!confirm(`${g.name} は「課金停止」です。それでも登録しますか？`))return;data.transactions.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),date,gameId,category,amount,productName,memo});markDirtyAndSave();switchPage("home")}
function deleteTx(id){if(!confirm("この課金記録を削除しますか？"))return;data.transactions=data.transactions.filter(t=>t.id!==id);markDirtyAndSave()}
function saveSettings(){data.settings.year=Number(document.getElementById("setYear").value);data.settings.annualBudget=Number(document.getElementById("setAnnual").value);data.settings.monthlyReference=Number(document.getElementById("setMonthly").value);markDirtyAndSave();alert("保存しました。")}
function toggleSpending(id){const g=gameById(id);if(!g)return;g.spendingEnabled=!g.spendingEnabled;markDirtyAndSave()}
function moveGame(id,direction){
  const from=data.games.findIndex(g=>g.id===id);
  const to=from+Number(direction);
  if(from<0||to<0||to>=data.games.length)return;
  const [game]=data.games.splice(from,1);
  data.games.splice(to,0,game);
  markDirtyAndSave();
}
function makeGameId(){let id="game_"+Date.now().toString(36);while(data.games.some(g=>g.id===id))id+="_x";return id}
function addGame(){const raw=prompt("追加するゲーム名を入力してください。");if(raw===null)return;const name=raw.trim();if(!name)return alert("ゲーム名を入力してください。");if(data.games.some(g=>g.name.trim().toLowerCase()===name.toLowerCase()))return alert("同じ名前のゲームがあります。");data.games.push({id:makeGameId(),name,status:"active",spendingEnabled:true});markDirtyAndSave()}
function renameGame(id){const g=gameById(id);if(!g)return;const old=g.name,raw=prompt("新しいゲーム名",old);if(raw===null)return;const n=raw.trim();if(!n||n===old)return;if(data.games.some(x=>x.id!==id&&x.name.toLowerCase()===n.toLowerCase()))return alert("同じ名前のゲームがあります。");if(data.legacyGameTotals&&Object.prototype.hasOwnProperty.call(data.legacyGameTotals,old)){data.legacyGameTotals[n]=Number(data.legacyGameTotals[n]||0)+Number(data.legacyGameTotals[old]||0);delete data.legacyGameTotals[old]}g.name=n;markDirtyAndSave()}
function toggleSub(id,checked){const s=data.subscriptions.find(x=>x.id===id);if(!s)return;s.active=checked;markDirtyAndSave()}
function editSubscription(id){const s=data.subscriptions.find(x=>x.id===id);if(!s)return;const amount=prompt("金額",s.amount);if(amount===null)return;const type=prompt("周期タイプ: days / monthly / annual",s.cycle);if(type===null)return;const val=prompt(type==="days"?"何日ごと？":type==="annual"?"年間何回？":"1",s.cycleValue);if(val===null)return;s.amount=Number(amount);s.cycle=type;s.cycleValue=Number(val||1);markDirtyAndSave()}
function addSubscriptionPrompt(){const gameName=prompt("ゲーム名（完全一致）");if(!gameName)return;const g=data.games.find(x=>x.name===gameName);if(!g)return alert("登録済みゲーム名と一致しません。");const name=prompt("商品名");if(!name)return;const amount=Number(prompt("金額"));if(!amount)return;const cycle=prompt("周期タイプ: days / monthly / annual","monthly")||"monthly";const cycleValue=Number(prompt(cycle==="days"?"何日ごと？":cycle==="annual"?"年間何回？":"1","1")||1);data.subscriptions.push({id:"s"+Date.now(),gameId:g.id,name,amount,type:"その他",cycle,cycleValue,active:true});markDirtyAndSave()}

function simulationMarkup(amount,gameId,category){const g=gameById(gameId),afterRemain=remainingBudget()-amount,afterFree=freeRemaining()-amount,nowP=projectedYear(),afterP=nowP+amount,b=Number(data.settings.annualBudget);return `<div class="stack"><div class="row"><span>ゲーム</span><strong>${escapeHtml(g?.name||"未指定")}</strong></div><div class="row"><span>種類</span><strong>${escapeHtml(category||"未指定")}</strong></div><div class="row"><span>購入予定</span><strong>${yen(amount)}</strong></div><hr><div class="row"><span>年間残額</span><strong>${yen(remainingBudget())} → ${yen(afterRemain)}</strong></div><div class="row"><span>自由課金残り目安</span><strong>${yen(freeRemaining())} → ${yen(afterFree)}</strong></div><div class="row"><span>年末予測</span><strong>${yen(nowP)} → ${yen(afterP)}</strong></div>${afterP>b?`<div class="warning-box">年間予算を ${yen(afterP-b)} 超過する予測です。</div>`:`<div class="success-box">現在の予測では年間予算内です。</div>`}</div>`}
function openSimulation(amount=10000,gameId=data.games.find(g=>g.spendingEnabled)?.id,category="ガチャ・石"){const d=document.getElementById("simDialog");document.getElementById("simContent").innerHTML=`<div class="form-grid" style="margin-top:12px"><label>金額<input id="simAmount" type="number" value="${amount}"></label><label>ゲーム<select id="simGame">${data.games.map(g=>`<option value="${g.id}" ${g.id===gameId?"selected":""}>${escapeHtml(g.name)}</option>`).join("")}</select></label><label>種類<select id="simCat">${categories.map(c=>`<option ${c===category?"selected":""}>${c}</option>`).join("")}</select></label></div><div class="form-actions"><button type="button" class="secondary" onclick="refreshSimulation()">再計算</button></div><div id="simResult" style="margin-top:14px">${simulationMarkup(amount,gameId,category)}</div>`;d.showModal()}
function refreshSimulation(){const a=Number(document.getElementById("simAmount").value||0),g=document.getElementById("simGame").value,c=document.getElementById("simCat").value;document.getElementById("simResult").innerHTML=simulationMarkup(a,g,c)}
function openSimulationFromForm(){const a=Number(document.getElementById("txAmount").value||0);if(!a)return alert("金額を入力してください。");openSimulation(a,document.getElementById("txGame").value,document.getElementById("txCategory").value)}

function csvEscape(v){const s=String(v??"");return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s}
function exportCSV(){const rows=[["date","game","category","product","amount","memo"],...data.transactions.map(t=>[t.date,gameById(t.gameId)?.name||"",t.category,t.productName||"",t.amount,t.memo||""])];downloadText(`gacha-transactions-${data.settings.year}.csv`,rows.map(r=>r.map(csvEscape).join(",")).join("\n"),"text/csv;charset=utf-8")}
function exportBackup(){downloadText(`gacha-budget-backup-${data.settings.year}.json`,JSON.stringify(data,null,2),"application/json")}
async function importBackup(ev){const f=ev.target.files[0];if(!f)return;try{const o=JSON.parse(await f.text());if(!o.settings||!o.games)throw new Error();data=o;markDirtyAndSave();alert("復元しました。クラウドへ同期します。")}catch(e){alert("読み込めませんでした。")}ev.target.value=""}
function downloadText(name,text,type){const blob=new Blob([text],{type}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

document.getElementById("saveCloudBtn").addEventListener("click",saveCloudConfigUI);
document.getElementById("loginBtn").addEventListener("click",login);
document.getElementById("signupBtn").addEventListener("click",signup);
document.getElementById("changeCloudBtn").addEventListener("click",changeCloud);
document.getElementById("quickAddBtn").addEventListener("click",()=>switchPage("add"));
document.querySelectorAll(".bottom-nav button").forEach(b=>b.addEventListener("click",()=>switchPage(b.dataset.page)));

Object.assign(window,{switchPage,addTransaction,deleteTx,saveSettings,toggleSpending,moveGame,addGame,renameGame,toggleSub,editSubscription,addSubscriptionPrompt,openSimulation,openSimulationFromForm,refreshSimulation,exportCSV,exportBackup,importBackup,logout,changeCloud});

boot();
