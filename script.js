const KEY = 'A00e8d526df64a348a623f6bd5e74282'; 
const PROXY = 'https://api.allorigins.win/raw?url='; 
const DELAY = 8000; 

let validados = [];

function nav(t) {
    document.getElementById('panel-scan').classList.toggle('hidden', t !== 'scan');
    document.getElementById('panel-res').classList.toggle('hidden', t !== 'res');
}

async function call(path) {
    try {
        const url = `https://api.football-data.org/v4${path}`;
        const response = await fetch(PROXY + encodeURIComponent(url), {
            headers: { 'X-Auth-Token': KEY }
        });
        if (response.status === 429) {
            await new Promise(r => setTimeout(r, 15000));
            return call(path);
        }
        return await response.json();
    } catch (e) { return null; }
}

async function checkTrend(id, type) {
    const d = await call(`/teams/${id}/matches?status=FINISHED&limit=10`);
    if(!d || !d.matches) return { ok: false, val: "0/0" };
    const filtered = d.matches.filter(m => type === 'HOME' ? m.homeTeam.id === id : m.awayTeam.id === id).slice(-5);
    const count = filtered.filter(m => (m.score.fullTime.home + m.score.fullTime.away) >= 2).length;
    return { ok: count >= 3, val: `${count}/5` };
}

async function start() {
    const status = document.getElementById('status');
    // Chamada simplificada para evitar erro de permissão da API Free
    const data = await call(`/matches`);
    const matches = data?.matches || [];
    
    if(matches.length === 0) {
        status.innerText = "Sem jogos disponíveis no momento.";
        return;
    }

    for(let i=0; i<matches.length; i++) {
        const m = matches[i];
        status.innerText = `Analisando: ${m.homeTeam.shortName} x ${m.awayTeam.shortName}`;
        document.getElementById('bar-fill').style.width = `${((i+1)/matches.length)*100}%`;
        
        await new Promise(r => setTimeout(r, DELAY));
        const hT = await checkTrend(m.homeTeam.id, 'HOME');
        
        if(hT.ok) {
            await new Promise(r => setTimeout(r, DELAY));
            const aT = await checkTrend(m.awayTeam.id, 'AWAY');

            if(aT.ok) {
                const dateObj = new Date(m.utcDate);
                m.fData = dateObj.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
                m.fHora = dateObj.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
                m.debug = `Tendência Over: Casa ${hT.val} | Fora ${aT.val}`;
                validados.push(m);
                renderBilhetes();
            }
        }
    }
    status.innerText = "Scanner Finalizado!";
}

function renderBilhetes() {
    const container = document.getElementById('lista-bilhetes');
    container.innerHTML = "";
    for (let i = 0; i < validados.length; i += 3) {
        const grupo = validados.slice(i, i + 3);
        container.innerHTML += `
            <div class="bilhete-grupo">
                <div class="bilhete-header">Bilhete Sugerido - Over 1.5</div>
                ${grupo.map(j => `
                    <div class="jogo-item">
                        <span class="teams">${j.homeTeam.name} vs ${j.awayTeam.name}</span>
                        <span class="datetime">📅 ${j.fData} - ⏰ ${j.fHora}</span>
                        <div class="debug-info">${j.debug}</div>
                    </div>
                `).join('')}
            </div>`;
    }
}

start();
