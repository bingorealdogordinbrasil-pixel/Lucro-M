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
    // 1. Tentar carregar do cache para não estourar o limite da API
    const cachedData = localStorage.getItem('hunter_data');
    const lastUpdate = localStorage.getItem('hunter_time');
    const now = new Date().getTime();

    if (cachedData && lastUpdate && (now - lastUpdate < 300000)) { // 5 minutos de cache
        matches = JSON.parse(cachedData);
        render();
        return;
    }

    const dateStart = new Date();
    dateStart.setDate(dateStart.getDate() - 3);
    const dateFrom = dateStart.toISOString().split('T')[0];
    const dateTo = new Date(new Date().getTime() + 86400000).toISOString().split('T')[0];

    const apiUrl = `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    
    try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`);
        const result = await response.json();
        const data = JSON.parse(result.contents);

        if (data.matches) {
            matches = data.matches;
            localStorage.setItem('hunter_data', JSON.stringify(matches));
            localStorage.setItem('hunter_time', now.toString());
            render();
        }
    } catch (e) {
        if (cachedData) {
            matches = JSON.parse(cachedData);
            render();
        } else {
            document.getElementById('display').innerHTML = '<div style="color:#ff4444;padding:20px">API em pausa. Aguarde 2 min.</div>';
        }
    }
}

function render() {
    const box = document.getElementById('display');
    box.innerHTML = ''; 
    let gCount = 0, rCount = 0;
    const sortedMatches = [...matches].reverse();

    sortedMatches.forEach(m => {
        if (m.id % 10 >= 4) {
            const date = new Date(m.utcDate).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
            const time = new Date(m.utcDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            if (currentTab === 'gols' && m.status !== 'FINISHED') {
                box.innerHTML += `<div class="card">
                    <span class="league">🏆 ${m.competition.name}</span>
                    <span class="teams">${m.homeTeam.name} x ${m.awayTeam.name}</span>
                    <span class="date-time">📅 ${date} - ⏰ ${time}</span>
                </div>`;
            } else if (currentTab === 'res' && m.status === 'FINISHED') {
                const isGreen = (m.score.fullTime.home + m.score.fullTime.away >= 2);
                isGreen ? gCount++ : rCount++;
                box.innerHTML += `<div class="card" style="border-left-color: ${isGreen ? 'var(--neon)' : 'var(--red)'}">
                    <span class="league">🏆 ${m.competition.name}</span>
                    <span class="teams">${m.homeTeam.name} ${m.score.fullTime.home} - ${m.score.fullTime.away} ${m.awayTeam.name}</span>
                    <span class="date-time">📅 ${date} - ⏰ ${time}</span>
                    <div class="res-badge ${isGreen ? 'green-bg' : 'red-bg'}">${isGreen ? 'GREEN ✅' : 'RED ❌'}</div>
                </div>`;
            }
        }
    });
    document.getElementById('total-green').innerText = gCount;
    document.getElementById('total-red').innerText = rCount;
}

load();
setInterval(load, 300000); // Tenta atualizar a cada 5 minutos apenas
