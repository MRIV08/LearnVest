import { useState, useEffect, useCallback, useRef } from "react";
import { Analytics } from '@vercel/analytics/react';

// ─── PERSISTENCE ──────────────────────────────────────────────────────────────
const DB_PREFIX = "lv2_";
async function dbSet(key, value) {
  const s = JSON.stringify(value);
  try { if (window.storage) await window.storage.set(DB_PREFIX+key, s); } catch(_){}
  try { localStorage.setItem(DB_PREFIX+key, s); } catch(_){}
}
async function dbGet(key) {
  try { if (window.storage) { const r = await window.storage.get(DB_PREFIX+key); if(r&&r.value) return JSON.parse(r.value); } } catch(_){}
  try { const r = localStorage.getItem(DB_PREFIX+key); if(r) return JSON.parse(r); } catch(_){}
  return null;
}
async function dbList(prefix) {
  const keys=[];
  try { if(window.storage){const r=await window.storage.list(DB_PREFIX+prefix);if(r&&r.keys)return r.keys.map(k=>k.replace(DB_PREFIX,""));} } catch(_){}
  try { for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(DB_PREFIX+prefix))keys.push(k.replace(DB_PREFIX,""));} } catch(_){}
  return keys;
}
async function saveUser(u){ await dbSet("user_"+u.name.toLowerCase().replace(/\s+/g,"_"),u); }
async function loadUser(name){ return dbGet("user_"+name.toLowerCase().replace(/\s+/g,"_")); }
async function saveSession(name){ await dbSet("session",{name,ts:Date.now()}); }
async function loadSession(){ return dbGet("session"); }
async function clearSession(){ await dbSet("session",null); }
async function listUsers(){ return dbList("user_"); }

// ─── STATIC DATA ─────────────────────────────────────────────────────────────
const STOCKS = [
  {ticker:"AAPL",name:"Apple Inc.",price:189.5,change:1.2,sector:"Tech"},
  {ticker:"MSFT",name:"Microsoft",price:415.2,change:0.8,sector:"Tech"},
  {ticker:"GOOGL",name:"Alphabet",price:175.3,change:-0.5,sector:"Tech"},
  {ticker:"AMZN",name:"Amazon",price:198.7,change:2.1,sector:"Retail"},
  {ticker:"NVDA",name:"NVIDIA",price:875.4,change:3.4,sector:"Tech"},
  {ticker:"TSLA",name:"Tesla",price:245.6,change:-1.8,sector:"Auto"},
  {ticker:"META",name:"Meta",price:512.3,change:1.5,sector:"Tech"},
  {ticker:"JPM",name:"JPMorgan",price:198.4,change:0.6,sector:"Finance"},
  {ticker:"V",name:"Visa Inc.",price:275.8,change:0.4,sector:"Finance"},
  {ticker:"WMT",name:"Walmart",price:68.3,change:-0.2,sector:"Retail"},
  {ticker:"JNJ",name:"J&J",price:152.7,change:0.1,sector:"Health"},
  {ticker:"PG",name:"P&G",price:165.2,change:0.5,sector:"Consumer"},
  {ticker:"MA",name:"Mastercard",price:462.9,change:1.1,sector:"Finance"},
  {ticker:"HD",name:"Home Depot",price:342.5,change:-0.7,sector:"Retail"},
  {ticker:"NFLX",name:"Netflix",price:628.7,change:2.8,sector:"Media"},
  {ticker:"AMD",name:"AMD",price:168.9,change:2.2,sector:"Tech"},
  {ticker:"DIS",name:"Disney",price:112.4,change:-1.2,sector:"Media"},
  {ticker:"UNH",name:"UnitedHealth",price:521.3,change:0.9,sector:"Health"},
];

const BADGES_DEF = [
  {id:"first_trade",icon:"🎯",name:"First Trade",desc:"Complete your first trade",rarity:"common"},
  {id:"diversified",icon:"🌈",name:"Diversified",desc:"Own 5 different stocks",rarity:"rare"},
  {id:"gain_10",icon:"🚀",name:"Moon Shot",desc:"Achieve 10% portfolio gain",rarity:"epic"},
  {id:"streak_3",icon:"🔥",name:"On Fire",desc:"3-day login streak",rarity:"rare"},
  {id:"big_spender",icon:"💎",name:"Big Spender",desc:"Make a $1000+ trade",rarity:"rare"},
  {id:"sector_master",icon:"🏛️",name:"Sector Master",desc:"Own stocks in 3 sectors",rarity:"epic"},
  {id:"profit_maker",icon:"💰",name:"Profit Maker",desc:"Close a trade in profit",rarity:"common"},
  {id:"legend",icon:"👑",name:"Legend",desc:"Reach Level 10",rarity:"legendary"},
  {id:"news_reader",icon:"📰",name:"News Junkie",desc:"Read 5 news articles",rarity:"common"},
];

const MISSIONS_POOL = [
  {id:"m1",title:"First Blood",desc:"Buy any stock",icon:"🎯",xp:30,coins:20,target:1,type:"buy_any"},
  {id:"m2",title:"Spread the Risk",desc:"Own stocks in 2 sectors",icon:"🌐",xp:50,coins:35,target:2,type:"sectors"},
  {id:"m3",title:"High Roller",desc:"Make a trade worth $500+",icon:"💸",xp:40,coins:25,target:500,type:"trade_value"},
  {id:"m4",title:"Market Watcher",desc:"View 5 different stock cards",icon:"👀",xp:20,coins:15,target:5,type:"view_stocks"},
  {id:"m5",title:"Triple Diversify",desc:"Own 3 different stocks",icon:"🔺",xp:45,coins:30,target:3,type:"unique_stocks"},
  {id:"m6",title:"Profit Seeker",desc:"Sell a stock for a gain",icon:"📈",xp:60,coins:40,target:1,type:"profit_trade"},
  {id:"m7",title:"Big League",desc:"Portfolio value over $10,200",icon:"🏆",xp:70,coins:50,target:10200,type:"portfolio_value"},
  {id:"m8",title:"Speed Trader",desc:"Make 3 trades today",icon:"⚡",xp:55,coins:35,target:3,type:"trade_count"},
];

const AVATARS = [
  {id:"lion",icon:"🦁",name:"Lion",rarity:"common",cost:0},
  {id:"fox",icon:"🦊",name:"Fox",rarity:"common",cost:0},
  {id:"wolf",icon:"🐺",name:"Wolf",rarity:"common",cost:0},
  {id:"eagle",icon:"🦅",name:"Eagle",rarity:"rare",cost:200},
  {id:"dolphin",icon:"🐬",name:"Dolphin",rarity:"rare",cost:200},
  {id:"dragon",icon:"🐉",name:"Dragon",rarity:"epic",cost:500},
  {id:"unicorn",icon:"🦄",name:"Unicorn",rarity:"epic",cost:500},
  {id:"phoenix",icon:"🔥",name:"Phoenix",rarity:"legendary",cost:1000},
];
const THEMES = [
  {id:"cosmic",name:"Cosmic",bg:"linear-gradient(160deg,#0f0c29,#302b63,#1a1a2e)",accent:"#818cf8",cost:0,rarity:"common"},
  {id:"ocean",name:"Ocean",bg:"linear-gradient(160deg,#0c1445,#1a3a6b,#0d2137)",accent:"#38bdf8",cost:300,rarity:"rare"},
  {id:"forest",name:"Forest",bg:"linear-gradient(160deg,#052e16,#14532d,#064e3b)",accent:"#4ade80",cost:300,rarity:"rare"},
  {id:"sunset",name:"Sunset",bg:"linear-gradient(160deg,#431407,#7c2d12,#450a0a)",accent:"#fb923c",cost:500,rarity:"epic"},
  {id:"galaxy",name:"Galaxy",bg:"linear-gradient(160deg,#1e0537,#2e1065,#0f0c29)",accent:"#e879f9",cost:1000,rarity:"legendary"},
];
const FRAMES = [
  {id:"none",name:"No Frame",style:{},cost:0,rarity:"common"},
  {id:"gold",name:"Gold",style:{border:"3px solid #f59e0b",boxShadow:"0 0 12px #f59e0b88"},cost:250,rarity:"rare"},
  {id:"rainbow",name:"Rainbow",style:{border:"3px solid #a855f7",boxShadow:"0 0 12px #a855f788"},cost:600,rarity:"epic"},
  {id:"legendary",name:"Legendary",style:{border:"3px solid #e879f9",boxShadow:"0 0 20px #e879f988"},cost:1200,rarity:"legendary"},
];
const LESSONS = [
  {title:"What is a Stock?",icon:"📈",content:"A stock is a tiny piece of ownership in a company. When you buy Apple stock, you own a small part of Apple! If Apple does well, your stock goes up in value."},
  {title:"Why Diversify?",icon:"🌈",content:"Diversification means spreading your money across different stocks. If one company has a bad day, your other stocks might still be doing great!"},
  {title:"What is P&L?",icon:"💰",content:"P&L stands for Profit and Loss. If you bought a stock for $100 and it's now worth $120, your P&L is +$20 — a 20% gain!"},
  {title:"Bull vs Bear",icon:"🐂",content:"A Bull Market is when prices go UP. A Bear Market is when prices go DOWN. Knowing which market you're in helps you make smarter decisions."},
];
const SEED_FRIENDS = [
  {id:"f1",name:"Alex T.",avatar:"🦅",level:7,ret:18.4,cash:9200,holdings:{AAPL:3}},
  {id:"f2",name:"Jamie L.",avatar:"🐬",level:5,ret:14.2,cash:8500,holdings:{NVDA:1}},
  {id:"f3",name:"Sam K.",avatar:"🦁",level:9,ret:11.7,cash:7800,holdings:{MSFT:2}},
  {id:"f4",name:"Riley M.",avatar:"🦊",level:4,ret:8.9,cash:9800,holdings:{}},
];
const RARITY_COLORS = {common:"#94a3b8",rare:"#60a5fa",epic:"#a855f7",legendary:"#f59e0b"};

// ─── SIMULATED NEWS DATA ──────────────────────────────────────────────────────
// Realistic simulated articles (no API key needed, always available)
const NEWS_ARTICLES = [
  {id:"n1",headline:"NVIDIA Surges as AI Chip Demand Hits Record Highs",source:"MarketWatch",time:"2h ago",category:"Earnings",ticker:"NVDA",emoji:"🤖",color:"linear-gradient(135deg,#1e3a5f,#1e4d2b)",summary:"NVIDIA reported record quarterly earnings driven by explosive demand for its AI chips from data centers worldwide.",whyMatters:"When a company earns more money than expected, investors get excited and buy more stock, pushing the price up.",howAffects:"NVDA stock jumped over 8% after the announcement. Companies supplying NVIDIA also saw gains.",reaction:"Investors are betting that AI will keep growing, making NVIDIA one of the most valuable companies on Earth.",bookmark:false},
  {id:"n2",headline:"Federal Reserve Holds Interest Rates Steady — What It Means",source:"Reuters",time:"4h ago",category:"Economy",ticker:null,emoji:"🏦",color:"linear-gradient(135deg,#2d1b69,#1a3a6b)",summary:"The Fed decided to keep borrowing costs unchanged, signaling they want to see more progress on inflation before cutting rates.",whyMatters:"Interest rates affect how much it costs to borrow money. When rates are high, people spend less, which can slow the economy.",howAffects:"Financial stocks like JPM and V tend to do well when rates stay high. Growth stocks like tech can struggle.",reaction:"Markets initially dipped then recovered as investors believe rate cuts may come later this year.",bookmark:false},
  {id:"n3",headline:"Apple Unveils New AI Features for iPhone — Stock Climbs",source:"CNBC",time:"5h ago",category:"Tech",ticker:"AAPL",emoji:"📱",color:"linear-gradient(135deg,#1a1a2e,#3b1f5e)",summary:"Apple announced a suite of on-device AI features coming to iPhone, including a smarter Siri and real-time translation tools.",whyMatters:"Apple needs to show it can compete in AI. These features could convince more people to upgrade their iPhones.",howAffects:"AAPL stock rose 3.2% on the news as investors see a strong upgrade cycle coming.",reaction:"Wall Street analysts raised their price targets for Apple, calling the AI push a major growth catalyst.",bookmark:false},
  {id:"n4",headline:"Tesla Delivery Numbers Miss Estimates — Shares Drop",source:"Bloomberg",time:"6h ago",category:"Auto",ticker:"TSLA",emoji:"⚡",color:"linear-gradient(135deg,#450a0a,#4a1942)",summary:"Tesla delivered fewer vehicles than expected last quarter, citing production challenges and softening EV demand in key markets.",whyMatters:"Deliveries are like report cards for Tesla — fewer deliveries usually means less revenue and unhappy investors.",howAffects:"TSLA fell nearly 5% after the report. Competitor EV stocks also dipped on broader sector concerns.",reaction:"Some analysts still believe Tesla's long-term energy business could offset weaker car sales.",bookmark:false},
  {id:"n5",headline:"Amazon Web Services Growth Accelerates on AI Demand",source:"Yahoo Finance",time:"8h ago",category:"Tech",ticker:"AMZN",emoji:"☁️",color:"linear-gradient(135deg,#1a2e1a,#0f3460)",summary:"Amazon's cloud computing arm AWS posted 17% revenue growth, beating estimates as businesses rush to adopt AI infrastructure.",whyMatters:"AWS is Amazon's most profitable business. When it grows fast, Amazon's overall profits grow too.",howAffects:"AMZN shares rose 4% in after-hours trading. Cloud rivals Microsoft and Google also saw gains.",reaction:"Investors are calling this the 'cloud AI boom' — companies are spending heavily to upgrade their tech.",bookmark:false},
  {id:"n6",headline:"Oil Prices Rise on Middle East Supply Concerns",source:"Reuters",time:"10h ago",category:"Commodities",ticker:null,emoji:"🛢️",color:"linear-gradient(135deg,#431407,#292524)",summary:"Crude oil climbed above $88 per barrel after reports of potential supply disruptions raised concerns about global energy markets.",whyMatters:"Oil prices affect everything from gas prices to airline costs to plastic manufacturing — it ripples through the whole economy.",howAffects:"Energy sector stocks tend to rise when oil prices increase. Airlines, shipping, and consumer goods can see costs rise.",reaction:"Investors are watching Middle East tensions closely as any supply disruption could push prices higher.",bookmark:false},
  {id:"n7",headline:"Meta Platforms Hits All-Time High After Ad Revenue Boom",source:"MarketWatch",time:"12h ago",category:"Tech",ticker:"META",emoji:"👍",color:"linear-gradient(135deg,#1e3a5f,#312e81)",summary:"Meta reported a massive jump in advertising revenue as its AI-powered ad targeting tools proved more effective than rivals.",whyMatters:"Most of Meta's money comes from ads on Facebook and Instagram. Better ads = more revenue = higher stock price.",howAffects:"META stock hit an all-time high, breaking above $525. The news boosted confidence in digital advertising broadly.",reaction:"Analysts upgraded their outlook for the entire digital ad industry following Meta's blowout results.",bookmark:false},
  {id:"n8",headline:"Netflix Adds 9 Million Subscribers — Password Crackdown Works",source:"CNBC",time:"1d ago",category:"Media",ticker:"NFLX",emoji:"🎬",color:"linear-gradient(135deg,#450a0a,#1a1a2e)",summary:"Netflix smashed subscriber estimates after its password-sharing crackdown drove millions of new paying accounts in a single quarter.",whyMatters:"More subscribers means more monthly revenue. Netflix's crackdown turned freeloaders into paying customers.",howAffects:"NFLX jumped 11% after the earnings report — one of its biggest single-day gains this year.",reaction:"Investors cheered the results and are now watching whether Netflix can hold onto these new subscribers.",bookmark:false},
  {id:"n9",headline:"Microsoft Integrates Copilot AI Into All Office Products",source:"Bloomberg",time:"1d ago",category:"Tech",ticker:"MSFT",emoji:"🖥️",color:"linear-gradient(135deg,#1e3a5f,#0f3460)",summary:"Microsoft announced that its AI assistant Copilot will be bundled into all Microsoft 365 subscriptions starting next quarter.",whyMatters:"This gives Microsoft a way to charge more for its software while making it harder for businesses to switch away.",howAffects:"MSFT shares edged higher on the news. Analysts see this as a major revenue boost for the company.",reaction:"Businesses are cautiously excited — Copilot can save hours of work per employee if it delivers on its promises.",bookmark:false},
  {id:"n10",headline:"Walmart Reports Strong Quarter — Consumer Spending Holds Up",source:"Yahoo Finance",time:"2d ago",category:"Retail",ticker:"WMT",emoji:"🛒",color:"linear-gradient(135deg,#052e16,#1e3a5f)",summary:"Walmart beat earnings estimates as shoppers continued spending despite inflation, with grocery and private-label brands seeing strong growth.",whyMatters:"Walmart is huge — when it does well, it shows the average American consumer is still spending money.",howAffects:"WMT stock gained 2.5%. Other retail stocks like HD and AMZN also saw modest gains on the positive consumer signal.",reaction:"Economists are using Walmart's results as evidence the economy is still resilient despite high interest rates.",bookmark:false},
];

const GLOSSARY = [
  {term:"Earnings",def:"A company's profit — how much money it made after paying all its costs.",emoji:"💰"},
  {term:"Bull Market",def:"When stock prices are rising and investors are optimistic.",emoji:"🐂"},
  {term:"Bear Market",def:"When stock prices are falling and investors are worried.",emoji:"🐻"},
  {term:"Interest Rate",def:"The cost of borrowing money. Set by central banks like the Federal Reserve.",emoji:"🏦"},
  {term:"Market Cap",def:"The total value of a company's shares. Price × Total Shares = Market Cap.",emoji:"📊"},
  {term:"Dividend",def:"A cash payment companies make to shareholders — like a thank-you bonus.",emoji:"🎁"},
  {term:"Volatility",def:"How much a stock's price swings up and down. High volatility = big moves.",emoji:"🎢"},
  {term:"Portfolio",def:"All the investments you own — your personal collection of stocks.",emoji:"💼"},
  {term:"Rally",def:"When stock prices rise sharply in a short time.",emoji:"🚀"},
  {term:"Correction",def:"A 10% drop from recent highs — a normal part of market cycles.",emoji:"📉"},
];

const SECTOR_DATA = [
  {name:"Tech",change:2.8,icon:"💻",color:"#6366f1"},
  {name:"Finance",change:1.2,icon:"🏦",color:"#22c55e"},
  {name:"Health",change:0.9,icon:"💊",color:"#06b6d4"},
  {name:"Media",change:1.6,icon:"🎬",color:"#f59e0b"},
  {name:"Retail",change:-0.4,icon:"🛒",color:"#ef4444"},
  {name:"Auto",change:-1.8,icon:"🚗",color:"#f87171"},
  {name:"Consumer",change:0.5,icon:"🛍️",color:"#a78bfa"},
];

function pickMissions(){
  return [...MISSIONS_POOL].sort(()=>Math.random()-0.5).slice(0,3).map(m=>({...m,progress:0,done:false}));
}
function freshUser(name){
  const today=new Date().toDateString();
  return {name,avatar:"lion",frame:"none",theme:"cosmic",cash:10000,xp:0,level:1,streak:1,coins:100,badges:[],holdings:{},transactions:[],watchlist:[],missions:pickMissions(),missionDate:today,viewedStocks:[],friends:SEED_FRIENDS.map(f=>f.id),leagues:[{id:"l1",name:"Rookie League",members:["f1","f2","f3","f4","me"],created:Date.now()}],unlockedAvatars:["lion","fox","wolf"],unlockedThemes:["cosmic"],unlockedFrames:["none"],todayTrades:0,profitTrades:0,pvHistory:[10000],lastLoginDate:today,createdAt:Date.now(),bookmarks:[],articlesRead:0};
}
function genSparkline(change){
  let v=50;
  return Array.from({length:12},()=>{v+=(Math.random()-0.48)*8+change*0.5;v=Math.max(10,Math.min(90,v));return v;});
}
const initSparks={};
STOCKS.forEach(s=>{initSparks[s.ticker]=genSparkline(s.change);});

// ─── SMALL UI COMPONENTS ──────────────────────────────────────────────────────
function Sparkline({points,positive}){
  const W=80,H=32,mn=Math.min(...points),mx=Math.max(...points),rng=mx-mn||1;
  const pts=points.map((p,i)=>`${(i/(points.length-1))*W},${H-((p-mn)/rng)*H}`).join(" ");
  return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}><polyline fill="none" stroke={positive?"#22c55e":"#ef4444"} strokeWidth="2" points={pts}/></svg>;
}
function XPBar({xp,level}){
  const needed=level*100,pct=Math.min(((xp%needed)/needed)*100,100);
  return <div style={{background:"rgba(255,255,255,0.1)",borderRadius:99,height:8,width:"100%",overflow:"hidden"}}><div style={{background:"linear-gradient(90deg,#818cf8,#a78bfa,#f472b6)",width:pct+"%",height:"100%",borderRadius:99,transition:"width 0.6s cubic-bezier(.4,2,.6,1)"}}/></div>;
}
function ProgressBar({pct,color}){
  return <div style={{background:"rgba(255,255,255,0.1)",borderRadius:99,height:6,width:"100%",overflow:"hidden"}}><div style={{background:color||"linear-gradient(90deg,#f59e0b,#ef4444)",width:Math.min(pct,100)+"%",height:"100%",borderRadius:99,transition:"width 0.8s cubic-bezier(.4,2,.6,1))"}}/></div>;
}
function Toast({msg,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2800);return()=>clearTimeout(t);},[onDone]);
  return <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",padding:"12px 22px",borderRadius:16,fontWeight:700,fontSize:14,zIndex:9999,boxShadow:"0 8px 32px rgba(99,102,241,0.5)",whiteSpace:"nowrap",animation:"popIn 0.3s"}}>{msg}</div>;
}
function Confetti(){
  const p=Array.from({length:20},(_,i)=>({color:["#f59e0b","#6366f1","#22c55e","#ef4444","#e879f9","#38bdf8"][i%6],left:Math.random()*100,delay:Math.random()*0.5,size:6+Math.random()*8}));
  return <div style={{position:"fixed",top:0,left:0,right:0,height:"100vh",pointerEvents:"none",zIndex:9998}}>{p.map((x,i)=><div key={i} style={{position:"absolute",left:x.left+"%",top:"-10px",width:x.size,height:x.size,background:x.color,borderRadius:2,animation:`confettiFall 1.5s ${x.delay}s ease-in forwards`}}/>)}</div>;
}
function Card({children,style}){
  return <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,padding:18,...style}}>{children}</div>;
}
function RarityBadge({rarity}){
  return <span style={{fontSize:10,fontWeight:700,color:RARITY_COLORS[rarity],background:RARITY_COLORS[rarity]+"22",padding:"2px 8px",borderRadius:99,textTransform:"uppercase",letterSpacing:0.5}}>{rarity}</span>;
}

const TABS=[
  {id:"dashboard",icon:"🏠",label:"Home"},
  {id:"market",icon:"📊",label:"Market"},
  {id:"portfolio",icon:"💼",label:"Portfolio"},
  {id:"news",icon:"📰",label:"News"},
  {id:"social",icon:"👥",label:"Social"},
  {id:"shop",icon:"🛍️",label:"Shop"},
];

const CSS=`
  @keyframes popIn{from{opacity:0;transform:translateX(-50%) scale(0.8)}to{opacity:1;transform:translateX(-50%) scale(1)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
  @keyframes confettiFall{to{transform:translateY(100vh) rotate(720deg);opacity:0}}
  @keyframes glow{0%,100%{box-shadow:0 0 10px #6366f188}50%{box-shadow:0 0 30px #6366f1cc,0 0 60px #8b5cf688}}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  *{box-sizing:border-box} input,button{font-family:inherit} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#ffffff22;border-radius:4px}
`;

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [screen,setScreen]=useState("loading");
  const [tab,setTab]=useState("dashboard");
  const [user,setUserState]=useState(null);
  const [loginName,setLoginName]=useState("");
  const [existingUsers,setExistingUsers]=useState([]);
  const [loginError,setLoginError]=useState("");
  const [saving,setSaving]=useState(false);
  const [stocks,setStocks]=useState(STOCKS.map(s=>({...s,sparkline:initSparks[s.ticker]})));
  const [search,setSearch]=useState("");
  const [toast,setToast]=useState(null);
  const [tradeStock,setTradeStock]=useState(null);
  const [tradeQty,setTradeQty]=useState(1);
  const [tradeMode,setTradeMode]=useState("buy");
  const [lessonOpen,setLessonOpen]=useState(null);
  const [badgePopup,setBadgePopup]=useState(null);
  const [confetti,setConfetti]=useState(false);
  const [missionReward,setMissionReward]=useState(null);
  const [socialTab,setSocialTab]=useState("friends");
  const [leagueModal,setLeagueModal]=useState(false);
  const [newLeagueName,setNewLeagueName]=useState("");
  const [selectedFriend,setSelectedFriend]=useState(null);
  const [shopTab,setShopTab]=useState("avatars");
  // News state
  const [newsArticles,setNewsArticles]=useState(NEWS_ARTICLES);
  const [newsFilter,setNewsFilter]=useState("All");
  const [openArticle,setOpenArticle]=useState(null);
  const [glossaryOpen,setGlossaryOpen]=useState(false);
  const [newsLoading,setNewsLoading]=useState(false);
  const saveTimer=useRef(null);
  const prevPv=useRef(10000);

  const setUser=useCallback((updater)=>{
    setUserState(prev=>{
      const next=typeof updater==="function"?updater(prev):updater;
      if(!next) return next;
      clearTimeout(saveTimer.current);
      saveTimer.current=setTimeout(async()=>{setSaving(true);await saveUser(next);setSaving(false);},800);
      return next;
    });
  },[]);

  useEffect(()=>{
    (async()=>{
      try{
        const [session,users]=await Promise.all([loadSession(),listUsers()]);
        setExistingUsers(users);
        if(session&&session.name){
          const saved=await loadUser(session.name);
          if(saved){
            const today=new Date().toDateString();
            let u={...saved};
            if(u.lastLoginDate!==today){
              const yest=new Date();yest.setDate(yest.getDate()-1);
              u.streak=u.lastLoginDate===yest.toDateString()?(u.streak||1)+1:1;
              u.lastLoginDate=today;
              if(u.missionDate!==today){u.missions=pickMissions();u.missionDate=today;u.todayTrades=0;}
            }
            if(!u.bookmarks)u.bookmarks=[];
            if(!u.articlesRead)u.articlesRead=0;
            setUserState(u);
            prevPv.current=(u.pvHistory&&u.pvHistory.length)?u.pvHistory[u.pvHistory.length-1]:10000;
            setScreen("app");return;
          }
        }
      }catch(_){}
      setScreen("login");
    })();
  },[]);

  useEffect(()=>{
    const iv=setInterval(()=>{
      setStocks(prev=>prev.map(s=>{
        const np=parseFloat(Math.max(1,s.price+(Math.random()-0.49)*0.9).toFixed(2));
        const nc=parseFloat((s.change+(Math.random()-0.5)*0.12).toFixed(2));
        return {...s,price:np,change:nc,sparkline:[...s.sparkline.slice(1),np]};
      }));
    },3000);
    return()=>clearInterval(iv);
  },[]);

  const showToast=useCallback((msg)=>setToast(msg),[]);
  const showConfetti=useCallback(()=>{setConfetti(true);setTimeout(()=>setConfetti(false),2000);},[]);

  function getPV(u,stks){
    let v=u.cash;
    Object.entries(u.holdings).forEach(([t,q])=>{const s=stks.find(x=>x.ticker===t);if(s)v+=s.price*q;});
    return v;
  }
  function awardBadge(u,id){
    if(u.badges.includes(id))return u;
    const badge=BADGES_DEF.find(b=>b.id===id);
    setBadgePopup(badge);showConfetti();
    setTimeout(()=>setBadgePopup(null),3000);
    return {...u,badges:[...u.badges,id],xp:u.xp+50,coins:u.coins+30};
  }
  function updateMissions(u,eventType,eventValue){
    const updated=u.missions.map(m=>{
      if(m.done)return m;
      let p=m.progress;
      if(m.type==="buy_any"&&eventType==="buy")p=Math.min(m.target,p+1);
      if(m.type==="trade_count"&&(eventType==="buy"||eventType==="sell"))p=Math.min(m.target,p+1);
      if(m.type==="trade_value"&&(eventType==="buy"||eventType==="sell")&&eventValue>=m.target)p=m.target;
      if(m.type==="unique_stocks")p=Math.min(m.target,Object.keys(u.holdings).length);
      if(m.type==="sectors"){const sc=new Set(Object.keys(u.holdings).map(t=>STOCKS.find(s=>s.ticker===t)?.sector));p=Math.min(m.target,sc.size);}
      if(m.type==="portfolio_value"&&eventType==="portfolio")p=eventValue>=m.target?m.target:p;
      if(m.type==="view_stocks"&&eventType==="view")p=Math.min(m.target,eventValue);
      if(m.type==="profit_trade"&&eventType==="profit")p=Math.min(m.target,p+1);
      const justDone=!m.done&&p>=m.target;
      if(justDone){const r={...m};setTimeout(()=>{setMissionReward(r);showConfetti();},400);setTimeout(()=>setMissionReward(null),3500);u={...u,xp:u.xp+m.xp,coins:u.coins+m.coins};}
      return {...m,progress:p,done:p>=m.target};
    });
    return {...u,missions:updated};
  }
  function checkBadges(u){
    let n={...u};
    if(n.transactions.length>=1)n=awardBadge(n,"first_trade");
    if(Object.keys(n.holdings).length>=5)n=awardBadge(n,"diversified");
    if(n.streak>=3)n=awardBadge(n,"streak_3");
    if(n.level>=10)n=awardBadge(n,"legend");
    const sc=new Set(Object.keys(n.holdings).map(t=>STOCKS.find(s=>s.ticker===t)?.sector));
    if(sc.size>=3)n=awardBadge(n,"sector_master");
    if((getPV(n,stocks)-10000)/10000>=0.1){n=awardBadge(n,"gain_10");showConfetti();}
    if((n.articlesRead||0)>=5)n=awardBadge(n,"news_reader");
    return n;
  }

  async function handleLogin(isNew){
    const trimmed=loginName.trim();
    if(!trimmed){setLoginError("Please enter your name!");return;}
    setLoginError("");
    const existing=await loadUser(trimmed);
    if(isNew&&existing){setLoginError("Name taken! Choose another or log in.");return;}
    if(!isNew&&!existing){setLoginError("Account not found. Sign up instead!");return;}
    const today=new Date().toDateString();
    let u=existing||freshUser(trimmed);
    if(u.lastLoginDate!==today){
      const yest=new Date();yest.setDate(yest.getDate()-1);
      u.streak=u.lastLoginDate===yest.toDateString()?(u.streak||1)+1:1;
      u.lastLoginDate=today;
      if(u.missionDate!==today){u.missions=pickMissions();u.missionDate=today;u.todayTrades=0;}
    }
    if(!u.bookmarks)u.bookmarks=[];
    if(!u.articlesRead)u.articlesRead=0;
    await saveUser(u);await saveSession(u.name);
    const users=await listUsers();setExistingUsers(users);
    setUserState(u);prevPv.current=(u.pvHistory&&u.pvHistory.length)?u.pvHistory[u.pvHistory.length-1]:10000;
    setScreen("app");
    showToast(isNew?"🎉 Welcome, "+u.name+"!":"👋 Welcome back, "+u.name+"!");
  }
  async function handleLogout(){
    await clearSession();setUserState(null);setLoginName("");setScreen("login");setTab("dashboard");
    setExistingUsers(await listUsers());
  }
  function handleTrade(){
    if(!tradeStock||tradeQty<1)return;
    const s=stocks.find(x=>x.ticker===tradeStock.ticker);
    const cost=s.price*tradeQty;
    setUser(prev=>{
      let u={...prev,holdings:{...prev.holdings}};
      if(tradeMode==="buy"){
        if(u.cash<cost){showToast("❌ Not enough cash!");return prev;}
        u.cash-=cost;u.holdings[s.ticker]=(u.holdings[s.ticker]||0)+tradeQty;
        if(cost>=1000)u=awardBadge(u,"big_spender");
        u=updateMissions(u,"buy",cost);
      }else{
        const owned=u.holdings[s.ticker]||0;
        if(owned<tradeQty){showToast("❌ Not enough shares!");return prev;}
        const buyTx=prev.transactions.find(t=>t.ticker===s.ticker&&t.type==="buy");
        if((s.price-(buyTx?.price||s.price))*tradeQty>0){u=awardBadge(u,"profit_maker");u=updateMissions(u,"profit",1);}
        u.cash+=cost;u.holdings[s.ticker]=owned-tradeQty;
        if(u.holdings[s.ticker]===0)delete u.holdings[s.ticker];
        u=updateMissions(u,"sell",cost);
      }
      u.xp+=20;u.coins+=10;u.level=Math.floor(u.xp/100)+1;
      u.todayTrades=(u.todayTrades||0)+1;
      u.transactions=[{ticker:s.ticker,qty:tradeQty,price:s.price,type:tradeMode,date:new Date().toLocaleDateString(),id:Date.now()},...u.transactions.slice(0,49)];
      u=checkBadges(u);
      const pv=getPV(u,stocks);
      u=updateMissions(u,"portfolio",pv);
      u.pvHistory=[...(u.pvHistory||[10000]).slice(-29),pv];
      if(pv>prevPv.current*1.05)showConfetti();
      prevPv.current=pv;
      showToast(tradeMode==="buy"?"✅ Bought "+tradeQty+" "+s.ticker:"💸 Sold "+tradeQty+" "+s.ticker);
      return u;
    });
    setTradeStock(null);setTradeQty(1);
  }
  function handleViewStock(ticker){
    setUser(prev=>{
      if(prev.viewedStocks.includes(ticker))return prev;
      const v=[...prev.viewedStocks,ticker];
      let u={...prev,viewedStocks:v};
      u=updateMissions(u,"view",v.length);
      return u;
    });
  }
  function handleReadArticle(article){
    setOpenArticle(article);
    setUser(prev=>{
      const read=(prev.articlesRead||0)+1;
      let u={...prev,articlesRead:read};
      u=checkBadges(u);
      if(read%3===0){u.xp+=15;u.coins+=8;showToast("📰 +15 XP for reading news!");}
      return u;
    });
  }
  function toggleBookmark(id){
    setNewsArticles(prev=>prev.map(a=>a.id===id?{...a,bookmark:!a.bookmark}:a));
    setUser(prev=>{
      const bm=prev.bookmarks||[];
      return {...prev,bookmarks:bm.includes(id)?bm.filter(x=>x!==id):[...bm,id]};
    });
  }
  function simulateRefresh(){
    setNewsLoading(true);
    setTimeout(()=>{
      setNewsArticles(prev=>[...prev].sort(()=>Math.random()-0.5));
      setNewsLoading(false);
      showToast("📰 News refreshed!");
    },1200);
  }

  // ── LOGIN / LOADING SCREENS ──────────────────────────────────────────────
  if(screen==="loading") return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f0c29,#302b63)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',sans-serif",color:"#fff"}}>
      <style>{CSS}</style>
      <div style={{fontSize:64,animation:"pulse 1s infinite"}}>📈</div>
      <div style={{fontWeight:900,fontSize:28,marginTop:12,letterSpacing:-1}}>LearnVest</div>
      <div style={{color:"#a78bfa",marginTop:8,display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:18,height:18,border:"2px solid #a78bfa",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
        Restoring your progress...
      </div>
    </div>
  );

  if(screen==="login") return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Segoe UI',sans-serif"}}>
      <style>{CSS}</style>
      <div style={{animation:"pulse 2s infinite",fontSize:70,marginBottom:8}}>📈</div>
      <h1 style={{color:"#fff",fontSize:42,fontWeight:900,margin:"0 0 4px",letterSpacing:-2}}>LearnVest</h1>
      <p style={{color:"#a78bfa",fontSize:15,marginBottom:36,textAlign:"center"}}>Trade smarter. Level up faster. 🚀</p>
      <p style={{color:"rgba(255,255,255,0.35)",fontSize:11,marginBottom:16,textAlign:"center",padding:"0 20px",lineHeight:1.6}}>
  ⚠️ LearnVest is a simulated investment game for educational purposes only. All trades use virtual money and are not real. This app does not constitute financial advice. Never make real investment decisions based on this app.
</p>
      <div style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(20px)",borderRadius:28,padding:32,width:"100%",maxWidth:400,border:"1px solid rgba(255,255,255,0.12)"}}>
        <p style={{color:"#c4b5fd",fontWeight:700,marginBottom:10}}>Your investor name</p>
        <input value={loginName} onChange={e=>{setLoginName(e.target.value);setLoginError("");}} placeholder="Enter your name..."
          style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"2px solid rgba(167,139,250,0.3)",background:"rgba(255,255,255,0.05)",color:"#fff",fontSize:16,marginBottom:8}}/>
        {loginError&&<div style={{color:"#f87171",fontSize:13,marginBottom:10,fontWeight:600}}>⚠️ {loginError}</div>}
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          <button onClick={()=>handleLogin(true)} style={{flex:1,padding:14,borderRadius:14,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>✨ Sign Up</button>
          <button onClick={()=>handleLogin(false)} style={{flex:1,padding:14,borderRadius:14,border:"2px solid rgba(167,139,250,0.4)",background:"transparent",color:"#c4b5fd",fontSize:15,fontWeight:800,cursor:"pointer"}}>🔑 Log In</button>
        </div>
        {existingUsers.length>0&&(
          <div>
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:12,fontWeight:600,marginBottom:8,textAlign:"center"}}>— SAVED ACCOUNTS —</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {existingUsers.slice(0,6).map(u=>(
                <button key={u} onClick={()=>{setLoginName(u.replace(/_/g," "));setLoginError("");}}
                  style={{padding:"7px 14px",borderRadius:10,border:"1px solid rgba(167,139,250,0.3)",background:"rgba(99,102,241,0.15)",color:"#c4b5fd",fontWeight:600,fontSize:13,cursor:"pointer",textTransform:"capitalize"}}>
                  {u.replace(/_/g," ")}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if(!user)return null;
  const theme=THEMES.find(t=>t.id===user.theme)||THEMES[0];
  const avatarObj=AVATARS.find(a=>a.id===user.avatar)||AVATARS[0];
  const frameObj=FRAMES.find(f=>f.id===user.frame)||FRAMES[0];
  const pv=getPV(user,stocks);
  const ret=((pv-10000)/10000*100).toFixed(2);
  const retPos=parseFloat(ret)>=0;
  const filtered=stocks.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.ticker.toLowerCase().includes(search.toLowerCase()));
  const liveTrade=tradeStock?stocks.find(x=>x.ticker===tradeStock.ticker):null;
  const pvHistory=user.pvHistory||[10000];

  // ── NEWS TAB ──────────────────────────────────────────────────────────────
  function renderNews(){
    const categories=["All","Tech","Economy","Earnings","Media","Auto","Retail","Commodities","Bookmarked"];
    const displayed=newsArticles.filter(a=>{
      if(newsFilter==="Bookmarked")return a.bookmark||(user.bookmarks||[]).includes(a.id);
      if(newsFilter==="All")return true;
      return a.category===newsFilter;
    });
    const topGainers=SECTOR_DATA.filter(s=>s.change>0).sort((a,b)=>b.change-a.change).slice(0,3);
    const topLosers=SECTOR_DATA.filter(s=>s.change<0).sort((a,b)=>a.change-b.change).slice(0,3);
    const trendingStocks=[...stocks].sort((a,b)=>Math.abs(b.change)-Math.abs(a.change)).slice(0,5);

    // Article detail view
    if(openArticle){
      const relatedStocks=stocks.filter(s=>openArticle.ticker===s.ticker||openArticle.headline.includes(s.ticker));
      return(
        <div style={{animation:"slideIn 0.3s"}}>
          <button onClick={()=>setOpenArticle(null)} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.08)",border:"none",color:"#a78bfa",fontWeight:700,fontSize:14,padding:"8px 14px",borderRadius:12,cursor:"pointer",marginBottom:14}}>← Back to News</button>
          <div style={{background:openArticle.color,borderRadius:20,padding:20,marginBottom:14,border:"1px solid rgba(255,255,255,0.12)"}}>
            <div style={{fontSize:40,marginBottom:10}}>{openArticle.emoji}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginBottom:6,display:"flex",gap:10}}>
              <span style={{background:"rgba(255,255,255,0.15)",padding:"2px 10px",borderRadius:99,fontWeight:600}}>{openArticle.source}</span>
              <span>{openArticle.time}</span>
              {openArticle.ticker&&<span style={{background:"rgba(99,102,241,0.4)",padding:"2px 10px",borderRadius:99,fontWeight:700}}>#{openArticle.ticker}</span>}
            </div>
            <div style={{fontWeight:900,fontSize:18,lineHeight:1.4,marginBottom:10}}>{openArticle.headline}</div>
            <p style={{color:"rgba(255,255,255,0.8)",lineHeight:1.7,fontSize:14,margin:0}}>{openArticle.summary}</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[{icon:"💡",label:"Why This Matters",content:openArticle.whyMatters,bg:"rgba(99,102,241,0.15)",border:"rgba(99,102,241,0.3)"},{icon:"📈",label:"How This Affects Stocks",content:openArticle.howAffects,bg:"rgba(34,197,94,0.1)",border:"rgba(34,197,94,0.3)"},{icon:"👥",label:"What Investors Are Saying",content:openArticle.reaction,bg:"rgba(245,158,11,0.1)",border:"rgba(245,158,11,0.3)"}].map(block=>(
              <div key={block.label} style={{background:block.bg,border:"1px solid "+block.border,borderRadius:16,padding:16}}>
                <div style={{fontWeight:800,fontSize:13,marginBottom:6,display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>{block.icon}</span>{block.label}</div>
                <p style={{color:"rgba(255,255,255,0.8)",fontSize:14,lineHeight:1.65,margin:0}}>{block.content}</p>
              </div>
            ))}
          </div>
          {relatedStocks.length>0&&(
            <div style={{marginTop:14}}>
              <div style={{fontWeight:800,fontSize:14,marginBottom:10}}>📊 Related Stocks</div>
              {relatedStocks.map(s=>(
                <div key={s.ticker} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:14,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div><div style={{fontWeight:800}}>{s.ticker}</div><div style={{color:"#a78bfa",fontSize:12}}>{s.name}</div></div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:800}}>${s.price.toFixed(2)}</div>
                    <div style={{color:s.change>=0?"#4ade80":"#f87171",fontSize:12,fontWeight:700}}>{s.change>=0?"▲":"▼"}{Math.abs(s.change).toFixed(2)}%</div>
                  </div>
                  <button onClick={()=>{setTradeStock(s);setTradeMode("buy");setTradeQty(1);setOpenArticle(null);setTab("market");}}
                    style={{padding:"8px 12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:12}}>Trade</button>
                </div>
              ))}
            </div>
          )}
          <div style={{marginTop:14,padding:14,background:"rgba(255,255,255,0.04)",borderRadius:14,border:"1px solid rgba(255,255,255,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>📰 Articles read: {user.articlesRead||0} • Next reward at {Math.ceil(((user.articlesRead||0)+1)/3)*3}</div>
            <button onClick={()=>toggleBookmark(openArticle.id)} style={{padding:"6px 14px",borderRadius:10,border:"none",background:(user.bookmarks||[]).includes(openArticle.id)?"rgba(245,158,11,0.3)":"rgba(255,255,255,0.08)",color:(user.bookmarks||[]).includes(openArticle.id)?"#fbbf24":"rgba(255,255,255,0.6)",fontWeight:700,cursor:"pointer",fontSize:13}}>
              {(user.bookmarks||[]).includes(openArticle.id)?"🔖 Saved":"🔖 Save"}
            </button>
          </div>
        </div>
      );
    }

    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:900,fontSize:20}}>📰 Market News</div>
            <div style={{fontSize:12,color:"#a78bfa"}}>Stay informed, invest smarter</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setGlossaryOpen(true)} style={{padding:"8px 12px",borderRadius:10,border:"1px solid rgba(167,139,250,0.3)",background:"rgba(99,102,241,0.15)",color:"#c4b5fd",fontWeight:700,fontSize:12,cursor:"pointer"}}>📖 Glossary</button>
            <button onClick={simulateRefresh} disabled={newsLoading} style={{padding:"8px 12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",opacity:newsLoading?0.7:1}}>
              {newsLoading?<span style={{display:"inline-block",animation:"spin 0.8s linear infinite"}}>↻</span>:"↻ Refresh"}
            </button>
          </div>
        </div>

        {/* News of the Day */}
        <div onClick={()=>handleReadArticle(newsArticles[0])} style={{background:newsArticles[0].color,borderRadius:22,padding:20,cursor:"pointer",border:"1px solid rgba(255,255,255,0.12)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:12,right:12,background:"linear-gradient(135deg,#f59e0b,#ef4444)",padding:"4px 12px",borderRadius:99,fontSize:10,fontWeight:800}}>⭐ NEWS OF THE DAY</div>
          <div style={{fontSize:44,marginBottom:8}}>{newsArticles[0].emoji}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginBottom:6}}>{newsArticles[0].source} • {newsArticles[0].time}</div>
          <div style={{fontWeight:900,fontSize:17,lineHeight:1.35,marginBottom:8}}>{newsArticles[0].headline}</div>
          <div style={{color:"rgba(255,255,255,0.7)",fontSize:13,lineHeight:1.5}}>{newsArticles[0].summary.slice(0,120)}...</div>
          <div style={{marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>Tap to read full story →</span>
            {newsArticles[0].ticker&&<span style={{background:"rgba(99,102,241,0.4)",padding:"4px 12px",borderRadius:99,fontSize:12,fontWeight:700}}>#{newsArticles[0].ticker}</span>}
          </div>
        </div>

        {/* Market Pulse */}
        <Card style={{padding:16}}>
          <div style={{fontWeight:800,fontSize:15,marginBottom:12}}>⚡ Market Pulse Today</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:14,padding:12}}>
              <div style={{fontSize:11,color:"#4ade80",fontWeight:700,marginBottom:6}}>🟢 TOP GAINING SECTORS</div>
              {topGainers.map(s=>(
                <div key={s.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:12}}>{s.icon} {s.name}</span>
                  <span style={{color:"#4ade80",fontWeight:700,fontSize:12}}>+{s.change}%</span>
                </div>
              ))}
            </div>
            <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:14,padding:12}}>
              <div style={{fontSize:11,color:"#f87171",fontWeight:700,marginBottom:6}}>🔴 TOP LOSING SECTORS</div>
              {topLosers.map(s=>(
                <div key={s.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:12}}>{s.icon} {s.name}</span>
                  <span style={{color:"#f87171",fontWeight:700,fontSize:12}}>{s.change}%</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",marginBottom:8}}>🔥 BIGGEST MOVERS</div>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
            {trendingStocks.map(s=>(
              <div key={s.ticker} onClick={()=>{setTradeStock(s);setTradeMode("buy");setTradeQty(1);setTab("market");}} style={{minWidth:80,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:12,padding:"10px 8px",textAlign:"center",cursor:"pointer"}}>
                <div style={{fontWeight:800,fontSize:13}}>{s.ticker}</div>
                <div style={{color:s.change>=0?"#4ade80":"#f87171",fontWeight:700,fontSize:12}}>{s.change>=0?"▲":"▼"}{Math.abs(s.change).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Category filter */}
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
          {categories.map(c=>(
            <button key={c} onClick={()=>setNewsFilter(c)} style={{minWidth:"fit-content",padding:"7px 14px",borderRadius:99,border:"none",background:newsFilter===c?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,0.07)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>
              {c==="Bookmarked"?"🔖 Saved":c}
            </button>
          ))}
        </div>

        {/* Articles */}
        {newsLoading?(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[1,2,3].map(i=>(
              <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:18,padding:16,height:110,backgroundImage:"linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite"}}/>
            ))}
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {displayed.length===0&&(
              <div style={{textAlign:"center",padding:40,color:"#a78bfa"}}>
                <div style={{fontSize:40,marginBottom:10}}>📭</div>
                <div style={{fontWeight:700}}>{newsFilter==="Bookmarked"?"No saved articles yet":"No articles in this category"}</div>
              </div>
            )}
            {displayed.slice(1).map((a,i)=>(
              <div key={a.id} onClick={()=>handleReadArticle(a)} style={{background:a.color,borderRadius:18,padding:16,cursor:"pointer",border:"1px solid rgba(255,255,255,0.1)",animation:"slideUp 0.3s",position:"relative"}}>
                <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  <div style={{fontSize:34,minWidth:42}}>{a.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{fontSize:10,background:"rgba(255,255,255,0.15)",padding:"2px 8px",borderRadius:99,fontWeight:600}}>{a.source}</span>
                        {a.ticker&&<span style={{fontSize:10,background:"rgba(99,102,241,0.4)",padding:"2px 8px",borderRadius:99,fontWeight:700}}>#{a.ticker}</span>}
                      </div>
                      <span style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>{a.time}</span>
                    </div>
                    <div style={{fontWeight:800,fontSize:14,lineHeight:1.35,marginBottom:6}}>{a.headline}</div>
                    <div style={{color:"rgba(255,255,255,0.65)",fontSize:12,lineHeight:1.5}}>{a.summary.slice(0,90)}...</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                      <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Tap for full story + explainer →</span>
                      <button onClick={e=>{e.stopPropagation();toggleBookmark(a.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,padding:0,color:(user.bookmarks||[]).includes(a.id)?"#fbbf24":"rgba(255,255,255,0.3)"}}>🔖</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{textAlign:"center",padding:"8px 0",fontSize:12,color:"rgba(255,255,255,0.3)"}}>📰 {user.articlesRead||0} articles read • +15 XP every 3 articles</div>
      </div>
    );
  }

  // ── GLOSSARY MODAL ───────────────────────────────────────────────────────
  function renderGlossary(){
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{background:"linear-gradient(135deg,#1e1b4b,#0f3460)",borderRadius:24,padding:24,width:"100%",maxWidth:400,maxHeight:"80vh",overflow:"auto",border:"1px solid rgba(255,255,255,0.12)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontWeight:900,fontSize:20}}>📖 Finance Glossary</div>
            <button onClick={()=>setGlossaryOpen(false)} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",borderRadius:10,padding:"6px 12px",cursor:"pointer",fontWeight:700}}>✕</button>
          </div>
          <p style={{color:"#a78bfa",fontSize:13,marginBottom:16}}>New to investing? Learn what these words mean!</p>
          {GLOSSARY.map((g,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:14,marginBottom:10}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:24}}>{g.emoji}</span>
                <span style={{fontWeight:800,fontSize:15}}>{g.term}</span>
              </div>
              <p style={{color:"rgba(255,255,255,0.75)",fontSize:13,lineHeight:1.6,margin:0}}>{g.def}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── DASHBOARD ────────────────────────────────────────────────────────────
  function renderDashboard(){
    const doneMissions=user.missions.filter(m=>m.done).length;
    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card style={{background:"linear-gradient(135deg,rgba(99,102,241,0.35),rgba(139,92,246,0.35))",border:"1px solid rgba(99,102,241,0.5)",animation:"glow 3s infinite"}}>
          <div style={{fontSize:12,color:"#c4b5fd",marginBottom:4}}>Total Portfolio</div>
          <div style={{fontSize:38,fontWeight:900,letterSpacing:-1.5}}>${pv.toFixed(2)}</div>
          <div style={{fontSize:17,fontWeight:700,color:retPos?"#4ade80":"#f87171",marginBottom:12}}>{retPos?"▲":"▼"} {Math.abs(ret)}% {retPos?"Gain 🎉":"Loss"}</div>
          {pvHistory.length>2&&(
            <svg width="100%" height="48" viewBox={`0 0 ${pvHistory.length-1} 48`} preserveAspectRatio="none" style={{marginBottom:10}}>
              <defs><linearGradient id="pvG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity="0.4"/><stop offset="100%" stopColor="#818cf8" stopOpacity="0"/></linearGradient></defs>
              {(()=>{const mn=Math.min(...pvHistory),mx=Math.max(...pvHistory),rng=mx-mn||1;const pts=pvHistory.map((v,i)=>`${i},${48-((v-mn)/rng)*44}`).join(" ");return(<><polygon points={pts+" "+(pvHistory.length-1)+",48 0,48"} fill="url(#pvG)"/><polyline fill="none" stroke="#818cf8" strokeWidth="2" points={pts}/></>);})()}
            </svg>
          )}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#c4b5fd",marginBottom:6}}><span>XP • Level {user.level}</span><span>{user.xp} XP • {user.coins} 🪙</span></div>
          <XPBar xp={user.xp} level={user.level}/>
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {[["💵","Cash","$"+user.cash.toFixed(0)],["🔥","Streak",user.streak+"d"],["🪙","Coins",user.coins]].map(([icon,label,val])=>(
            <Card key={label} style={{textAlign:"center",padding:14}}><div style={{fontSize:20}}>{icon}</div><div style={{fontSize:10,color:"#a78bfa",marginTop:3}}>{label}</div><div style={{fontWeight:800,fontSize:16,marginTop:2}}>{val}</div></Card>
          ))}
        </div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontWeight:800,fontSize:16}}>⚔️ Daily Missions</div>
            <div style={{fontSize:12,color:"#a78bfa",fontWeight:600}}>{doneMissions}/3 Complete</div>
          </div>
          {user.missions.map((m,i)=>{
            const pct=(m.progress/m.target)*100;
            const bgs=["linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2))","linear-gradient(135deg,rgba(245,158,11,0.3),rgba(239,68,68,0.2))","linear-gradient(135deg,rgba(16,185,129,0.3),rgba(5,150,105,0.2))"];
            const borders=["rgba(99,102,241,0.5)","rgba(245,158,11,0.5)","rgba(16,185,129,0.5)"];
            const bars=["linear-gradient(90deg,#6366f1,#a78bfa)","linear-gradient(90deg,#f59e0b,#ef4444)","linear-gradient(90deg,#10b981,#06b6d4)"];
            return(
              <div key={m.id} style={{background:m.done?"linear-gradient(135deg,rgba(34,197,94,0.2),rgba(16,185,129,0.15))":bgs[i],border:"1px solid "+(m.done?"rgba(34,197,94,0.5)":borders[i]),borderRadius:18,padding:"14px 16px",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:28,minWidth:36}}>{m.done?"✅":m.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontWeight:800,fontSize:14}}>{m.title}</div><div style={{fontSize:11,color:"#fbbf24",fontWeight:700}}>+{m.xp}XP +{m.coins}🪙</div></div>
                    <div style={{color:"rgba(255,255,255,0.6)",fontSize:12,marginBottom:8}}>{m.desc}</div>
                    <ProgressBar pct={pct} color={m.done?"#22c55e":bars[i]}/>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:4}}>{m.progress}/{m.target}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* News teaser on dashboard */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontWeight:800,fontSize:16}}>📰 Latest Headlines</div>
            <button onClick={()=>setTab("news")} style={{background:"none",border:"none",color:"#a78bfa",fontWeight:700,fontSize:13,cursor:"pointer"}}>See all →</button>
          </div>
          <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
            {newsArticles.slice(0,4).map(a=>(
              <div key={a.id} onClick={()=>{setTab("news");handleReadArticle(a);}} style={{minWidth:200,background:a.color,borderRadius:16,padding:14,cursor:"pointer",border:"1px solid rgba(255,255,255,0.1)",flexShrink:0}}>
                <div style={{fontSize:28,marginBottom:6}}>{a.emoji}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginBottom:4}}>{a.source} • {a.time}</div>
                <div style={{fontWeight:700,fontSize:12,lineHeight:1.35}}>{a.headline.slice(0,55)}...</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontWeight:800,marginBottom:10,fontSize:16}}>📚 Learn &amp; Earn</div>
          <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
            {LESSONS.map((l,i)=>(
              <button key={i} onClick={()=>setLessonOpen(i)} style={{minWidth:130,padding:"14px 12px",borderRadius:16,border:"1px solid rgba(16,185,129,0.3)",background:"linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.1))",color:"#fff",cursor:"pointer",textAlign:"left"}}>
                <div style={{fontSize:24,marginBottom:6}}>{l.icon}</div>
                <div style={{fontWeight:700,fontSize:12,lineHeight:1.3}}>{l.title}</div>
                <div style={{marginTop:6,fontSize:11,color:"#6ee7b7",fontWeight:600}}>+10 XP</div>
              </button>
            ))}
          </div>
        </div>
        {user.transactions.length>0&&(
          <Card>
            <div style={{fontWeight:800,marginBottom:10,fontSize:15}}>Recent Trades</div>
            {user.transactions.slice(0,4).map((t,i)=>(
              <div key={t.id||i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.06)":"none"}}>
                <div><span style={{fontWeight:700}}>{t.ticker}</span><span style={{color:"#a78bfa",fontSize:12,marginLeft:8}}>{t.type==="buy"?"Bought":"Sold"} {t.qty}</span></div>
                <div style={{color:t.type==="buy"?"#f87171":"#4ade80",fontWeight:700}}>{t.type==="buy"?"-":"+"}${(t.price*t.qty).toFixed(2)}</div>
              </div>
            ))}
          </Card>
        )}
      </div>
    );
  }

  // ── MARKET ───────────────────────────────────────────────────────────────
  function renderMarket(){
    return(
      <div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search stocks..."
          style={{width:"100%",padding:"12px 16px",borderRadius:14,border:"2px solid rgba(167,139,250,0.2)",background:"rgba(255,255,255,0.05)",color:"#fff",fontSize:15,marginBottom:14}}/>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(s=>{
            const pos=s.change>=0;const inWatch=user.watchlist.includes(s.ticker);
            const relNews=newsArticles.filter(a=>a.ticker===s.ticker);
            return(
              <div key={s.ticker}>
                <div onClick={()=>handleViewStock(s.ticker)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:18,padding:"13px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontWeight:900,fontSize:14}}>{s.ticker}</span>
                      <span style={{fontSize:9,background:"rgba(255,255,255,0.08)",padding:"2px 6px",borderRadius:6,color:"#a78bfa"}}>{s.sector}</span>
                      <button onClick={e=>{e.stopPropagation();setUser(u=>({...u,watchlist:inWatch?u.watchlist.filter(x=>x!==s.ticker):[...u.watchlist,s.ticker]}));}}
                        style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:0,marginLeft:2}}>{inWatch?"⭐":"☆"}</button>
                    </div>
                    <div style={{color:"#a78bfa",fontSize:11}}>{s.name}</div>
                    {relNews.length>0&&<div style={{fontSize:10,color:"#fbbf24",marginTop:2}}>📰 {relNews.length} news article{relNews.length>1?"s":""}</div>}
                  </div>
                  <Sparkline points={s.sparkline} positive={pos}/>
                  <div style={{textAlign:"right",minWidth:65}}>
                    <div style={{fontWeight:800,fontSize:14}}>${s.price.toFixed(2)}</div>
                    <div style={{color:pos?"#4ade80":"#f87171",fontWeight:700,fontSize:12}}>{pos?"▲":"▼"}{Math.abs(s.change).toFixed(2)}%</div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();setTradeStock(s);setTradeMode("buy");setTradeQty(1);}}
                    style={{padding:"8px 12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:12}}>Trade</button>
                </div>
                {relNews.length>0&&(
                  <div style={{marginLeft:12,marginTop:4,display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
                    {relNews.map(a=>(
                      <div key={a.id} onClick={()=>{setTab("news");handleReadArticle(a);}} style={{minWidth:180,background:a.color,borderRadius:12,padding:"8px 12px",cursor:"pointer",border:"1px solid rgba(255,255,255,0.08)",flexShrink:0}}>
                        <div style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>{a.source}</div>
                        <div style={{fontWeight:700,fontSize:11,lineHeight:1.3,marginTop:2}}>{a.headline.slice(0,60)}...</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── PORTFOLIO ────────────────────────────────────────────────────────────
  function renderPortfolio(){
    const entries=Object.entries(user.holdings);
    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card style={{background:"linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2))"}}>
          <div style={{fontSize:13,color:"#c4b5fd"}}>Portfolio Value</div>
          <div style={{fontSize:32,fontWeight:900,letterSpacing:-1}}>${pv.toFixed(2)}</div>
          <div style={{display:"flex",gap:20,marginTop:10}}>
            {[["Cash","$"+user.cash.toFixed(0)],["Invested","$"+(pv-user.cash).toFixed(0)],["Return",(retPos?"+":"")+ret+"%"]].map(([k,v])=>(
              <div key={k}><div style={{fontSize:11,color:"#a78bfa"}}>{k}</div><div style={{fontWeight:700,color:k==="Return"?(retPos?"#4ade80":"#f87171"):"#fff"}}>{v}</div></div>
            ))}
          </div>
        </Card>
        <div style={{fontWeight:800,fontSize:16}}>📦 Holdings</div>
        {entries.length===0&&<div style={{textAlign:"center",padding:40,color:"#a78bfa"}}><div style={{fontSize:44,marginBottom:10}}>📭</div><div style={{fontWeight:700}}>No holdings yet!</div><div style={{fontSize:13,marginTop:4}}>Head to Market to make your first trade</div></div>}
        {entries.map(([ticker,qty])=>{
          const s=stocks.find(x=>x.ticker===ticker);if(!s)return null;
          return(
            <div key={ticker} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:16,padding:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:800}}>{ticker}</div><div style={{color:"#a78bfa",fontSize:12}}>{qty} shares • {s.sector}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontWeight:800}}>${(s.price*qty).toFixed(2)}</div><div style={{fontSize:12,color:s.change>=0?"#4ade80":"#f87171"}}>{s.change>=0?"▲":"▼"}{Math.abs(s.change).toFixed(2)}%</div></div>
              <button onClick={()=>{setTradeStock(s);setTradeMode("sell");setTradeQty(1);}} style={{padding:"8px 14px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:12}}>Sell</button>
            </div>
          );
        })}
      </div>
    );
  }

  // ── SOCIAL ───────────────────────────────────────────────────────────────
  function renderSocial(){
    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",gap:8}}>
          {["friends","leagues"].map(t=>(
            <button key={t} onClick={()=>setSocialTab(t)} style={{flex:1,padding:"10px 0",borderRadius:12,border:"none",background:socialTab===t?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,0.07)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",textTransform:"capitalize"}}>{t==="friends"?"👥 Friends":"🏆 Leagues"}</button>
          ))}
        </div>
        {socialTab==="friends"&&(
          <>
            <div style={{fontWeight:800,fontSize:16}}>Your Squad</div>
            {SEED_FRIENDS.filter(f=>user.friends.includes(f.id)).map(f=>(
              <div key={f.id} onClick={()=>setSelectedFriend(f)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:18,padding:16,display:"flex",alignItems:"center",gap:14,cursor:"pointer"}}>
                <div style={{fontSize:40}}>{f.avatar}</div>
                <div style={{flex:1}}><div style={{fontWeight:800,fontSize:15}}>{f.name}</div><div style={{color:"#a78bfa",fontSize:12}}>Level {f.level} Investor</div><div style={{marginTop:6}}><XPBar xp={f.level*60} level={f.level}/></div></div>
                <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:18,color:f.ret>=0?"#4ade80":"#f87171"}}>{f.ret>=0?"+":""}{f.ret}%</div><div style={{fontSize:11,color:"#a78bfa"}}>return</div></div>
              </div>
            ))}
          </>
        )}
        {socialTab==="leagues"&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontWeight:800,fontSize:16}}>Your Leagues</div>
              <button onClick={()=>setLeagueModal(true)} style={{padding:"8px 14px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#f59e0b,#ef4444)",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>+ Create</button>
            </div>
            {user.leagues.map((lg,i)=>{
              const members=[{name:user.name,avatar:avatarObj.icon,ret:parseFloat(ret)},...SEED_FRIENDS.filter(f=>lg.members.includes(f.id)).map(f=>({name:f.name,avatar:f.avatar,ret:f.ret}))].sort((a,b)=>b.ret-a.ret);
              return(
                <Card key={lg.id} style={{padding:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div><div style={{fontWeight:900,fontSize:16}}>🏆 {lg.name}</div><div style={{color:"#a78bfa",fontSize:12}}>{lg.members.length} members</div></div>
                    <div style={{fontSize:28}}>{i===0?"🥇":"🎖️"}</div>
                  </div>
                  {members.slice(0,4).map((m,j)=>{
                    const isMe=m.name===user.name;const medal=j===0?"🥇":j===1?"🥈":j===2?"🥉":"#"+(j+1);
                    return(
                      <div key={j} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:j<members.length-2?"1px solid rgba(255,255,255,0.06)":"none"}}>
                        <span style={{fontSize:16,minWidth:28}}>{medal}</span>
                        <span style={{fontSize:20}}>{m.avatar}</span>
                        <span style={{flex:1,fontWeight:isMe?800:600,color:isMe?"#a78bfa":"#fff",fontSize:14}}>{m.name}{isMe?" (You)":""}</span>
                        <span style={{fontWeight:800,color:m.ret>=0?"#4ade80":"#f87171",fontSize:14}}>{m.ret>=0?"+":""}{m.ret.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </Card>
              );
            })}
          </>
        )}
      </div>
    );
  }

  // ── SHOP ─────────────────────────────────────────────────────────────────
  function renderShop(){
    const tabs=[{id:"avatars",label:"Avatars",items:AVATARS,ukey:"unlockedAvatars",eq:"avatar"},{id:"themes",label:"Themes",items:THEMES,ukey:"unlockedThemes",eq:"theme"},{id:"frames",label:"Frames",items:FRAMES,ukey:"unlockedFrames",eq:"frame"}];
    const ct=tabs.find(t=>t.id===shopTab);
    function buyItem(item){
      setUser(prev=>{
        const owned=prev[ct.ukey].includes(item.id);
        if(owned){showToast("✅ Equipped "+item.name+"!");return{...prev,[ct.eq]:item.id};}
        if(prev.coins<item.cost){showToast("❌ Not enough coins!");return prev;}
        showToast("🛍️ Unlocked "+item.name+"!");
        return{...prev,coins:prev.coins-item.cost,[ct.ukey]:[...prev[ct.ukey],item.id],[ct.eq]:item.id};
      });
    }
    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card style={{background:"linear-gradient(135deg,rgba(245,158,11,0.2),rgba(239,68,68,0.15))",border:"1px solid rgba(245,158,11,0.4)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontWeight:900,fontSize:18}}>🛍️ Cosmetic Shop</div><div style={{color:"#fbbf24",fontSize:13}}>Unlock &amp; equip exclusive items</div></div>
          <div style={{fontWeight:900,fontSize:22}}>{user.coins} 🪙</div>
        </Card>
        <div style={{display:"flex",gap:8}}>
          {tabs.map(t=><button key={t.id} onClick={()=>setShopTab(t.id)} style={{flex:1,padding:"9px 0",borderRadius:12,border:"none",background:shopTab===t.id?"linear-gradient(135deg,#f59e0b,#ef4444)":"rgba(255,255,255,0.07)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>{t.label}</button>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {ct.items.map(item=>{
            const owned=user[ct.ukey].includes(item.id);const equipped=user[ct.eq]===item.id;
            return(
              <div key={item.id} style={{background:equipped?"linear-gradient(135deg,rgba(99,102,241,0.35),rgba(139,92,246,0.25))":"rgba(255,255,255,0.05)",border:equipped?"2px solid rgba(99,102,241,0.7)":"1px solid rgba(255,255,255,0.09)",borderRadius:18,padding:16,textAlign:"center"}}>
                {shopTab==="avatars"&&<div style={{fontSize:44,marginBottom:8}}>{item.icon}</div>}
                {shopTab==="themes"&&<div style={{width:"100%",height:44,borderRadius:10,background:item.bg,marginBottom:8,border:"1px solid rgba(255,255,255,0.1)"}}/>}
                {shopTab==="frames"&&<div style={{width:48,height:48,borderRadius:"50%",background:"rgba(99,102,241,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,margin:"0 auto 8px",...item.style}}>👤</div>}
                <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{item.name}</div>
                <RarityBadge rarity={item.rarity}/>
                <button onClick={()=>buyItem(item)} style={{marginTop:10,width:"100%",padding:"8px 0",borderRadius:10,border:"none",background:equipped?"#22c55e":owned?"rgba(99,102,241,0.5)":item.cost===0?"#22c55e":"linear-gradient(135deg,#f59e0b,#ef4444)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                  {equipped?"✅ Equipped":owned?"Equip":item.cost===0?"Free":item.cost+" 🪙"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return(
    <div style={{minHeight:"100vh",background:theme.bg,fontFamily:"'Segoe UI',sans-serif",color:"#fff",paddingBottom:80}}>
      <style>{CSS}</style>
      {confetti&&<Confetti/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      {glossaryOpen&&renderGlossary()}

      {missionReward&&(
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"linear-gradient(135deg,#f59e0b,#ef4444)",padding:"28px 36px",borderRadius:24,zIndex:9999,textAlign:"center",boxShadow:"0 8px 60px rgba(245,158,11,0.6)",animation:"popIn 0.4s"}}>
          <div style={{fontSize:50}}>{missionReward.icon}</div>
          <div style={{fontWeight:900,fontSize:20,marginTop:8}}>Mission Complete!</div>
          <div style={{fontWeight:700,color:"rgba(255,255,255,0.9)",marginTop:4}}>{missionReward.title}</div>
          <div style={{marginTop:10,display:"flex",gap:12,justifyContent:"center"}}>
            <span style={{background:"rgba(255,255,255,0.2)",padding:"6px 14px",borderRadius:99,fontWeight:700}}>+{missionReward.xp} XP</span>
            <span style={{background:"rgba(255,255,255,0.2)",padding:"6px 14px",borderRadius:99,fontWeight:700}}>+{missionReward.coins} 🪙</span>
          </div>
        </div>
      )}
      {badgePopup&&(
        <div style={{position:"fixed",top:76,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#312e81,#4c1d95)",padding:"16px 24px",borderRadius:20,zIndex:9999,textAlign:"center",boxShadow:"0 8px 40px rgba(139,92,246,0.6)",animation:"popIn 0.4s",border:"1px solid rgba(167,139,250,0.5)"}}>
          <div style={{fontSize:36}}>{badgePopup.icon}</div>
          <div style={{fontWeight:900,fontSize:16}}>Badge Unlocked!</div>
          <div style={{fontWeight:700,color:"#c4b5fd",fontSize:13}}>{badgePopup.name}</div>
          <RarityBadge rarity={badgePopup.rarity}/>
        </div>
      )}
      {selectedFriend&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:24,padding:28,width:"100%",maxWidth:340,border:"1px solid rgba(255,255,255,0.1)"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:64}}>{selectedFriend.avatar}</div>
              <div style={{fontWeight:900,fontSize:22}}>{selectedFriend.name}</div>
              <div style={{color:"#a78bfa"}}>Level {selectedFriend.level} Investor</div>
              <div style={{fontWeight:900,fontSize:28,color:selectedFriend.ret>=0?"#4ade80":"#f87171",marginTop:8}}>{selectedFriend.ret>=0?"+":""}{selectedFriend.ret}% return</div>
            </div>
            <button onClick={()=>setSelectedFriend(null)} style={{width:"100%",padding:14,borderRadius:14,border:"none",background:"rgba(255,255,255,0.1)",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:15}}>Close</button>
          </div>
        </div>
      )}
      {leagueModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:24,padding:28,width:"100%",maxWidth:340,border:"1px solid rgba(255,255,255,0.1)"}}>
            <div style={{fontWeight:900,fontSize:20,marginBottom:6}}>🏆 Create a League</div>
            <div style={{color:"#a78bfa",fontSize:13,marginBottom:20}}>Challenge your friends to a private investing competition!</div>
            <input value={newLeagueName} onChange={e=>setNewLeagueName(e.target.value)} placeholder="League name..."
              style={{width:"100%",padding:"13px 16px",borderRadius:13,border:"2px solid rgba(167,139,250,0.3)",background:"rgba(255,255,255,0.05)",color:"#fff",fontSize:15,marginBottom:16}}/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setLeagueModal(false)} style={{flex:1,padding:13,borderRadius:13,border:"none",background:"rgba(255,255,255,0.08)",color:"#fff",fontWeight:700,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{if(!newLeagueName.trim())return;setUser(prev=>({...prev,leagues:[...prev.leagues,{id:"l"+Date.now(),name:newLeagueName.trim(),members:["me","f1","f2"],created:Date.now()}],coins:prev.coins+5}));setNewLeagueName("");setLeagueModal(false);showToast("🏆 League created!");}} style={{flex:2,padding:13,borderRadius:13,border:"none",background:"linear-gradient(135deg,#f59e0b,#ef4444)",color:"#fff",fontWeight:800,cursor:"pointer"}}>Create 🚀</button>
            </div>
          </div>
        </div>
      )}
      {tradeStock&&liveTrade&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:24,padding:28,width:"100%",maxWidth:360,border:"1px solid rgba(255,255,255,0.12)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div><div style={{fontWeight:900,fontSize:22}}>{liveTrade.ticker}</div><div style={{color:"#a78bfa",fontSize:13}}>{liveTrade.name}</div></div>
              <div style={{fontWeight:800,fontSize:20}}>${liveTrade.price.toFixed(2)}</div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              {["buy","sell"].map(m=><button key={m} onClick={()=>setTradeMode(m)} style={{flex:1,padding:12,borderRadius:12,border:"none",background:tradeMode===m?(m==="buy"?"#22c55e":"#ef4444"):"rgba(255,255,255,0.08)",color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer",textTransform:"uppercase"}}>{m}</button>)}
            </div>
            <label style={{color:"#a78bfa",fontSize:13,fontWeight:600}}>Quantity</label>
            <input type="number" min="1" value={tradeQty} onChange={e=>setTradeQty(Math.max(1,parseInt(e.target.value)||1))}
              style={{width:"100%",marginTop:6,marginBottom:16,padding:"12px 16px",borderRadius:12,border:"2px solid rgba(167,139,250,0.3)",background:"rgba(255,255,255,0.05)",color:"#fff",fontSize:18,fontWeight:700}}/>
            <div style={{background:"rgba(255,255,255,0.05)",borderRadius:12,padding:14,marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:6}}><span style={{color:"#a78bfa"}}>Total</span><span style={{fontWeight:800}}>${(liveTrade.price*tradeQty).toFixed(2)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:14}}><span style={{color:"#a78bfa"}}>Cash After</span><span style={{fontWeight:800}}>${(user.cash-liveTrade.price*tradeQty*(tradeMode==="buy"?1:-1)).toFixed(2)}</span></div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setTradeStock(null)} style={{flex:1,padding:14,borderRadius:14,border:"none",background:"rgba(255,255,255,0.08)",color:"#fff",fontWeight:700,cursor:"pointer"}}>Cancel</button>
              <button onClick={handleTrade} style={{flex:2,padding:14,borderRadius:14,border:"none",background:tradeMode==="buy"?"linear-gradient(135deg,#22c55e,#16a34a)":"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:15}}>
                {tradeMode==="buy"?"✅ Confirm Buy":"💸 Confirm Sell"}
              </button>
            </div>
          </div>
        </div>
      )}
      {lessonOpen!==null&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"linear-gradient(135deg,#064e3b,#065f46)",borderRadius:24,padding:28,width:"100%",maxWidth:360,border:"1px solid rgba(255,255,255,0.1)"}}>
            <div style={{fontSize:48,textAlign:"center",marginBottom:12}}>{LESSONS[lessonOpen].icon}</div>
            <h3 style={{textAlign:"center",margin:"0 0 14px",fontSize:20}}>{LESSONS[lessonOpen].title}</h3>
            <p style={{color:"#6ee7b7",lineHeight:1.75,fontSize:15}}>{LESSONS[lessonOpen].content}</p>
            <button onClick={()=>{setLessonOpen(null);setUser(u=>({...u,xp:u.xp+10,coins:u.coins+5,level:Math.floor((u.xp+10)/100)+1}));showToast("+10 XP +5🪙 earned!");}}
              style={{width:"100%",marginTop:20,padding:14,borderRadius:14,border:"none",background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",fontWeight:800,fontSize:16,cursor:"pointer"}}>
              Got it! +10 XP 🎉
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{padding:"16px 16px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:30,...frameObj.style,display:"inline-flex",alignItems:"center",justifyContent:"center",width:42,height:42,borderRadius:"50%",background:"rgba(99,102,241,0.2)"}}>{avatarObj.icon}</div>
          <div><div style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>Welcome back,</div><div style={{fontWeight:900,fontSize:17}}>{user.name}</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>Lv.{user.level} • {user.coins}🪙</div>
            <div style={{fontWeight:800,color:theme.accent,fontSize:13}}>⭐ {user.xp} XP</div>
          </div>
          <button onClick={handleLogout} title="Log out" style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"rgba(255,255,255,0.5)",fontSize:16,padding:"6px 10px",cursor:"pointer"}}>↩</button>
        </div>
      </div>
      {saving&&<div style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.3)",padding:"4px 0"}}>💾 Saving…</div>}

      <div style={{padding:"12px 14px 0"}}>
        {tab==="dashboard"&&renderDashboard()}
        {tab==="market"&&renderMarket()}
        {tab==="portfolio"&&renderPortfolio()}
        {tab==="news"&&renderNews()}
        {tab==="social"&&renderSocial()}
        {tab==="shop"&&renderShop()}
      </div>

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(10,8,30,0.97)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",padding:"6px 0 8px"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);if(t.id!=="news")setOpenArticle(null);}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,border:"none",background:"none",color:tab===t.id?theme.accent:"#4b5563",cursor:"pointer",padding:"4px 0",transition:"color 0.2s"}}>
            <span style={{fontSize:tab===t.id?24:20,transition:"font-size 0.2s"}}>{t.icon}</span>
            <span style={{fontSize:9,fontWeight:tab===t.id?800:500}}>{t.label}</span>
          </button>
        ))}
      </div>
      <Analytics />
    </div>
  );
}
