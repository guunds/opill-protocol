// ═══════════════════════════════════════════════════════════════
//  OPiLL Protocol — UI Controller v2 (fixed navigation)
// ═══════════════════════════════════════════════════════════════
'use strict';

var SECTION_META = {
  'home':{'title':'Dashboard Overview','icon':'🏠'},
  'leaderboard':{'title':'Leaderboard','icon':'🏆'},
  'history':{'title':'Transaction History','icon':'📋'},
  'staking':{'title':'Staking & Auto-Compound','icon':'⚡'},
  'vault':{'title':'Revenue Vault','icon':'🏦'},
  'lending':{'title':'Lending Protocol','icon':'💸'},
  'launchpad':{'title':'Launchpad','icon':'🚀'},
  'airdrop-points':{'title':'Airdrop Points','icon':'⭐'},
  'airdrop-claim':{'title':'Airdrop Claim','icon':'🎁'},
  'multisig':{'title':'Multisig Wallet','icon':'🔐'},
  'faucet':{'title':'Faucet','icon':'🚰'},
  'nft':{'title':'NFT Marketplace','icon':'🖼️'},
  'dao':{'title':'DAO Governance','icon':'🗳️'},
  'raffle':{'title':'Raffle / Lottery','icon':'🎰'},
  'prediction':{'title':'Prediction Market','icon':'🔮'},
  'yield':{'title':'Yield Aggregator','icon':'🌾'}
};

// ── GOTO: main navigation function ──
function goto(id, navEl) {
  try {
    document.querySelectorAll('.section').forEach(function(s){ s.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
    var sec = document.getElementById('sec-' + id);
    if(sec) sec.classList.add('active');
    if(navEl && navEl.classList) {
      navEl.classList.add('active');
    } else {
      document.querySelectorAll('.nav-item').forEach(function(item){
        var oc = item.getAttribute('onclick')||'';
        if(oc.indexOf("'"+id+"'")!==-1) item.classList.add('active');
      });
    }
    var meta = SECTION_META[id]||{title:id,icon:'●'};
    var t=document.getElementById('topbar-title'), ic=document.getElementById('topbar-icon'), br=document.getElementById('breadcrumb-text');
    if(t) t.textContent=meta.title;
    if(ic) ic.textContent=meta.icon;
    if(br) br.textContent=meta.title;
    var content=document.querySelector('.content');
    if(content) content.scrollTop=0;
    if(id==='faucet' && window.FaucetModule) FaucetModule.updateClaimButton(window.Wallet&&window.Wallet.state?window.Wallet.state.address:null);
  } catch(e){ console.error('[goto]',e); }
}

// ── WALLET MODAL ──
function openWalletModal(){
  var m=document.getElementById('wallet-modal-overlay');
  if(m) m.style.display='flex';
  _detectWallets(); _clearMsg();
}
function closeWalletModal(){
  var m=document.getElementById('wallet-modal-overlay');
  if(m) m.style.display='none';
}
function _detectWallets(){
  if(!window.Wallet) return;
  var inst=Wallet.detectInstalled();
  Object.keys(inst).forEach(function(t){
    var el=document.getElementById(t+'-status');
    if(!el) return;
    el.textContent=inst[t]?'✓ Installed':'Not installed';
    el.style.color=inst[t]?'#00ff88':'rgba(90,96,128,0.8)';
  });
}
function _clearMsg(){
  var e=document.getElementById('wallet-error'),l=document.getElementById('wallet-loading');
  if(e){e.style.display='none';e.textContent='';e.onclick=null;}
  if(l) l.style.display='none';
}
function _showLoad(msg){
  var l=document.getElementById('wallet-loading'),t=document.getElementById('wallet-loading-text');
  if(l) l.style.display='block'; if(t) t.textContent=msg||'Connecting...';
}
function _showErr(msg,url){
  var l=document.getElementById('wallet-loading'),e=document.getElementById('wallet-error');
  if(l) l.style.display='none';
  if(!e) return;
  e.style.display='block'; e.textContent='⚠️ '+msg;
  if(url){e.style.cursor='pointer';e.textContent+=' → Click to install';e.onclick=function(){window.open(url,'_blank');};}
}

async function handleConnect(type){
  if(!window.Wallet){_showErr('Wallet module not loaded');return;}
  _clearMsg();
  var meta=Wallet.META[type]||{};
  _showLoad('Connecting to '+(meta.name||type)+'...');
  try{
    // Step 1: Connect wallet (get address)
    var r=await Wallet.connect(type);

    // Step 2: Request signature confirmation
    _showLoad('📝 Please sign the confirmation message in your wallet...');
    var sigMsg='OPiLL Protocol — Wallet Authentication\n\nAddress: '+r.address+'\nTimestamp: '+Date.now()+'\n\nBy signing this message, you confirm ownership of this wallet and agree to use OPiLL Protocol. This action does not cost any fees.';
    try {
      var sig = await Wallet.signMessage(sigMsg);
      if(!sig) throw new Error('Signature was empty');
    } catch(sigErr) {
      // If user rejects signature, disconnect and show error
      Wallet.disconnect();
      var sigMsg2 = sigErr.message||'Signature rejected';
      if(/reject|cancel|denied/i.test(sigMsg2)) _showErr('Signature rejected. Please sign to verify wallet ownership.');
      else _showErr('Signature required to connect: '+sigMsg2);
      return;
    }

    // Step 3: Connected + verified
    closeWalletModal();
    _onConnected(r.address);
    showToast('✅ '+(meta.name||type)+' connected & verified!','success');
  }catch(err){
    var msg=err.message||'Connection failed';
    if(err.notInstalled) _showErr((meta.name||type)+' not installed',err.installUrl);
    else if(/reject|cancel|denied/i.test(msg)) _showErr('Connection rejected by user');
    else _showErr(msg);
  }
}

function disconnectWallet(){
  if(window.Wallet) Wallet.disconnect();
  _onDisconnected();
  // Close dropdown if open
  closeWalletDropdown();
}

// ── WALLET DROPDOWN ──
function toggleWalletDropdown(){
  var dd = document.getElementById('wallet-dropdown');
  if(!dd) return;
  var isOpen = dd.style.display === 'block';
  if(isOpen){ closeWalletDropdown(); } else { openWalletDropdown(); }
}
function openWalletDropdown(){
  var dd = document.getElementById('wallet-dropdown');
  if(dd){ dd.style.display='block'; }
  // Close on outside click
  setTimeout(function(){
    document.addEventListener('click', _closeDropdownOutside, {once:true});
  }, 0);
}
function closeWalletDropdown(){
  var dd = document.getElementById('wallet-dropdown');
  if(dd){ dd.style.display='none'; }
}
function _closeDropdownOutside(e){
  var btn = document.getElementById('wallet-info-btn');
  var dd = document.getElementById('wallet-dropdown');
  if(btn && btn.contains(e.target)) return;
  if(dd && dd.contains(e.target)) return;
  closeWalletDropdown();
}

// ── LOGOUT WITH CONFIRMATION ──
function openLogoutConfirm(){
  closeWalletDropdown();
  var ov = document.getElementById('logout-confirm-overlay');
  if(ov) ov.style.display='flex';
}
function closeLogoutConfirm(){
  var ov = document.getElementById('logout-confirm-overlay');
  if(ov) ov.style.display='none';
}
function confirmLogout(){
  closeLogoutConfirm();
  disconnectWallet();
  showToast('👋 Logged out successfully','info');
}

function _onConnected(addr){
  var cb=document.getElementById('connect-wallet-btn'),
      badge=document.getElementById('connected-badge'),
      info=document.getElementById('wallet-info-btn'),
      addrEl=document.getElementById('wallet-address-display'),
      iconEl=document.getElementById('wallet-icon-el'),
      ddAddr=document.getElementById('wallet-dropdown-addr'),
      logoutAddr=document.getElementById('logout-confirm-addr');
  if(cb) cb.style.display='none';
  if(badge) badge.style.display='flex';
  if(info) info.style.display='flex';
  if(addrEl) addrEl.textContent=_short(addr);
  if(ddAddr) ddAddr.textContent=addr||'--';
  if(logoutAddr) logoutAddr.textContent=addr||'--';
  if(iconEl && window.Wallet){
    var icons={
      opwallet:'<svg width="18" height="18" viewBox="0 0 100 100" fill="none"><defs><linearGradient id="ti1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#ff4400"/><stop offset="100%" stop-color="#f7931a"/></linearGradient></defs><circle cx="44" cy="58" r="30" fill="none" stroke="white" stroke-width="11" stroke-dasharray="145 48" stroke-dashoffset="-8" stroke-linecap="round"/><circle cx="76" cy="26" r="14" fill="none" stroke="url(#ti1)" stroke-width="9"/><path d="M65 37 Q59 48 60 58" fill="none" stroke="url(#ti1)" stroke-width="9" stroke-linecap="round"/></svg>',
      unisat:'<svg width="18" height="18" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" fill="#f7931a"/><path d="M18 15 L18 58 Q18 85 50 85 Q82 85 82 58 L82 15 L65 15 L65 58 Q65 68 50 68 Q35 68 35 58 L35 15 Z" fill="white"/></svg>',
      xverse:'<svg width="18" height="18" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" fill="#1a1033"/><line x1="16" y1="16" x2="84" y2="84" stroke="#EE7B30" stroke-width="15" stroke-linecap="round"/><line x1="84" y1="16" x2="16" y2="84" stroke="#EE7B30" stroke-width="15" stroke-linecap="round"/></svg>',
      okx:'<svg width="18" height="18" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" fill="#000"/><path d="M4 50C4 24.6 24.6 4 50 4C75.4 4 96 24.6 96 50C96 75.4 75.4 96 50 96C24.6 96 4 75.4 4 50Z" stroke="white" stroke-width="9" fill="none"/><circle cx="50" cy="50" r="18" fill="white"/></svg>'
    };
    iconEl.innerHTML=icons[Wallet.state.type]||'◎';
  }
  if(window.Wallet){
    Wallet.on('balance',function(d){var e=document.getElementById('wallet-balance-display');if(e)e.textContent=d.btc+' BTC';});
    Wallet.on('accountChanged',function(d){if(addrEl)addrEl.textContent=_short(d.address);showToast('🔄 '+_short(d.address),'info');});
    Wallet.on('disconnect',function(){_onDisconnected();});
  }
  if(window.FaucetModule) FaucetModule.updateClaimButton(addr);
}

function _onDisconnected(){
  var cb=document.getElementById('connect-wallet-btn'),
      badge=document.getElementById('connected-badge'),
      info=document.getElementById('wallet-info-btn'),
      addrEl=document.getElementById('wallet-address-display'),
      balEl=document.getElementById('wallet-balance-display');
  if(cb) cb.style.display='flex';
  if(badge) badge.style.display='none';
  if(info) info.style.display='none';
  if(addrEl) addrEl.textContent='--';
  if(balEl) balEl.textContent='-- BTC';
  if(window.FaucetModule) FaucetModule.updateClaimButton(null);
  showToast('👋 Wallet disconnected','info');
}

function _short(a){return(!a||a.length<=14)?a||'--':a.slice(0,7)+'...'+a.slice(-6);}

// ── TOAST ──
var _tt=null;
function showToast(msg,type){
  type=type||'success';
  var el=document.getElementById('wallet-toast');
  if(!el){
    el=document.createElement('div'); el.id='wallet-toast';
    Object.assign(el.style,{display:'none',position:'fixed',bottom:'28px',right:'28px',zIndex:'10000',
      background:'#0c1322',borderRadius:'12px',padding:'14px 20px',fontSize:'13px',
      boxShadow:'0 4px 30px rgba(0,0,0,0.6)',maxWidth:'360px',fontFamily:'"DM Mono",monospace',
      transition:'opacity 0.3s',border:'1px solid'});
    document.body.appendChild(el);
  }
  var c={success:{b:'rgba(0,255,136,0.4)',t:'#00ff88'},error:{b:'rgba(255,68,102,0.4)',t:'#ff4466'},info:{b:'rgba(247,147,26,0.4)',t:'#f7931a'}}[type]||{b:'rgba(247,147,26,0.4)',t:'#f7931a'};
  el.style.borderColor=c.b; el.style.color=c.t; el.textContent=msg;
  el.style.display='block'; el.style.opacity='1';
  clearTimeout(_tt); _tt=setTimeout(function(){el.style.opacity='0';setTimeout(function(){el.style.display='none';},300);},4000);
}

// ── HELPERS ──
function selectTier(el){document.querySelectorAll('.tier-card').forEach(function(c){c.classList.remove('featured');});if(el)el.classList.add('featured');}
function tabSwitch(btn){if(!btn||!btn.closest)return;var g=btn.closest('.tab-group');if(!g)return;g.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');}
function updateRoute(sel){
  var routes={btc:{path:'BTC Vault → OPN Stake 90D → LP Vault',apy:'41.2%'},usdt:{path:'USDT Lending → Revenue Vault → Stablecoin Pool',apy:'22.8%'},opn:{path:'365D Stake → Governance Rewards → LP Boost',apy:'34.6%'}};
  var r=routes[sel?sel.value:'btc']||routes.btc;
  var p=document.getElementById('route-path'),a=document.getElementById('route-apy');
  if(p)p.textContent=r.path; if(a)a.textContent=r.apy;
}

function _countdown(){
  var h=14,m=32,s=9,hE=document.getElementById('cd-h'),mE=document.getElementById('cd-m'),sE=document.getElementById('cd-s');
  if(!hE)return;
  setInterval(function(){s--;if(s<0){s=59;m--;}if(m<0){m=59;h--;}if(h<0){h=0;m=0;s=0;}
    hE.textContent=String(h).padStart(2,'0');mE.textContent=String(m).padStart(2,'0');sE.textContent=String(s).padStart(2,'0');},1000);
}
function _slider(){
  var sl=document.querySelector('input[type=range]');
  if(!sl)return;
  sl.addEventListener('input',function(){
    var v=parseInt(this.value,10),hf=v===0?'∞':(100/Math.max(v,1)).toFixed(2);
    var e=document.querySelector('.health-factor');
    if(!e)return;
    e.textContent=hf;
    var c=v<60?'var(--green)':v<80?'var(--orange)':'var(--red)';
    e.style.color=e.style.borderColor=c;
  });
}
var _fd=[
  {icon:'⚡',color:'#00ff88',text:'staked',amount:'1,200 OPN',ac:'#f7931a'},
  {icon:'🏦',color:'#f7931a',text:'deposited',amount:'0.24 BTC',ac:'#00e5ff'},
  {icon:'🎯',color:'#00e5ff',text:'claimed',amount:'+342 OPN',ac:'#00ff88'},
  {icon:'🖼️',color:'#b43cff',text:'sold NFT for',amount:'0.31 BTC',ac:'#f7931a'},
  {icon:'🗳️',color:'#00ff88',text:'voted on',amount:'OIP-24',ac:'#00e5ff'},
  {icon:'💸',color:'#00e5ff',text:'borrowed',amount:'5,000 USDT',ac:'#e8eaf0'},
  {icon:'🌾',color:'#00ff88',text:'harvested',amount:'+128 OPN',ac:'#00ff88'}
];
function _feed(){
  var feed=document.getElementById('activity-feed');
  if(!feed)return;
  setInterval(function(){
    var a=_fd[Math.floor(Math.random()*_fd.length)];
    var c='0123456789abcdef',ra=function(n){return Array.from({length:n},function(){return c[Math.floor(Math.random()*c.length)];}).join('');};
    var addr='bc1q'+ra(4)+'…'+ra(4);
    var row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface2);border-radius:8px;font-size:11px;opacity:0;transition:opacity 0.5s';
    row.innerHTML='<span style="color:'+a.color+';font-size:16px">'+a.icon+'</span><div style="flex:1"><span style="color:var(--text)">'+addr+'</span> '+a.text+' <span style="color:'+a.ac+'">'+a.amount+'</span></div><span style="color:var(--text-muted)">just now</span>';
    feed.prepend(row);
    requestAnimationFrame(function(){row.style.opacity='1';});
    while(feed.children.length>5) feed.removeChild(feed.lastChild);
  },3500+Math.random()*2500);
}

function _init(){
  // Modal close on overlay click
  var modal=document.getElementById('wallet-modal-overlay');
  if(modal) modal.addEventListener('click',function(e){if(e.target===modal)closeWalletModal();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeWalletModal();});

  _countdown(); _slider(); _feed();

  // Block height
  if(window.OPNet){
    OPNet.getBlockInfo().then(function(info){
      if(!info||!info.blockHeight)return;
      document.querySelectorAll('.network-badge span').forEach(function(el){
        if(el.textContent&&el.textContent.indexOf('Block')!==-1)
          el.textContent='Block #'+info.blockHeight.toLocaleString();
      });
    }).catch(function(){});
    setInterval(function(){
      OPNet.getBlockInfo().then(function(info){
        if(!info||!info.blockHeight)return;
        document.querySelectorAll('.network-badge span').forEach(function(el){
          if(el.textContent&&el.textContent.indexOf('Block')!==-1)
            el.textContent='Block #'+info.blockHeight.toLocaleString();
        });
      }).catch(function(){});
    },30000);
  }

  // Auto-reconnect
  if(window.Wallet){
    Wallet.tryAutoReconnect().then(function(ok){
      if(ok) _onConnected(Wallet.state.address);
    }).catch(function(){});
  }

  // Faucet
  if(window.FaucetModule){ FaucetModule.init(); FaucetModule.updateClaimButton(null); }

  // Prices
  if(window.PriceModule){
    PriceModule.bindDOM(); PriceModule.start();
    PriceModule.subscribe(function(d){
      document.querySelectorAll('.ticker-btc-price').forEach(function(el){
        if(d.btc&&d.btc.price>0)el.textContent='$'+Math.round(d.btc.price).toLocaleString('en-US');
      });
      document.querySelectorAll('.ticker-btc-change').forEach(function(el){
        if(d.btc&&d.btc.change24h!==0){var chg=d.btc.change24h;el.textContent=(chg>=0?'▲ +':'▼ ')+Math.abs(chg).toFixed(1)+'%';el.style.color=chg>=0?'#00ff88':'#ff4466';}
      });
    });
  }

  console.log('[OPiLL] Ready ✅');
}

// ── GLOBAL EXPORTS ──
window.goto=goto;
window.openWalletModal=openWalletModal;
window.closeWalletModal=closeWalletModal;
window.handleConnect=handleConnect;
window.disconnectWallet=disconnectWallet;
window.toggleWalletDropdown=toggleWalletDropdown;
window.openWalletDropdown=openWalletDropdown;
window.closeWalletDropdown=closeWalletDropdown;
window.openLogoutConfirm=openLogoutConfirm;
window.closeLogoutConfirm=closeLogoutConfirm;
window.confirmLogout=confirmLogout;
window.selectTier=selectTier;
window.tabSwitch=tabSwitch;
window.updateRoute=updateRoute;
window.showToast=showToast;

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',_init);
}else{
  _init();
}
