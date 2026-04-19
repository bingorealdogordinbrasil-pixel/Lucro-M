const API_KEY = '9aad45346ed6479c9255ee70aab28f05';
// Novo Proxy mais estável
const PROXY = 'https://cors-anywhere.herokuapp.com/'; 

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
    const dateStart = new Date();
    dateStart.setDate(dateStart.getDate() - 3);
    const dateFrom = dateStart.toISOString().split('T')[0];

    const dateEnd = new Date();
    dateEnd.setDate(dateEnd.getDate() + 1);
    const dateTo = dateEnd.toISOString().split('T')[0];

    const apiUrl = `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    
    try {
        const response = await fetch(apiUrl, {
            headers: { 'X-Auth-Token': API_KEY }
        });

        if (!response.ok) throw new Error('Erro na API');

        const data = await response.json();
        matches = data.matches || [];
        render();
    } catch (e) {
        // Se falhar o fetch direto, tentamos via proxy AllOrigins
        try {
            const altResponse = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`);
            const altData = await altResponse.json();
            const finalData = JSON.parse(altData.contents);
            matches = finalData.matches || [];
            render();
        } catch (err) {
            document.getElementById('display').innerHTML = '<div style="color:#ff4444;padding:20px">Limite de requisições excedido. Aguarde 1 minuto e recarregue.</div>';
        }
    }
}

function render() {
    const box = document.getElementById('display');
    box.innerHTML = ''; 
    let gCount = 0, rCount = 0;

    const sortedMatches = [...matches].reverse();

    sortedMatches.forEach(m => {
        const league = m.competition.name;
        const h = m.homeTeam.name;
        const a = m.awayTeam.name;
        const dateObj = new Date(m.utcDate);
        const date = dateObj.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
        const time = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        if (m.id % 10 >= 4) {
            if (currentTab === 'gols' && m.status !== 'FINISHED') {
                box.innerHTML += `
                    <div class="card">
                        <span class="league">🏆 ${league}</span>
                        <span class="teams">${h} x ${a}</span>
                        <span class="date-time">📅 ${date} - ⏰ ${time}</span>
                    </div>`;
            } else if (currentTab === 'res' && m.status === 'FINISHED') {
                const scH = m.score.fullTime.home;
                const scA = m.score.fullTime.away;
                const isGreen = (scH + scA >= 2); 
                isGreen ? gCount++ : rCount++;
                
                box.innerHTML += `
                    <div class="card" style="border-left-color: ${isGreen ? 'var(--neon)' : 'var(--red)'}">
                        <span class="league">🏆 ${league}</span>
                        <span class="teams">${h} ${scH} - ${scA} ${a}</span>
                        <span class="date-time">📅 ${date} - ⏰ ${time}</span>
                        <div class="res-badge ${isGreen ? 'green-bg' : 'red-bg'}">${isGreen ? 'GREEN ✅' : 'RED ❌'}</div>
                    </div>`;
            }
        }
    });

    document.getElementById('total-green').innerText = gCount;
    document.getElementById('total-red').innerText = rCount;
    if(box.innerHTML === '') box.innerHTML = '<div style="opacity:0.3;padding:50px">Sem dados.</div>';
}

load();
setInterval(load, 150000); // 2.5 minutos para evitar ban da API
