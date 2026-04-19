    const API_KEY = '9aad45346ed6479c9255ee70aab28f05';
    const PROXY = 'https://corsproxy.io/?'; 
    
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
        // Ajuste de datas: de 2 dias atrás até 2 dias no futuro
        const past = new Date(); past.setDate(past.getDate() - 2);
        const future = new Date(); future.setDate(future.getDate() + 2);
        
        const dateFrom = past.toISOString().split('T')[0];
        const dateTo = future.toISOString().split('T')[0];
        
        const url = `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        
        try {
            const r = await fetch(PROXY + encodeURIComponent(url), { headers: { 'X-Auth-Token': API_KEY } });
            const d = await r.json();
            
            // Ordenar matches pela data (mais recentes primeiro para os resultados)
            matches = (d.matches || []).sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));
            
            render();
        } catch (e) {
            document.getElementById('display').innerHTML = '<div style="color:red;padding:20px">Erro de conexão.</div>';
        }
    }

    function render() {
        const box = document.getElementById('display');
        box.innerHTML = ''; 
        let gCount = 0, rCount = 0;

        matches.forEach(m => {
            const league = m.competition ? m.competition.name : "Liga";
            const h = m.homeTeam.name;
            const a = m.awayTeam.name;
            const dateObj = new Date(m.utcDate);
            const date = dateObj.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
            const time = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Filtro de exibição (mantendo sua lógica de ID % 10 >= 4)
            if (m.id % 10 >= 4) {
                if (currentTab === 'gols' && m.status !== 'FINISHED') {
                    box.innerHTML += `
                        <div class="card">
                            <span class="league">🏆 ${league}</span>
                            <span class="teams">${h} x ${a}</span>
                            <span class="date-time">📅 ${date} - ⏰ ${time}</span>
                        </div>`;
                } else if (currentTab === 'res' && m.status === 'FINISHED') {
                    const scH = m.score.fullTime.home ?? 0;
                    const scA = m.score.fullTime.away ?? 0;
                    const isGreen = (scH + scA >= 2); // Regra 1.5 gols
                    
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
        
        if(box.innerHTML === '') box.innerHTML = '<div style="opacity:0.3;padding:50px">Sem dados para este período.</div>';
    }

    load();
    setInterval(load, 60000);
