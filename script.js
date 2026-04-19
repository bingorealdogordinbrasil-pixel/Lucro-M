const API_KEY = '9aad45346ed6479c9255ee70aab28f05';
const PROXY = 'https://api.allorigins.win/raw?url='; // Mudamos o proxy para um mais estável

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
        const response = await fetch(PROXY + encodeURIComponent(apiUrl), {
            headers: { 'X-Auth-Token': API_KEY }
        });

        if (response.status === 429) {
            throw new Error('Muitas requisições. Aguarde um minuto.');
        }

        const data = await response.json();
        matches = data.matches || [];
        render();
    } catch (e) {
        console.error(e);
        document.getElementById('display').innerHTML = `
            <div style="color:var(--red);padding:20px">
                Erro ao carregar dados.<br>
                <small>Limite da API atingido ou problema no servidor. Tentando novamente em breve...</small>
            </div>`;
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
                        <div class="res-badge ${isGreen ? 'green-bg' : 'red-bg'}">
                            ${isGreen ? 'GREEN ✅' : 'RED ❌'}
                        </div>
                    </div>`;
            }
        }
    });

    document.getElementById('total-green').innerText = gCount;
    document.getElementById('total-red').innerText = rCount;
    
    if(box.innerHTML === '') box.innerHTML = '<div style="opacity:0.3;padding:50px">Nenhum registro encontrado.</div>';
}

load();
// Atualizando a cada 2 minutos (120000ms) para respeitar o limite da API grátis
setInterval(load, 120000);
