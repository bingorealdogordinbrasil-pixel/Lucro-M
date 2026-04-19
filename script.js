const API_KEY = '9aad45346ed6479c9255ee70aab28f05';
let matches = [];
let currentTab = 'gols';

function setTab(t) {
    currentTab = t;
    document.getElementById('btn-gols').className = (t === 'gols') ? 'nav-btn active' : 'nav-btn';
    document.getElementById('btn-res').className = (t === 'res') ? 'nav-btn active' : 'nav-btn';
    document.getElementById('stats-header').style.display = (t === 'res') ? 'flex' : 'none';
    render();
}

async function load() {
    const today = new Date().toISOString().split('T')[0];
    const url = `https://api.football-data.org/v4/matches?dateFrom=${today}&dateTo=${today}`;
    
    // Usando uma ponte via Fetch API que ignora o bloqueio de CORS (Proxy Direto)
    try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        const result = await response.json();
        const data = JSON.parse(result.contents);

        if (data && data.matches) {
            matches = data.matches;
            render();
        } else {
            throw new Error('Sem jogos');
        }
    } catch (e) {
        document.getElementById('display').innerHTML = '<div style="color:var(--red);padding:20px">Limite atingido. Aguarde 60 segundos...</div>';
    }
}

function render() {
    const box = document.getElementById('display');
    box.innerHTML = '';
    let g = 0, r = 0;

    if (matches.length === 0) {
        box.innerHTML = '<div style="padding:50px; opacity:0.3;">Nenhum jogo encontrado para hoje.</div>';
        return;
    }

    const list = [...matches].reverse();

    list.forEach(m => {
        const time = new Date(m.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (currentTab === 'gols' && m.status !== 'FINISHED') {
            box.innerHTML += `
                <div class="card">
                    <span class="league">🏆 ${m.competition.name}</span>
                    <span class="teams">${m.homeTeam.name} x ${m.awayTeam.name}</span>
                    <span class="date-time">⏰ HOJE ÀS ${time}</span>
                </div>`;
        } 
        else if (currentTab === 'res' && m.status === 'FINISHED') {
            const h = m.score.fullTime.home || 0;
            const a = m.score.fullTime.away || 0;
            const win = (h + a >= 2);
            win ? g++ : r++;

            box.innerHTML += `
                <div class="card" style="border-left-color: ${win ? 'var(--neon)' : 'var(--red)'}">
                    <span class="league">🏆 ${m.competition.name}</span>
                    <span class="teams">${m.homeTeam.name} ${h} - ${a} ${m.awayTeam.name}</span>
                    <span class="date-time">🏁 FINALIZADO (${time})</span>
                    <div class="res-badge ${win ? 'green-bg' : 'red-bg'}">${win ? 'GREEN ✅' : 'RED ❌'}</div>
                </div>`;
        }
    });

    document.getElementById('total-green').innerText = g;
    document.getElementById('total-red').innerText = r;
}

load();
setInterval(load, 180000); // 3 minutos para não ser banido
