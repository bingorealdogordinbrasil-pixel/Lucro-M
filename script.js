const API_KEY = '9aad45346ed6479c9255ee70aab28f05';
let matches = [];
let currentTab = 'gols';

function setTab(t) {
    currentTab = t;
    document.getElementById('btn-gols').className = t === 'gols' ? 'nav-btn active' : 'nav-btn';
    document.getElementById('btn-res').className = t === 'res' ? 'nav-btn active' : 'nav-btn';
    document.getElementById('stats-header').style.display = (t === 'res') ? 'flex' : 'none';
    render();
}

async function load() {
    const now = new Date().getTime();
    const lastSync = localStorage.getItem('hunter_sync');
    
    // Cache de 5 minutos para evitar bloqueio por excesso de refresh
    if (lastSync && (now - lastSync < 300000)) {
        const cached = localStorage.getItem('hunter_matches');
        if (cached) {
            matches = JSON.parse(cached);
            render();
            return;
        }
    }

    // Puxar apenas 2 dias (Ontem e Hoje)
    const dStart = new Date();
    dStart.setDate(dStart.getDate() - 2);
    const from = dStart.toISOString().split('T')[0];
    const to = new Date(now + 86400000).toISOString().split('T')[0];

    const url = `https://api.football-data.org/v4/matches?dateFrom=${from}&dateTo=${to}`;
    
    try {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        const data = JSON.parse(json.contents);

        if (data.matches) {
            matches = data.matches;
            localStorage.setItem('hunter_matches', JSON.stringify(matches));
            localStorage.setItem('hunter_sync', now.toString());
            render();
        }
    } catch (e) {
        // Se a API travar, tenta usar o que tem no histórico do navegador
        const saved = localStorage.getItem('hunter_matches');
        if (saved) {
            matches = JSON.parse(saved);
            render();
        } else {
            document.getElementById('display').innerHTML = '<div style="color:#ff4444;padding:20px">Limite excedido. Tente em 2 minutos.</div>';
        }
    }
}

function render() {
    const box = document.getElementById('display');
    box.innerHTML = ''; 
    let g = 0, r = 0;

    // Jogos mais novos no topo
    const list = [...matches].reverse();

    list.forEach(m => {
        const date = new Date(m.utcDate).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
        const time = new Date(m.utcDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        if (currentTab === 'gols' && m.status !== 'FINISHED') {
            box.innerHTML += `<div class="card">
                <span class="league">🏆 ${m.competition.name}</span>
                <span class="teams">${m.homeTeam.name} x ${m.awayTeam.name}</span>
                <span class="date-time">📅 ${date} - ⏰ ${time}</span>
            </div>`;
        } else if (currentTab === 'res' && m.status === 'FINISHED') {
            const goals = (m.score.fullTime.home || 0) + (m.score.fullTime.away || 0);
            const win = goals >= 2;
            win ? g++ : r++;

            box.innerHTML += `<div class="card" style="border-left-color: ${win ? 'var(--neon)' : 'var(--red)'}">
                <span class="league">🏆 ${m.competition.name}</span>
                <span class="teams">${m.homeTeam.name} ${m.score.fullTime.home} - ${m.score.fullTime.away} ${m.awayTeam.name}</span>
                <span class="date-time">📅 ${date} - ⏰ ${time}</span>
                <div class="res-badge ${win ? 'green-bg' : 'red-bg'}">${win ? 'GREEN ✅' : 'RED ❌'}</div>
            </div>`;
        }
    });

    document.getElementById('total-green').innerText = g;
    document.getElementById('total-red').innerText = r;
    
    if (box.innerHTML === '') box.innerHTML = '<div style="opacity:0.3;padding:50px">Sem dados no período.</div>';
}

load();
// Atualiza a cada 5 minutos
setInterval(load, 300000);
