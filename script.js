const KEY = 'A00e8d526df64a348a623f6bd5e74282'; 
const PROXY = 'https://api.allorigins.win/raw?url='; // Mudei para um proxy mais estável
const DELAY = 8000; 

let validados = [];
let historicoData = [];

function nav(t) {
    document.getElementById('panel-scan').classList.toggle('hidden', t !== 'scan');
    document.getElementById('panel-res').classList.toggle('hidden', t !== 'res');
    document.getElementById('btn-scan').classList.toggle('active', t === 'scan');
    document.getElementById('btn-res').classList.toggle('active', t === 'res');
    
    if(t === 'res') {
        loadHistory().then(() => filterRes('all'));
    }
}

async function call(path) {
    try {
        const url = `https://api.football-data.org/v4${path}`;
        const response = await fetch(PROXY + encodeURIComponent(url), {
            headers: { 'X-Auth-Token': KEY }
        });
        
        if (response.status === 429) {
            console.log("Limite atingido, esperando...");
            await new Promise(resolve => setTimeout(resolve, 30000));
            return call(path);
        }
        
        return await response.json();
    } catch (e) {
        console.error("Erro na API:", e);
        return null;
    }
}

async function checkTrend(id, type) {
    const d = await call(`/teams/${id}/matches?status=FINISHED&limit=80`);
    if(!d || !d.matches) return { ok: false, val: "0/0" };
    const filtered = d.matches.filter(m => type === 'HOME' ? m.homeTeam.id === id : m.awayTeam.id === id).slice(-6);
    if(filtered.length < 6) return { ok: false, val: "N/A" };
    const count = filtered.filter(m => (m.score.fullTime.home + m.score.fullTime.away) >= 2).length;
    return { ok: count >= 5, val: `${count}/6` };
}

async function start() {
    const status = document.getElementById('status');
    status.innerText = "Buscando jogos de hoje...";
    
    // Tenta buscar os jogos do dia atual
    const data = await call(`/matches`);
    const matches = data?.matches || [];
    
    if(matches.length === 0) {
        status.innerText = "Nenhum jogo encontrado nas ligas principais agora.";
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
                m.debug = `CASA: ${hT.val} | FORA: ${aT.val}`;
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

async function loadHistory() {
    if(historicoData.length > 0) return;
    const res = await call(`/matches?status=FINISHED`);
    historicoData = (res?.matches || []).reverse();
}

function filterRes(f) {
    const div = document.getElementById('lista-resultados');
    let filtered = historicoData;
    
    const greens = historicoData.filter(m => (m.score.fullTime.home + m.score.fullTime.away) >= 2);
    const reds = historicoData.filter(m => (m.score.fullTime.home + m.score.fullTime.away) < 2);

    document.getElementById('total-green').innerText = greens.length;
    document.getElementById('total-red').innerText = reds.length;

    if(f === 'green') filtered = greens;
    if(f === 'red') filtered = reds;

    div.innerHTML = filtered.map(m => {
        const isG = (m.score.fullTime.home + m.score.fullTime.away) >= 2;
        const dt = new Date(m.utcDate).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
        return `
            <div class="res-card" style="border-left-color: ${isG ? 'var(--neon)' : 'var(--red)'}">
                <span class="res-date">${dt}</span>
                <div class="teams" style="font-size:0.8rem">${m.homeTeam.name} ${m.score.fullTime.home} x ${m.score.fullTime.away} ${m.awayTeam.name}</div>
            </div>`;
    }).join('');
}

start();
