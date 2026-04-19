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
    
    try {
        // Usando o proxy CORS-Anywhere ou similar via AllOrigins de forma limpa
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}&t=${new Date().getTime()}`);
        const data = await response.json();
        const parsedData = JSON.parse(data.contents);

        if (parsedData.matches && parsedData.matches.length > 0) {
            matches = parsedData.matches;
            render();
        } else {
            document.getElementById('display').innerHTML = '<div style="padding:50px; opacity:0.4;">Nenhum jogo disponível na API agora.</div>';
        }
    } catch (e) {
        document.getElementById('display').innerHTML = '<div style="color:var(--red);padding:20px;">Erro de conexão. Tente recarregar em 1 minuto.</div>';
    }
}

function render() {
    const box = document.getElementById('display');
    box.innerHTML = '';
    let g = 0, r = 0;

    // Inverte para os mais novos/recentes ficarem no topo
    const sorted = [...matches].reverse();

    sorted.forEach(m => {
        const time = new Date(m.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (currentTab === 'gols' && m.status !== 'FINISHED') {
            box.innerHTML += `
                <div class="card">
                    <span class="league">🏆 ${m.competition.name}</span>
                    <span class="teams">${m.homeTeam.shortName || m.homeTeam.name} x ${m.awayTeam.shortName || m.awayTeam.name}</span>
                    <span class="date-time">⏰ HOJE ÀS ${time}</span>
                </div>`;
        } 
        else if (currentTab === 'res' && m.status === 'FINISHED') {
            const scH = m.score.fullTime.home || 0;
            const scA = m.score.fullTime.away || 0;
            const isGreen = (scH + scA >= 2);
            isGreen ? g++ : r++;

            box.innerHTML += `
                <div class="card" style="border-left-color: ${isGreen ? 'var(--neon)' : 'var(--red)'}">
                    <span class="league">🏆 ${m.competition.name}</span>
                    <span class="teams">${m.homeTeam.shortName || m.homeTeam.name} ${scH} - ${scA} ${m.awayTeam.shortName || m.awayTeam.name}</span>
                    <span class="date-time">🏁 FINALIZADO (${time})</span>
                    <div class="res-badge ${isGreen ? 'green-bg' : 'red-bg'}">${isGreen ? 'GREEN ✅' : 'RED ❌'}</div>
                </div>`;
        }
    });

    document.getElementById('total-green').innerText = g;
    document.getElementById('total-red').innerText = r;
    
    if (box.innerHTML === '') {
        box.innerHTML = '<div style="padding:50px; opacity:0.3;">Buscando novos dados...</div>';
    }
}

// Inicializa
load();
// Atualiza a cada 3 minutos para não ser banido pela API
setInterval(load, 180000);
