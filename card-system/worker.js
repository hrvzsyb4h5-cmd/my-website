// ============================================================
// 七宗罪倾向测试 - 自建发卡系统
// 基于 Cloudflare Workers + KV
// 零服务器成本 · 全自动发码 · 独立可控
// ============================================================

// === 购买页面 HTML ===
const PURCHASE_HTML = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">\n<title>七宗罪倾向测试 - 购买</title>\n<style>\n:root{--bg:#0a0a14;--surface:rgba(255,255,255,0.06);--border:rgba(230,57,70,0.3);--text:#e0e0e0;--muted:#777;--accent:#e63946;--gold:#d4af37}\n*{box-sizing:border-box;margin:0;padding:0}\nbody{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;min-height:100vh}\n.wrap{max-width:460px;margin:0 auto;padding:1.5rem;min-height:100vh;display:flex;flex-direction:column;justify-content:center}\n.card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:2rem 1.5rem;text-align:center;backdrop-filter:blur(10px)}\n.card h1{font-size:1.4rem;font-weight:800;color:var(--accent);margin-bottom:0.3rem}\n.card .desc{font-size:0.82rem;color:var(--muted);line-height:1.6;margin-bottom:1rem}\n.price{font-size:2.4rem;font-weight:800;color:var(--gold);margin:0.8rem 0}\n.price small{font-size:0.9rem;font-weight:400}\n.btn{background:linear-gradient(135deg,var(--accent),#c1121f);color:#fff;border:none;padding:0.9rem 2rem;border-radius:50px;font-size:1rem;font-weight:700;cursor:pointer;width:100%;transition:opacity .2s}\n.btn:hover{opacity:.88}\n.btn:disabled{opacity:.4;cursor:not-allowed}\n.btn-outline{background:transparent;border:1px solid var(--border);color:var(--text);margin-top:0.6rem}\n.pay-section{display:none;margin-top:1.2rem;text-align:left}\n.pay-section.active{display:block}\n.pay-section h3{font-size:0.9rem;color:var(--accent);margin-bottom:0.6rem;text-align:center}\n.qr-row{display:flex;gap:0.8rem;justify-content:center;margin:0.8rem 0}\n.qr-item{text-align:center;flex:1}\n.qr-item img{width:130px;height:130px;border-radius:8px;background:#fff;padding:4px;display:block;margin:0 auto}\n.qr-item p{font-size:0.75rem;color:var(--muted);margin-top:0.3rem}\n.qr-placeholder{width:130px;height:130px;border-radius:8px;border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:0.7rem;margin:0 auto}\n.form-group{margin:0.8rem 0}\n.form-group label{display:block;font-size:0.8rem;color:var(--muted);margin-bottom:0.3rem}\n.form-group input{width:100%;padding:0.7rem;border-radius:8px;border:1px solid var(--border);background:rgba(0,0,0,0.3);color:var(--text);font-size:0.9rem}\n.form-group input:focus{outline:none;border-color:var(--accent)}\n.result-box{display:none;margin-top:1.2rem;padding:1.2rem;background:var(--surface);border-radius:12px;text-align:center}\n.result-box.active{display:block}\n.order-id{font-size:0.8rem;color:var(--muted);margin-bottom:0.5rem}\n.order-id span{color:var(--accent);font-weight:600;user-select:all}\n.spinner{width:32px;height:32px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;margin:0.5rem auto;animation:spin 1s linear infinite}\n@keyframes spin{to{transform:rotate(360deg)}}\n.code-box{font-size:1.3rem;font-weight:800;color:var(--gold);letter-spacing:0.08em;padding:0.8rem;background:rgba(212,175,55,0.1);border:1px dashed var(--gold);border-radius:8px;margin:0.6rem 0;user-select:all}\n.test-link{display:inline-block;margin-top:0.6rem;padding:0.6rem 1.5rem;background:var(--accent);color:#fff;border-radius:50px;font-size:0.85rem;font-weight:600;text-decoration:none}\n.err-msg{color:#ff6b6b;font-size:0.82rem;margin-top:0.4rem}\n.tip{font-size:0.72rem;color:var(--muted);margin-top:0.8rem;line-height:1.5}\n</style>\n</head>\n<body>\n<div class="wrap">\n<div class="card" id="productCard">\n<h1 id="pName">七宗罪倾向测试</h1>\n<p class="desc" id="pDesc">42道精选题目 · 7大罪宗深度分析 · 动态雷达图结果</p>\n<div class="price"><small>¥</small><span id="pPrice">6.90</span></div>\n<button class="btn" onclick="showPay()">立即购买</button>\n<p class="tip">支付后自动发送访问码 · 每码限本人使用一次</p>\n</div>\n\n<div class="pay-section" id="paySection">\n<h3>扫码支付</h3>\n<div class="qr-row" id="qrRow"></div>\n<p class="tip" style="text-align:center">请扫描上方二维码支付 <strong style="color:var(--gold)" id="payPrice">¥6.90</strong>，支付完成后填写下方信息</p>\n<div class="form-group">\n<label>支付金额（元）</label>\n<input type="text" id="payAmount" placeholder="如：6.90" value="">\n</div>\n<div class="form-group">\n<label>备注 / 微信昵称（方便核对）</label>\n<input type="text" id="payNote" placeholder="如：小红书用户xxx">\n</div>\n<button class="btn" id="submitBtn" onclick="submitOrder()">已支付，提交订单</button>\n<p class="err-msg" id="submitErr"></p>\n</div>\n\n<div class="result-box" id="resultBox">\n<div id="resultContent"></div>\n</div>\n</div>\n<script>\nvar settings={name:"七宗罪倾向测试",price:"6.90",desc:"42道精选题目",wechatQr:"",alipayQr:"",testUrl:""};\nvar currentOrderId=null;\nvar checkTimer=null;\n\nasync function loadSettings(){\n  try{\n    var r=await fetch("/api/settings");\n    var d=await r.json();\n    if(d.success){\n      settings=d.settings;\n      document.getElementById("pName").textContent=settings.name||"七宗罪倾向测试";\n      document.getElementById("pDesc").textContent=settings.desc||"";\n      document.getElementById("pPrice").textContent=settings.price||"6.90";\n      document.getElementById("payPrice").textContent="¥"+(settings.price||"6.90");\n      document.getElementById("payAmount").value=settings.price||"6.90";\n    }\n  }catch(e){console.log("settings load error",e)}\n}\n\nfunction showPay(){\n  document.getElementById("productCard").style.display="block";\n  document.getElementById("paySection").classList.add("active");\n  var qrRow=document.getElementById("qrRow");\n  qrRow.innerHTML="";\n  if(settings.wechatQr){\n    qrRow.innerHTML+=\'<div class="qr-item"><img src="\'+settings.wechatQr+\'" alt="微信"><p>微信支付</p></div>\';\n  }\n  if(settings.alipayQr){\n    qrRow.innerHTML+=\'<div class="qr-item"><img src="\'+settings.alipayQr+\'" alt="支付宝"><p>支付宝</p></div>\';\n  }\n  if(!settings.wechatQr&&!settings.alipayQr){\n    qrRow.innerHTML=\'<div class="qr-placeholder">请在管理后台上传收款码</div>\';\n  }\n  document.getElementById("paySection").scrollIntoView({behavior:"smooth"});\n}\n\nasync function submitOrder(){\n  var amount=document.getElementById("payAmount").value.trim();\n  var note=document.getElementById("payNote").value.trim();\n  var errEl=document.getElementById("submitErr");\n  var btn=document.getElementById("submitBtn");\n  errEl.textContent="";\n  if(!amount){errEl.textContent="请输入支付金额";return}\n  btn.disabled=true;\n  btn.textContent="提交中...";\n  try{\n    var r=await fetch("/api/order",{\n      method:"POST",\n      headers:{"Content-Type":"application/json"},\n      body:JSON.stringify({amount:amount,buyerNote:note})\n    });\n    var d=await r.json();\n    if(d.success){\n      currentOrderId=d.orderId;\n      showWaiting(d.orderId);\n      startCheckOrder();\n    }else{\n      errEl.textContent=d.error||"提交失败，请重试";\n      btn.disabled=false;\n      btn.textContent="已支付，提交订单";\n    }\n  }catch(e){\n    errEl.textContent="网络错误，请重试";\n    btn.disabled=false;\n    btn.textContent="已支付，提交订单";\n  }\n}\n\nfunction showWaiting(orderId){\n  document.getElementById("paySection").style.display="none";\n  document.getElementById("productCard").style.display="none";\n  var box=document.getElementById("resultBox");\n  box.classList.add("active");\n  document.getElementById("resultContent").innerHTML=\n    \'<div class="order-id">订单号：<span>\'+orderId+\'</span></div>\'+\n    \'<div class="spinner"></div>\'+\n    \'<p style="font-size:0.85rem;color:var(--muted);margin-top:0.5rem">等待卖家确认付款...</p>\'+\n    \'<p class="tip">通常1-5分钟内确认，请耐心等待<br>可截图保存订单号，关闭页面后可用订单号查询</p>\';\n}\n\nfunction startCheckOrder(){\n  if(checkTimer)clearInterval(checkTimer);\n  checkTimer=setInterval(checkOrderStatus,8000);\n  checkOrderStatus();\n}\n\nasync function checkOrderStatus(){\n  if(!currentOrderId)return;\n  try{\n    var r=await fetch("/api/order?id="+currentOrderId);\n    var d=await r.json();\n    if(d.success&&d.order.status==="paid"){\n      clearInterval(checkTimer);\n      showCode(d.order);\n    }\n  }catch(e){}\n}\n\nfunction showCode(order){\n  var box=document.getElementById("resultBox");\n  var html=\'<div class="order-id">订单号：<span>\'+order.id+\'</span></div>\';\n  html+=\'<p style="font-size:0.8rem;color:var(--muted);margin-bottom:0.4rem">付款已确认！您的访问码：</p>\';\n  html+=\'<div class="code-box">\'+order.code+\'</div>\';\n  html+=\'<p class="tip">请复制访问码，点击下方按钮开始测试</p>\';\n  if(settings.testUrl){\n    html+=\'<a href="\'+settings.testUrl+\'" class="test-link" target="_blank">开始测试</a>\';\n  }\n  document.getElementById("resultContent").innerHTML=html;\n}\n\nfunction checkUrlOrder(){\n  var params=new URLSearchParams(window.location.search);\n  var oid=params.get("order");\n  if(oid){\n    currentOrderId=oid;\n    loadSettings().then(function(){\n      document.getElementById("productCard").style.display="none";\n      document.getElementById("paySection").style.display="none";\n      document.getElementById("resultBox").classList.add("active");\n      showWaiting(oid);\n      startCheckOrder();\n    });\n  }else{\n    loadSettings();\n  }\n}\n\ncheckUrlOrder();\n</script>\n</body>\n</html>';

// === 管理后台 HTML ===
const ADMIN_HTML = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1.0">\n<title>发卡系统管理后台</title>\n<style>\n:root{--bg:#f5f5f7;--card:#fff;--ink:#1a1a2e;--muted:#6b7280;--rule:#e5e7eb;--accent:#e63946;--accent2:#2563eb;--green:#16a34a;--orange:#ea580c}\n*{box-sizing:border-box;margin:0;padding:0}\nbody{background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;font-size:14px}\n.login{max-width:360px;margin:80px auto;padding:2rem;background:var(--card);border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);text-align:center}\n.login h1{font-size:1.2rem;margin-bottom:1rem}\n.login input{width:100%;padding:0.7rem;border:1px solid var(--rule);border-radius:8px;font-size:0.9rem;margin-bottom:0.8rem}\n.login button{width:100%;padding:0.7rem;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer}\n.login .err{color:var(--accent);font-size:0.8rem;margin-top:0.4rem}\n.dash{max-width:900px;margin:0 auto;padding:1rem}\n.tabs{display:flex;gap:0.5rem;margin-bottom:1rem;background:var(--card);border-radius:10px;padding:0.4rem;box-shadow:0 1px 4px rgba(0,0,0,0.06)}\n.tab{flex:1;padding:0.6rem;text-align:center;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.85rem;color:var(--muted);transition:all .2s}\n.tab.active{background:var(--accent);color:#fff}\n.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.8rem;margin-bottom:1rem}\n.stat-card{background:var(--card);border-radius:10px;padding:1rem;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.06)}\n.stat-card .num{font-size:1.6rem;font-weight:800;color:var(--accent)}\n.stat-card .num.green{color:var(--green)}\n.stat-card .num.orange{color:var(--orange)}\n.stat-card .num.blue{color:var(--accent2)}\n.stat-card .label{font-size:0.75rem;color:var(--muted);margin-top:0.2rem}\n.panel{background:var(--card);border-radius:10px;padding:1.2rem;margin-bottom:1rem;box-shadow:0 1px 4px rgba(0,0,0,0.06)}\n.panel h3{font-size:0.95rem;margin-bottom:0.8rem;font-weight:700}\ntable{width:100%;border-collapse:collapse;font-size:0.82rem}\nth{text-align:left;padding:0.5rem;border-bottom:2px solid var(--rule);font-weight:600;color:var(--muted)}\ntd{padding:0.5rem;border-bottom:1px solid var(--rule)}\n.btn-sm{padding:0.35rem 0.8rem;border:none;border-radius:6px;font-size:0.78rem;font-weight:600;cursor:pointer}\n.btn-confirm{background:var(--green);color:#fff}\n.btn-danger{background:var(--accent);color:#fff}\n.tag{display:inline-block;padding:0.15rem 0.5rem;border-radius:4px;font-size:0.72rem;font-weight:600}\n.tag-pending{background:#fef3c7;color:#92400e}\n.tag-paid{background:#dcfce7;color:#166534}\ntextarea{width:100%;min-height:120px;padding:0.7rem;border:1px solid var(--rule);border-radius:8px;font-family:monospace;font-size:0.82rem;resize:vertical}\n.setting-row{display:flex;align-items:center;gap:0.8rem;margin-bottom:0.6rem}\n.setting-row label{width:100px;font-size:0.82rem;color:var(--muted);flex-shrink:0}\n.setting-row input{flex:1;padding:0.5rem;border:1px solid var(--rule);border-radius:6px;font-size:0.82rem}\n.qr-upload{display:flex;gap:1rem;margin:0.8rem 0}\n.qr-upload-item{text-align:center}\n.qr-upload-item img{width:100px;height:100px;border-radius:8px;border:1px solid var(--rule);object-fit:cover}\n.qr-upload-item .placeholder{width:100px;height:100px;border-radius:8px;border:1px dashed var(--rule);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:0.72rem}\n.qr-upload-item button{margin-top:0.4rem;padding:0.3rem 0.6rem;border:1px solid var(--rule);border-radius:6px;font-size:0.72rem;cursor:pointer;background:var(--card)}\n.empty{text-align:center;color:var(--muted);padding:2rem;font-size:0.85rem}\n@media(max-width:600px){.stats-grid{grid-template-columns:repeat(2,1fr)}.tab{font-size:0.75rem}.setting-row{flex-direction:column;align-items:flex-start}.setting-row label{width:auto}}\n</style>\n</head>\n<body>\n<div id="loginPage" class="login">\n<h1>发卡系统管理后台</h1>\n<input type="password" id="pwdInput" placeholder="请输入管理密码" onkeydown="if(event.key===\'Enter\')doLogin()">\n<button onclick="doLogin()">登录</button>\n<p class="err" id="loginErr"></p>\n</div>\n\n<div id="dashPage" class="dash" style="display:none">\n<div class="tabs">\n<div class="tab active" onclick="switchTab(\'stats\')">统计</div>\n<div class="tab" onclick="switchTab(\'orders\')">订单</div>\n<div class="tab" onclick="switchTab(\'codes\')">访问码</div>\n<div class="tab" onclick="switchTab(\'settings\')">设置</div>\n</div>\n<div id="tabContent"></div>\n</div>\n\n<script>\nvar pwd="";\nvar currentTab="stats";\n\nfunction doLogin(){\n  pwd=document.getElementById("pwdInput").value.trim();\n  if(!pwd){document.getElementById("loginErr").textContent="请输入密码";return}\n  fetch("/api/admin/stats?password="+encodeURIComponent(pwd))\n  .then(function(r){return r.json()})\n  .then(function(d){\n    if(d.success){\n      document.getElementById("loginPage").style.display="none";\n      document.getElementById("dashPage").style.display="block";\n      loadTab();\n    }else{\n      document.getElementById("loginErr").textContent=d.error||"密码错误";\n    }\n  })\n  .catch(function(){document.getElementById("loginErr").textContent="网络错误"})\n}\n\nfunction switchTab(tab){\n  currentTab=tab;\n  var tabs=document.querySelectorAll(".tab");\n  for(var i=0;i<tabs.length;i++){tabs[i].classList.remove("active")}\n  event.target.classList.add("active");\n  loadTab();\n}\n\nfunction loadTab(){\n  if(currentTab==="stats")loadStats();\n  else if(currentTab==="orders")loadOrders();\n  else if(currentTab==="codes")loadCodes();\n  else if(currentTab==="settings")loadSettings();\n}\n\nfunction loadStats(){\n  fetch("/api/admin/stats?password="+encodeURIComponent(pwd))\n  .then(function(r){return r.json()})\n  .then(function(d){\n    if(!d.success)return;\n    var s=d.stats;\n    var html=\'<div class="stats-grid">\';\n    html+=\'<div class="stat-card"><div class="num">\'+s.total+\'</div><div class="label">总订单</div></div>\';\n    html+=\'<div class="stat-card"><div class="num orange">\'+s.pending+\'</div><div class="label">待确认</div></div>\';\n    html+=\'<div class="stat-card"><div class="num green">\'+s.paid+\'</div><div class="label">已付款</div></div>\';\n    html+=\'<div class="stat-card"><div class="num">¥\'+s.revenue+\'</div><div class="label">总收入</div></div>\';\n    html+=\'<div class="stat-card"><div class="num blue">\'+s.availableCodes+\'</div><div class="label">可用码</div></div>\';\n    html+=\'<div class="stat-card"><div class="num">\'+s.usedCodes+\'</div><div class="label">已用码</div></div>\';\n    html+=\'</div>\';\n    if(s.pending>0){\n      html+=\'<div class="panel"><h3>待确认订单 (\'+s.pending+\')</h3><div id="pendingList">加载中...</div></div>\';\n    }\n    html+=\'<div class="panel"><h3>购买页面地址</h3><p style="font-size:0.82rem;color:var(--muted);word-break:break-all">\'+window.location.origin+\'</p><p class="tip" style="font-size:0.75rem;color:var(--muted);margin-top:0.4rem">将此地址发给买家，买家打开后扫码付款</p></div>\';\n    document.getElementById("tabContent").innerHTML=html;\n    if(s.pending>0)loadPendingOrders();\n  })\n  .catch(function(){document.getElementById("tabContent").innerHTML="<p class=empty>加载失败</p>"})\n}\n\nfunction loadPendingOrders(){\n  fetch("/api/admin/orders?password="+encodeURIComponent(pwd)+"&status=pending")\n  .then(function(r){return r.json()})\n  .then(function(d){\n    if(!d.success)return;\n    var orders=d.orders;\n    if(orders.length===0){document.getElementById("pendingList").innerHTML="<p class=empty>暂无待确认订单</p>";return}\n    var html="<table><tr><th>订单号</th><th>金额</th><th>备注</th><th>时间</th><th>操作</th></tr>";\n    for(var i=0;i<orders.length;i++){\n      var o=orders[i];\n      html+="<tr><td style=font-size:0.72rem>"+o.id+"</td><td>¥"+o.amount+"</td><td>"+(o.buyerNote||"-")+"</td><td style=font-size:0.72rem>"+fmtTime(o.createdAt)+"</td><td><button class=btn-sm btn-confirm onclick=confirmOrder(\'"+o.id+"\')>确认</button></td></tr>";\n    }\n    html+="</table>";\n    document.getElementById("pendingList").innerHTML=html;\n  })\n}\n\nfunction loadOrders(){\n  fetch("/api/admin/orders?password="+encodeURIComponent(pwd))\n  .then(function(r){return r.json()})\n  .then(function(d){\n    if(!d.success)return;\n    var orders=d.orders;\n    if(orders.length===0){document.getElementById("tabContent").innerHTML="<p class=empty>暂无订单</p>";return}\n    var html="<div class=panel><h3>全部订单 ("+orders.length+")</h3><table><tr><th>订单号</th><th>状态</th><th>金额</th><th>备注</th><th>访问码</th><th>时间</th></tr>";\n    for(var i=0;i<orders.length;i++){\n      var o=orders[i];\n      var tag=o.status==="paid"?"<span class=tag tag-paid>已付款</span>":"<span class=tag tag-pending>待确认</span>";\n      html+="<tr><td style=font-size:0.72rem>"+o.id+"</td><td>"+tag+"</td><td>¥"+o.amount+"</td><td>"+(o.buyerNote||"-")+"</td><td style=font-weight:600;color:var(--accent)>"+(o.code||"-")+"</td><td style=font-size:0.72rem>"+fmtTime(o.createdAt)+"</td></tr>";\n    }\n    html+="</table></div>";\n    document.getElementById("tabContent").innerHTML=html;\n  })\n}\n\nfunction loadCodes(){\n  fetch("/api/admin/codes?password="+encodeURIComponent(pwd))\n  .then(function(r){return r.json()})\n  .then(function(d){\n    if(!d.success)return;\n    var html="<div class=panel><h3>添加访问码</h3><p style=font-size:0.78rem;color:var(--muted);margin-bottom:0.5rem>每行一个访问码，粘贴后点击添加</p>";\n    html+="<textarea id=codesInput placeholder=\\"7DS-XXXX-XXXX\\n7DS-YYYY-YYYY\\n...\\"></textarea>";\n    html+="<button class=btn-sm btn-confirm style=margin-top:0.5rem;padding:0.5rem 1rem onclick=addCodes()>添加访问码</button>";\n    html+="<p id=codesMsg style=font-size:0.78rem;margin-top:0.4rem></p></div>";\n    html+="<div class=panel><h3>访问码库存</h3><p style=font-size:0.82rem;color:var(--muted)>可用："+d.available+" · 已用："+d.used+"</p>";\n    if(d.codes.length>0){\n      html+="<table style=margin-top:0.5rem><tr><th>访问码</th><th>状态</th><th>订单</th></tr>";\n      for(var i=0;i<d.codes.length;i++){\n        var c=d.codes[i];\n        var tag=c.status==="available"?"<span class=tag tag-paid>可用</span>":"<span class=tag tag-pending>已用</span>";\n        html+="<tr><td style=font-family:monospace>"+c.code+"</td><td>"+tag+"</td><td style=font-size:0.72rem>"+(c.orderId||"-")+"</td></tr>";\n      }\n      html+="</table>";\n    }else{html+="<p class=empty>暂无访问码，请添加</p>"}\n    html+="</div>";\n    document.getElementById("tabContent").innerHTML=html;\n  })\n}\n\nfunction addCodes(){\n  var text=document.getElementById("codesInput").value.trim();\n  if(!text){return}\n  fetch("/api/admin/codes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:pwd,codes:text})})\n  .then(function(r){return r.json()})\n  .then(function(d){\n    if(d.success){\n      document.getElementById("codesMsg").style.color="var(--green)";\n      document.getElementById("codesMsg").textContent="成功添加 "+d.added+" 个访问码";\n      document.getElementById("codesInput").value="";\n      setTimeout(loadCodes,1000);\n    }else{\n      document.getElementById("codesMsg").style.color="var(--accent)";\n      document.getElementById("codesMsg").textContent=d.error||"添加失败";\n    }\n  })\n}\n\nfunction confirmOrder(orderId){\n  if(!confirm("确认此订单已付款？将自动分配一个访问码。"))return;\n  fetch("/api/admin/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:pwd,orderId:orderId})})\n  .then(function(r){return r.json()})\n  .then(function(d){\n    if(d.success){\n      alert("确认成功！访问码："+d.order.code+" 已分配给此订单");\n      loadStats();\n    }else{\n      alert(d.error||"确认失败");\n    }\n  })\n}\n\nfunction loadSettings(){\n  fetch("/api/settings")\n  .then(function(r){return r.json()})\n  .then(function(d){\n    if(!d.success)return;\n    var s=d.settings;\n    var html="<div class=panel><h3>商品设置</h3>";\n    html+="<div class=setting-row><label>商品名称</label><input id=setName value=\\""+esc(s.name||"")+"\\"></div>";\n    html+="<div class=setting-row><label>商品价格</label><input id=setPrice value=\\""+esc(s.price||"")+"\\"></div>";\n    html+="<div class=setting-row><label>商品描述</label><input id=setDesc value=\\""+esc(s.desc||"")+"\\"></div>";\n    html+="<div class=setting-row><label>测试页网址</label><input id=setTestUrl value=\\""+esc(s.testUrl||"")+"\\"></div>";\n    html+="<button class=btn-sm btn-confirm style=padding:0.5rem 1rem;margin-top:0.4rem onclick=saveSettings()>保存设置</button>";\n    html+="<p id=setMsg style=font-size:0.78rem;margin-top:0.4rem></p></div>";\n    html+="<div class=panel><h3>收款码上传</h3>";\n    html+="<div class=qr-upload>";\n    html+="<div class=qr-upload-item>";\n    if(s.wechatQr){html+="<img src=\\""+s.wechatQr+"\\">"}else{html+="<div class=placeholder>未设置</div>"}\n    html+="<button onclick=uploadQr(\'wechat\')>上传微信</button></div>";\n    html+="<div class=qr-upload-item>";\n    if(s.alipayQr){html+="<img src=\\""+s.alipayQr+"\\">"}else{html+="<div class=placeholder>未设置</div>"}\n    html+="<button onclick=uploadQr(\'alipay\')>上传支付宝</button></div>";\n    html+="</div><p class=tip style=font-size:0.72rem;color:var(--muted)>上传你的微信/支付宝收款码截图，买家付款时显示</p></div>";\n    document.getElementById("tabContent").innerHTML=html;\n  })\n}\n\nfunction saveSettings(){\n  var data={\n    password:pwd,\n    name:document.getElementById("setName").value,\n    price:document.getElementById("setPrice").value,\n    desc:document.getElementById("setDesc").value,\n    testUrl:document.getElementById("setTestUrl").value\n  };\n  fetch("/api/admin/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)})\n  .then(function(r){return r.json()})\n  .then(function(d){\n    var msg=document.getElementById("setMsg");\n    if(d.success){msg.style.color="var(--green)";msg.textContent="保存成功"}\n    else{msg.style.color="var(--accent)";msg.textContent=d.error||"保存失败"}\n  })\n}\n\nfunction uploadQr(type){\n  var input=document.createElement("input");\n  input.type="file";input.accept="image/*";\n  input.onchange=function(e){\n    var file=e.target.files[0];\n    if(!file)return;\n    if(file.size>500000){alert("图片太大，请压缩到500KB以下");return}\n    var reader=new FileReader();\n    reader.onload=function(){\n      fetch("/api/admin/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:pwd,type:type,qrData:reader.result})})\n      .then(function(r){return r.json()})\n      .then(function(d){\n        if(d.success){alert("上传成功");loadSettings()}\n        else{alert(d.error||"上传失败")}\n      })\n    };\n    reader.readAsDataURL(file);\n  };\n  input.click();\n}\n\nfunction fmtTime(iso){\n  if(!iso)return"-";\n  var d=new Date(iso);\n  return(d.getMonth()+1)+"-"+d.getDate()+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");\n}\nfunction esc(s){return s.replace(/"/g,"&quot;").replace(/</g,"&lt;")}\n</script>\n</body>\n</html>';

// === 工具函数 ===
function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function genOrderId() {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// === KV 操作 ===
async function getCodes(env) {
  try {
    const raw = await env.STORE.get('codes');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveCodes(env, codes) {
  await env.STORE.put('codes', JSON.stringify(codes));
}

async function getOrders(env) {
  try {
    const raw = await env.STORE.get('orders');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveOrders(env, orders) {
  await env.STORE.put('orders', JSON.stringify(orders));
}

async function getSettings(env) {
  try {
    const raw = await env.STORE.get('settings');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    name: '七宗罪倾向测试',
    price: '6.90',
    desc: '42道精选题目 · 7大罪宗深度分析 · 动态雷达图结果',
    wechatQr: '',
    alipayQr: '',
    testUrl: 'https://hrvzsyb4h5-cmd.github.io/my-website/',
  };
}

async function saveSettings(env, settings) {
  await env.STORE.put('settings', JSON.stringify(settings));
}

// === API 处理 ===

// GET /api/settings - 获取公开设置
async function handleGetSettings(env) {
  const s = await getSettings(env);
  return json({
    success: true,
    settings: {
      name: s.name,
      price: s.price,
      desc: s.desc,
      wechatQr: s.wechatQr,
      alipayQr: s.alipayQr,
      testUrl: s.testUrl,
    }
  });
}

// POST /api/order - 创建订单
async function handleCreateOrder(request, env) {
  try {
    const body = await request.json();
    const order = {
      id: genOrderId(),
      status: 'pending',
      amount: String(body.amount || '6.90'),
      buyerNote: String(body.buyerNote || ''),
      createdAt: new Date().toISOString(),
      paidAt: null,
      code: null,
    };
    const orders = await getOrders(env);
    orders.push(order);
    await saveOrders(env, orders);
    return json({ success: true, orderId: order.id });
  } catch (e) {
    return json({ success: false, error: '创建订单失败' }, 500);
  }
}

// GET /api/order?id=xxx - 查询订单
async function handleCheckOrder(url, env) {
  const orderId = url.searchParams.get('id');
  if (!orderId) return json({ success: false, error: '缺少订单号' }, 400);
  const orders = await getOrders(env);
  const order = orders.find(function(o) { return o.id === orderId; });
  if (!order) return json({ success: false, error: '订单不存在' }, 404);
  return json({ success: true, order: order });
}

// POST /api/admin/confirm - 确认付款并分配访问码
async function handleConfirmOrder(request, env) {
  try {
    const body = await request.json();
    if (body.password !== env.ADMIN_PASSWORD) {
      return json({ success: false, error: '密码错误' }, 403);
    }
    const orders = await getOrders(env);
    const order = orders.find(function(o) { return o.id === body.orderId; });
    if (!order) return json({ success: false, error: '订单不存在' }, 404);
    if (order.status === 'paid') return json({ success: false, error: '此订单已确认' });

    // 分配访问码
    const codes = await getCodes(env);
    const codeIdx = codes.findIndex(function(c) { return c.status === 'available'; });
    if (codeIdx === -1) return json({ success: false, error: '没有可用访问码，请先添加' });

    codes[codeIdx].status = 'used';
    codes[codeIdx].orderId = order.id;
    codes[codeIdx].usedAt = new Date().toISOString();
    order.status = 'paid';
    order.paidAt = new Date().toISOString();
    order.code = codes[codeIdx].code;

    await saveCodes(env, codes);
    await saveOrders(env, orders);
    return json({ success: true, order: order });
  } catch (e) {
    return json({ success: false, error: '操作失败' }, 500);
  }
}

// POST /api/admin/codes - 批量添加访问码
async function handleAddCodes(request, env) {
  try {
    const body = await request.json();
    if (body.password !== env.ADMIN_PASSWORD) {
      return json({ success: false, error: '密码错误' }, 403);
    }
    const lines = body.codes.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
    if (lines.length === 0) return json({ success: false, error: '没有有效的访问码' });

    const codes = await getCodes(env);
    const existing = new Set(codes.map(function(c) { return c.code; }));
    var added = 0;
    for (var i = 0; i < lines.length; i++) {
      if (!existing.has(lines[i])) {
        codes.push({ code: lines[i], status: 'available', orderId: null, usedAt: null });
        existing.add(lines[i]);
        added++;
      }
    }
    await saveCodes(env, codes);
    return json({ success: true, added: added, total: codes.length });
  } catch (e) {
    return json({ success: false, error: '添加失败' }, 500);
  }
}

// GET /api/admin/codes - 列出访问码
async function handleListCodes(url, env) {
  const password = url.searchParams.get('password');
  if (password !== env.ADMIN_PASSWORD) return json({ success: false, error: '密码错误' }, 403);
  const codes = await getCodes(env);
  var available = 0, used = 0;
  for (var i = 0; i < codes.length; i++) {
    if (codes[i].status === 'available') available++;
    else used++;
  }
  return json({ success: true, codes: codes, available: available, used: used });
}

// GET /api/admin/orders - 列出订单
async function handleListOrders(url, env) {
  const password = url.searchParams.get('password');
  if (password !== env.ADMIN_PASSWORD) return json({ success: false, error: '密码错误' }, 403);
  const statusFilter = url.searchParams.get('status');
  var orders = await getOrders(env);
  orders.reverse();
  if (statusFilter) {
    orders = orders.filter(function(o) { return o.status === statusFilter; });
  }
  return json({ success: true, orders: orders });
}

// GET /api/admin/stats - 获取统计
async function handleGetStats(url, env) {
  const password = url.searchParams.get('password');
  if (password !== env.ADMIN_PASSWORD) return json({ success: false, error: '密码错误' }, 403);
  const orders = await getOrders(env);
  const codes = await getCodes(env);
  var paid = 0, pending = 0, revenue = 0, availableCodes = 0, usedCodes = 0;
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].status === 'paid') {
      paid++;
      revenue += parseFloat(orders[i].amount) || 0;
    } else {
      pending++;
    }
  }
  for (var j = 0; j < codes.length; j++) {
    if (codes[j].status === 'available') availableCodes++;
    else usedCodes++;
  }
  return json({
    success: true,
    stats: {
      total: orders.length,
      pending: pending,
      paid: paid,
      revenue: revenue.toFixed(2),
      availableCodes: availableCodes,
      usedCodes: usedCodes,
    }
  });
}

// POST /api/admin/settings - 更新设置
async function handleUpdateSettings(request, env) {
  try {
    const body = await request.json();
    if (body.password !== env.ADMIN_PASSWORD) {
      return json({ success: false, error: '密码错误' }, 403);
    }
    const settings = await getSettings(env);
    if (body.name !== undefined) settings.name = body.name;
    if (body.price !== undefined) settings.price = body.price;
    if (body.desc !== undefined) settings.desc = body.desc;
    if (body.testUrl !== undefined) settings.testUrl = body.testUrl;
    // 上传收款码
    if (body.type === 'wechat' && body.qrData) {
      settings.wechatQr = body.qrData;
    }
    if (body.type === 'alipay' && body.qrData) {
      settings.alipayQr = body.qrData;
    }
    await saveSettings(env, settings);
    return json({ success: true });
  } catch (e) {
    return json({ success: false, error: '保存失败' }, 500);
  }
}

// === 页面服务 ===
function servePurchasePage() {
  return new Response(PURCHASE_HTML, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function serveAdminPage() {
  return new Response(ADMIN_HTML, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// === 主路由 ===
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // 静态页面
    if (url.pathname === '/' && request.method === 'GET') {
      return servePurchasePage();
    }
    if (url.pathname === '/admin' && request.method === 'GET') {
      return serveAdminPage();
    }

    // 公开 API
    if (url.pathname === '/api/settings' && request.method === 'GET') {
      return handleGetSettings(env);
    }
    if (url.pathname === '/api/order' && request.method === 'POST') {
      return handleCreateOrder(request, env);
    }
    if (url.pathname === '/api/order' && request.method === 'GET') {
      return handleCheckOrder(url, env);
    }

    // 管理 API
    if (url.pathname === '/api/admin/confirm' && request.method === 'POST') {
      return handleConfirmOrder(request, env);
    }
    if (url.pathname === '/api/admin/codes' && request.method === 'POST') {
      return handleAddCodes(request, env);
    }
    if (url.pathname === '/api/admin/codes' && request.method === 'GET') {
      return handleListCodes(url, env);
    }
    if (url.pathname === '/api/admin/orders' && request.method === 'GET') {
      return handleListOrders(url, env);
    }
    if (url.pathname === '/api/admin/stats' && request.method === 'GET') {
      return handleGetStats(url, env);
    }
    if (url.pathname === '/api/admin/settings' && request.method === 'POST') {
      return handleUpdateSettings(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};
