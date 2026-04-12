#!/usr/bin/env python3
"""Build script that generates index.html for the Cambridge ETA Club Management Platform."""

HEAD = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Cambridge ETA Club Management Platform</title>
<meta name="description" content="Premium club management platform for Cambridge ETA." />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --bg-0:#07060d;
  --bg-1:#0b0a17;
  --bg-2:#111029;
  --bg-3:#181635;
  --panel:rgba(20,18,44,0.72);
  --panel-2:rgba(28,25,58,0.78);
  --border:rgba(138,99,255,0.18);
  --border-strong:rgba(138,99,255,0.35);
  --text:#e9e6ff;
  --text-dim:#a39ec7;
  --text-muted:#6e6a90;
  --purple:#8a63ff;
  --purple-2:#a98bff;
  --purple-glow:rgba(138,99,255,0.45);
  --violet:#6a3dff;
  --gold:#e8c66b;
  --green:#4ade80;
  --red:#ff6b8a;
  --blue:#5ec8ff;
  --radius:14px;
  --shadow:0 20px 60px -20px rgba(80,40,200,0.45);
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  background:var(--bg-0);
  color:var(--text);
  -webkit-font-smoothing:antialiased;
  overflow:hidden;
  font-size:14px;
  line-height:1.5;
}
body::before{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(900px 600px at 12% -10%, rgba(138,99,255,0.18), transparent 60%),
    radial-gradient(800px 500px at 100% 0%, rgba(106,61,255,0.14), transparent 60%),
    radial-gradient(600px 400px at 50% 110%, rgba(168,139,255,0.10), transparent 60%);
}
h1,h2,h3,h4{font-family:'Space Grotesk','Inter',sans-serif;letter-spacing:-0.01em;font-weight:600}
button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
input,select,textarea{font-family:inherit}
a{color:inherit;text-decoration:none}

/* ===== LAYOUT ===== */
.app{display:flex;height:100vh;position:relative;z-index:1}
.sidebar{
  width:260px;flex-shrink:0;
  background:linear-gradient(180deg,rgba(15,13,35,0.92),rgba(10,9,22,0.92));
  backdrop-filter:blur(20px);
  border-right:1px solid var(--border);
  display:flex;flex-direction:column;
  padding:22px 16px;
}
.brand{display:flex;align-items:center;gap:12px;padding:6px 10px 22px}
.brand-mark{
  width:40px;height:40px;border-radius:12px;
  background:linear-gradient(135deg,#8a63ff 0%,#6a3dff 50%,#3a1f9e 100%);
  display:flex;align-items:center;justify-content:center;
  font-family:'Space Grotesk';font-weight:700;font-size:18px;color:white;
  box-shadow:0 8px 24px -4px rgba(138,99,255,0.5),inset 0 1px 0 rgba(255,255,255,0.3);
  position:relative;
}
.brand-mark::after{content:"";position:absolute;inset:2px;border-radius:10px;border:1px solid rgba(255,255,255,0.15)}
.brand-text{display:flex;flex-direction:column;line-height:1.15}
.brand-text .title{font-family:'Space Grotesk';font-weight:700;font-size:15px;color:#fff}
.brand-text .sub{font-size:10.5px;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase}

.nav{display:flex;flex-direction:column;gap:4px;margin-top:8px}
.nav-label{font-size:10.5px;text-transform:uppercase;letter-spacing:0.12em;color:var(--text-muted);padding:14px 12px 6px;font-weight:600}
.nav-item{
  display:flex;align-items:center;gap:12px;
  padding:11px 12px;border-radius:10px;
  color:var(--text-dim);font-size:13.5px;font-weight:500;
  cursor:pointer;transition:all 0.2s ease;
  position:relative;
}
.nav-item:hover{background:rgba(138,99,255,0.08);color:var(--text)}
.nav-item.active{
  background:linear-gradient(90deg,rgba(138,99,255,0.22),rgba(138,99,255,0.06));
  color:#fff;
  box-shadow:inset 0 0 0 1px rgba(138,99,255,0.3);
}
.nav-item.active::before{
  content:"";position:absolute;left:-16px;top:50%;transform:translateY(-50%);
  width:3px;height:22px;border-radius:0 3px 3px 0;
  background:linear-gradient(180deg,#a98bff,#6a3dff);
  box-shadow:0 0 12px var(--purple-glow);
}
.nav-item .icon{width:18px;height:18px;opacity:0.9;flex-shrink:0}
.nav-item .badge{margin-left:auto;background:var(--purple);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px}

.sidebar-footer{margin-top:auto;padding-top:18px;border-top:1px solid var(--border)}
.user-card{
  display:flex;align-items:center;gap:12px;padding:10px;border-radius:12px;
  background:rgba(138,99,255,0.06);border:1px solid var(--border);
}
.avatar{
  width:36px;height:36px;border-radius:10px;
  background:linear-gradient(135deg,#a98bff,#6a3dff);
  display:flex;align-items:center;justify-content:center;
  font-weight:700;color:#fff;font-size:13px;
}
.user-card .name{font-size:12.5px;font-weight:600;color:#fff}
.user-card .role{font-size:10.5px;color:var(--text-muted)}

/* ===== MAIN ===== */
.main{flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden}
.topbar{
  height:68px;padding:0 32px;
  display:flex;align-items:center;justify-content:space-between;
  border-bottom:1px solid var(--border);
  background:rgba(11,10,23,0.6);backdrop-filter:blur(16px);
  flex-shrink:0;
}
.page-title{font-size:20px;font-weight:700;font-family:'Space Grotesk'}
.page-subtitle{font-size:12.5px;color:var(--text-muted);margin-top:2px}
.topbar-right{display:flex;align-items:center;gap:12px}
.search{
  display:flex;align-items:center;gap:8px;
  background:rgba(138,99,255,0.08);
  border:1px solid var(--border);
  padding:9px 14px;border-radius:10px;min-width:280px;
}
.search input{background:none;border:none;outline:none;color:var(--text);flex:1;font-size:13px}
.search input::placeholder{color:var(--text-muted)}
.icon-btn{
  width:38px;height:38px;border-radius:10px;
  background:rgba(138,99,255,0.08);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;transition:all 0.2s;
  position:relative;
}
.icon-btn:hover{background:rgba(138,99,255,0.18);border-color:var(--border-strong)}
.icon-btn .dot{position:absolute;top:8px;right:8px;width:7px;height:7px;border-radius:50%;background:var(--red);box-shadow:0 0 8px var(--red)}

.btn{
  display:inline-flex;align-items:center;gap:8px;
  padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;
  transition:all 0.2s;white-space:nowrap;
}
.btn-primary{
  background:linear-gradient(135deg,#8a63ff,#6a3dff);
  color:#fff;
  box-shadow:0 8px 24px -8px rgba(138,99,255,0.6),inset 0 1px 0 rgba(255,255,255,0.2);
}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 12px 28px -8px rgba(138,99,255,0.8)}
.btn-ghost{background:rgba(138,99,255,0.08);border:1px solid var(--border);color:var(--text)}
.btn-ghost:hover{background:rgba(138,99,255,0.16)}

.content{flex:1;overflow-y:auto;padding:28px 32px 40px}
.content::-webkit-scrollbar{width:10px}
.content::-webkit-scrollbar-track{background:transparent}
.content::-webkit-scrollbar-thumb{background:rgba(138,99,255,0.2);border-radius:10px}
.content::-webkit-scrollbar-thumb:hover{background:rgba(138,99,255,0.35)}

.section{display:none;animation:fadeUp 0.35s ease}
.section.active{display:block}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

/* ===== CARDS ===== */
.card{
  background:var(--panel);
  border:1px solid var(--border);
  border-radius:var(--radius);
  padding:22px;
  backdrop-filter:blur(20px);
  position:relative;
  overflow:hidden;
}
.card::before{
  content:"";position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(168,139,255,0.4),transparent);
}
.card-title{font-size:15px;font-weight:600;margin-bottom:4px}
.card-sub{font-size:12px;color:var(--text-muted);margin-bottom:18px}

.grid{display:grid;gap:18px}
.grid-4{grid-template-columns:repeat(4,1fr)}
.grid-3{grid-template-columns:repeat(3,1fr)}
.grid-2{grid-template-columns:repeat(2,1fr)}
.grid-2-1{grid-template-columns:2fr 1fr}

/* ===== KPI ===== */
.kpi{
  background:linear-gradient(135deg,rgba(20,18,44,0.85),rgba(28,25,58,0.65));
  border:1px solid var(--border);
  border-radius:var(--radius);
  padding:20px;position:relative;overflow:hidden;
}
.kpi::after{
  content:"";position:absolute;top:-40px;right:-40px;width:140px;height:140px;
  background:radial-gradient(circle,rgba(138,99,255,0.22),transparent 70%);
  border-radius:50%;
}
.kpi-label{font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;font-weight:600}
.kpi-value{font-size:32px;font-weight:700;font-family:'Space Grotesk';margin-top:8px;background:linear-gradient(135deg,#fff,#c4b8ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.kpi-meta{display:flex;align-items:center;gap:6px;margin-top:10px;font-size:12px;color:var(--text-dim)}
.kpi-trend{display:inline-flex;align-items:center;gap:3px;font-weight:600;padding:2px 8px;border-radius:8px;font-size:11px}
.trend-up{background:rgba(74,222,128,0.12);color:var(--green)}
.trend-down{background:rgba(255,107,138,0.12);color:var(--red)}
.kpi-icon{
  position:absolute;top:18px;right:18px;z-index:1;
  width:38px;height:38px;border-radius:10px;
  background:linear-gradient(135deg,rgba(138,99,255,0.3),rgba(106,61,255,0.15));
  border:1px solid var(--border-strong);
  display:flex;align-items:center;justify-content:center;
}

/* ===== TABLES ===== */
.table{width:100%;border-collapse:collapse}
.table th{
  text-align:left;padding:12px 14px;font-size:11px;font-weight:600;
  color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;
  border-bottom:1px solid var(--border);
}
.table td{padding:14px;font-size:13px;border-bottom:1px solid rgba(138,99,255,0.08)}
.table tr{transition:background 0.15s}
.table tbody tr:hover{background:rgba(138,99,255,0.06)}
.table tr:last-child td{border-bottom:none}

.tag{
  display:inline-flex;align-items:center;gap:5px;
  padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;
  background:rgba(138,99,255,0.14);color:var(--purple-2);
  border:1px solid rgba(138,99,255,0.25);
}
.tag.green{background:rgba(74,222,128,0.12);color:var(--green);border-color:rgba(74,222,128,0.3)}
.tag.gold{background:rgba(232,198,107,0.12);color:var(--gold);border-color:rgba(232,198,107,0.3)}
.tag.red{background:rgba(255,107,138,0.12);color:var(--red);border-color:rgba(255,107,138,0.3)}
.tag.blue{background:rgba(94,200,255,0.12);color:var(--blue);border-color:rgba(94,200,255,0.3)}

.contact-cell{display:flex;align-items:center;gap:11px}
.contact-cell .avatar{width:34px;height:34px;font-size:12px;border-radius:9px}
.contact-cell .info{display:flex;flex-direction:column}
.contact-cell .name{font-weight:600;color:#fff;font-size:13px}
.contact-cell .email{font-size:11.5px;color:var(--text-muted)}

/* ===== EVENTS ===== */
.event-card{
  background:var(--panel);border:1px solid var(--border);
  border-radius:var(--radius);padding:20px;
  position:relative;overflow:hidden;transition:all 0.25s;
}
.event-card:hover{transform:translateY(-2px);border-color:var(--border-strong);box-shadow:var(--shadow)}
.event-card::before{
  content:"";position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,#8a63ff,#a98bff,#6a3dff);
}
.event-date{
  display:flex;align-items:center;gap:10px;margin-bottom:14px;
  font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;font-weight:600;
}
.event-title{font-size:17px;font-weight:700;font-family:'Space Grotesk';margin-bottom:8px}
.event-desc{font-size:12.5px;color:var(--text-dim);line-height:1.55;margin-bottom:16px}
.event-foot{display:flex;align-items:center;justify-content:space-between;padding-top:14px;border-top:1px solid var(--border)}
.attendees{display:flex;align-items:center}
.attendees .avatar{width:26px;height:26px;font-size:10px;border-radius:7px;border:2px solid var(--bg-1);margin-left:-8px}
.attendees .avatar:first-child{margin-left:0}
.attendees .more{margin-left:-8px;width:26px;height:26px;border-radius:7px;border:2px solid var(--bg-1);background:rgba(138,99,255,0.2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--purple-2)}

/* ===== TASKS ===== */
.task-row{
  display:flex;align-items:center;gap:14px;
  padding:14px 16px;border-radius:10px;
  background:rgba(138,99,255,0.04);border:1px solid var(--border);
  margin-bottom:10px;transition:all 0.2s;
}
.task-row:hover{background:rgba(138,99,255,0.09);border-color:var(--border-strong)}
.task-row.done{opacity:0.55}
.task-row.done .task-title{text-decoration:line-through}
.checkbox{
  width:20px;height:20px;border-radius:6px;flex-shrink:0;
  border:1.5px solid rgba(138,99,255,0.4);
  display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;
}
.checkbox:hover{border-color:var(--purple-2)}
.checkbox.checked{background:linear-gradient(135deg,#8a63ff,#6a3dff);border-color:#8a63ff}
.checkbox.checked::after{content:"";width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg) translate(-1px,-1px)}
.task-info{flex:1;min-width:0}
.task-title{font-size:13.5px;font-weight:600;color:#fff}
.task-meta{font-size:11.5px;color:var(--text-muted);margin-top:3px;display:flex;gap:12px;align-items:center}

/* ===== FORMS & MODAL ===== */
.field{margin-bottom:14px}
.field label{display:block;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;font-weight:600}
.input,select.input,textarea.input{
  width:100%;padding:11px 14px;border-radius:10px;
  background:rgba(10,9,22,0.6);border:1px solid var(--border);
  color:var(--text);font-size:13px;outline:none;transition:all 0.2s;
}
.input:focus{border-color:var(--purple);box-shadow:0 0 0 3px rgba(138,99,255,0.18)}

.modal-back{
  position:fixed;inset:0;background:rgba(5,4,15,0.75);backdrop-filter:blur(8px);
  z-index:100;display:none;align-items:center;justify-content:center;padding:20px;
}
.modal-back.open{display:flex;animation:fadeIn 0.2s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{
  background:linear-gradient(180deg,#13112b,#0d0c1f);
  border:1px solid var(--border-strong);
  border-radius:18px;padding:28px;width:100%;max-width:500px;
  box-shadow:var(--shadow);position:relative;
  max-height:90vh;overflow-y:auto;
}
.modal h3{font-size:18px;margin-bottom:6px}
.modal-sub{font-size:12.5px;color:var(--text-muted);margin-bottom:22px}
.modal-close{position:absolute;top:18px;right:18px;width:32px;height:32px;border-radius:8px;background:rgba(138,99,255,0.1)}
.modal-close:hover{background:rgba(138,99,255,0.2)}
.modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:22px;padding-top:18px;border-top:1px solid var(--border)}

/* ===== CHARTS ===== */
.bar-chart{display:flex;align-items:flex-end;gap:10px;height:180px;padding:10px 0}
.bar{
  flex:1;border-radius:6px 6px 0 0;
  background:linear-gradient(180deg,#a98bff,#6a3dff);
  position:relative;min-height:6px;
  transition:all 0.3s;
}
.bar:hover{filter:brightness(1.2)}
.bar-label{position:absolute;bottom:-22px;left:0;right:0;text-align:center;font-size:10.5px;color:var(--text-muted)}
.bar-value{position:absolute;top:-20px;left:0;right:0;text-align:center;font-size:10.5px;color:var(--purple-2);font-weight:600}

.donut{position:relative;width:180px;height:180px;margin:0 auto}
.legend{display:flex;flex-direction:column;gap:8px;margin-top:18px}
.legend-item{display:flex;align-items:center;gap:10px;font-size:12px}
.legend-dot{width:10px;height:10px;border-radius:3px}

/* ===== MISC ===== */
.toast{
  position:fixed;bottom:24px;right:24px;z-index:200;
  background:linear-gradient(135deg,#1a1638,#0f0c26);
  border:1px solid var(--border-strong);border-radius:12px;
  padding:14px 18px;box-shadow:var(--shadow);
  display:flex;align-items:center;gap:12px;
  transform:translateX(400px);transition:transform 0.3s ease;
  max-width:340px;
}
.toast.show{transform:translateX(0)}
.toast-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#8a63ff,#6a3dff);display:flex;align-items:center;justify-content:center;flex-shrink:0}

.empty{padding:40px 20px;text-align:center;color:var(--text-muted);font-size:13px}

.hero{
  background:linear-gradient(135deg,rgba(138,99,255,0.14),rgba(106,61,255,0.06));
  border:1px solid var(--border-strong);
  border-radius:18px;padding:28px 32px;margin-bottom:24px;
  position:relative;overflow:hidden;
}
.hero::before{
  content:"";position:absolute;top:-60px;right:-60px;width:260px;height:260px;
  background:radial-gradient(circle,rgba(168,139,255,0.28),transparent 65%);border-radius:50%;
}
.hero h1{font-size:26px;font-family:'Space Grotesk';margin-bottom:6px;position:relative}
.hero p{font-size:13px;color:var(--text-dim);max-width:560px;position:relative}
.hero-actions{display:flex;gap:10px;margin-top:18px;position:relative}

.section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.section-head h2{font-size:17px}
.tabs{display:flex;gap:4px;background:rgba(138,99,255,0.06);padding:4px;border-radius:10px;border:1px solid var(--border)}
.tab{padding:8px 14px;border-radius:7px;font-size:12px;font-weight:600;color:var(--text-dim);cursor:pointer;transition:all 0.2s}
.tab.active{background:linear-gradient(135deg,#8a63ff,#6a3dff);color:#fff;box-shadow:0 4px 12px -4px rgba(138,99,255,0.6)}

@media (max-width:1100px){
  .grid-4{grid-template-columns:repeat(2,1fr)}
  .grid-3{grid-template-columns:repeat(2,1fr)}
  .grid-2-1{grid-template-columns:1fr}
  .sidebar{width:72px}
  .brand-text,.nav-label,.nav-item span:not(.badge),.user-card .info{display:none}
  .nav-item{justify-content:center}
  .search{min-width:160px}
}
</style>
</head>
<body>
<div class="app">
"""

def write_head(f):
    f.write(HEAD)

if __name__ == "__main__":
    with open("index.html","w") as f:
        write_head(f)
    print("Part 1 written: HEAD + CSS")
