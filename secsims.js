/* ==============================================
   SECCITY - CYBER SECURITY MANAGER
   Arquivo JavaScript Principal
   Versão: 1.0
============================================== */

/* ==============================================
   ESTADO DO JOGO (GAME STATE)
   Armazena todas as variáveis e dados do jogo
============================================== */
const Game = {
    // Controles de execução
    started: false,              // Se o jogo já começou
    interval: null,              // Intervalo do game loop principal
    citizenInterval: null,       // Intervalo de movimento dos cidadãos
    attackSpawnInterval: null,   // Intervalo de spawn de ataques
    attackUpdateInterval: null,  // Intervalo de movimento de ataques

    // Estado do jogo
    state: {
        // Recursos
        money: 500,              // Dinheiro disponível
        defense: 50,             // Nível de segurança (0-100%)
        uptime: 100,             // Disponibilidade do sistema (0-100%)
        income: 0,               // Receita passiva por tick
        
        // Seleção
        selectedType: null,      // Tipo de construção selecionada na loja
        
        // Arrays de entidades
        servers: [],             // Servidores no grid (alvos de ataque)
        citizens: [],            // Cidadãos (usuários) animados
        attacks: [],             // Ataques DDoS visuais ativos
        
        // Contadores
        attacksBlocked: 0,       // Total de ataques bloqueados (manual + auto)
        
        // Ferramentas de segurança construídas
        firewall: false,         // Se possui Firewall
        soc: false,              // Se possui SOC (Security Operations Center)
        backup: false,           // Se possui sistema de Backup
        school: false,           // Se possui treinamento de usuários
        
        // Estatísticas para o relatório SIEM
        stats: {
            // Ataques por tipo
            attacksByType: {
                phishing: 0,
                malware: 0,
                ransomware: 0,
                ddos: 0
            },
            
            // Contadores de ataques
            totalAttacks: 0,      // Total de ataques recebidos
            attacksSuccess: 0,    // Ataques que causaram dano
            attacksFailed: 0,     // Ataques bloqueados (total)
            manualBlocks: 0,      // Bloqueios manuais (clique)
            autoBlocks: 0,        // Bloqueios automáticos (defesa)
            
            // Defesa
            maxDefense: 50,       // Defesa máxima alcançada
            minDefense: 50,       // Defesa mínima registrada
            
            // Economia
            totalMoneySpent: 0,   // Total gasto em construções
            buildingsBuilt: 0,    // Número de estruturas construídas
            
            // Tempo
            gameStartTime: 0,     // Timestamp de início
            gameTime: 0,          // Duração total em segundos
            
            // Log de eventos para o relatório
            eventLog: []
        }
    }
};

/* ==============================================
   DADOS DAS CONSTRUÇÕES
   Define propriedades de cada tipo de defesa
============================================== */
const buildingData = {
    firewall: {
        icon: '🔥',
        cost: 150,
        def: 15,              // Bonus de defesa
        income: 5,            // Bonus de renda
        realWorld: "Firewall: Atua como a primeira linha de defesa, filtrando tráfego de rede."
    },
    backup: {
        icon: '🏥',
        cost: 200,
        def: 10,
        income: 8,
        realWorld: "Backup & DR: Recuperação após ransomware ou falhas."
    },
    soc: {
        icon: '🚔',
        cost: 350,
        def: 30,
        income: 15,
        realWorld: "SOC: Monitoramento contínuo e resposta a incidentes."
    },
    school: {
        icon: '🎓',
        cost: 100,
        def: 12,
        income: 4,
        realWorld: "Awareness: Reduz ataques por erro humano."
    }
};

/* ==============================================
   ESTRUTURAS BASE
   Edifícios corporativos gerados nas bordas
============================================== */
const baseStructures = [
    { icon: '🏢', name: 'Financeiro' },
    { icon: '🗄️', name: 'Data Center' },
    { icon: '📧', name: 'E-mail Server' },
    { icon: '💾', name: 'ERP' },
    { icon: '🖥️', name: 'Servidor', type: 'server' }  // Tipo especial: alvo de ataques
];

/* ==============================================
   SÍMBOLOS DOS ATAQUES DDoS
   Emojis representando cada tipo de ataque
============================================== */
const attackEmojis = {
    phishing: '📧',
    malware: '🦠',
    ransomware: '💀',
    ddos: '🌐'
};

/* ==============================================
   EMOJIS DE CIDADÃOS
   Usuários que circulam pela cidade
============================================== */
const citizenEmojis = ['👨‍💻', '👩‍💼', '👨‍💼', '👩‍💻'];

/* ==============================================
   REFERÊNCIAS DOM
   Elementos HTML manipulados pelo JavaScript
============================================== */
let gridElement;
let logElement;

/* ==============================================
   INICIALIZAÇÃO DOM
   Executado quando a página carrega
============================================== */
document.addEventListener('DOMContentLoaded', function() {
    gridElement = document.getElementById('city-grid');
    logElement = document.getElementById('event-log');
    
    // Inicializa hover na loja
    initShopHover();
});

/* ==============================================
   INÍCIO DO JOGO
   Inicializa todos os sistemas quando o usuário clica "Iniciar"
============================================== */
function startGame() {
    // Previne múltiplos inícios
    if (Game.started) return;

    Game.started = true;
    document.getElementById('welcome-screen').style.display = 'none';

    // Inicializa o grid 8x8 com estruturas
    initGrid();
    
    // Cria cidadãos animados
    spawnCitizens(10);

    // Inicia loops do jogo
    Game.interval = setInterval(gameTick, 5000);                    // Game loop a cada 5s
    Game.citizenInterval = setInterval(updateCitizens, 50);         // Movimento de cidadãos
    Game.attackSpawnInterval = setInterval(spawnAttack, 4000);      // Spawn de ataques DDoS
    Game.attackUpdateInterval = setInterval(updateAttacks, 50);     // Movimento de ataques

    // Marca o tempo de início
    Game.state.stats.gameStartTime = Date.now();

    addLog("Operação iniciada. Monitoramento ativo.", "log-alert");
}

/* ==============================================
   GAME LOOP PRINCIPAL
   Executado a cada 5 segundos
============================================== */
function gameTick() {
    const s = Game.state;

    // Adiciona receita passiva
    s.money += s.income + 10;

    // ========================================
    // ATAQUES ABSTRATOS (não-visuais)
    // Causam 10-25% de dano na defesa
    // ========================================
    if (Math.random() * 100 > s.defense) {
        // Ataque bem-sucedido
        const damage = Math.floor(Math.random() * 15) + 10;
        s.defense = Math.max(0, s.defense - damage);
        
        // Registra estatísticas
        s.stats.attacksSuccess++;
        s.stats.totalAttacks++;
        
        addLog(`⚠️ Incidente de segurança! -${damage}% defesa`, "log-danger");
        logEvent(`ATAQUE BEM-SUCEDIDO: -${damage}% defesa`, 'danger');
    } 
    else if (s.defense > 0 && Math.random() > 0.7) {
        // Ataque bloqueado
        s.stats.attacksFailed++;
        s.stats.totalAttacks++;
        s.stats.autoBlocks++;
        
        addLog("Tentativa de intrusão bloqueada.", "log-alert");
        logEvent("Intrusão bloqueada pelo sistema", 'warning');
    }

    // Atualiza estatísticas de defesa
    s.stats.maxDefense = Math.max(s.stats.maxDefense, s.defense);
    s.stats.minDefense = Math.min(s.stats.minDefense, s.defense);

    // Regeneração de uptime se houver boa defesa
    if (s.uptime < 100 && s.defense > 40) {
        s.uptime = Math.min(100, s.uptime + 1);
    }

    // Verifica condição de game over
    checkGameOver();
    
    // Atualiza interface
    updateUI();
}

/* ==============================================
   INICIALIZAÇÃO DO GRID
   Cria o grid 8x8 com estruturas nas bordas
============================================== */
function initGrid() {
    gridElement.innerHTML = '';
    Game.state.servers = [];

    const size = 8;

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';

        // Calcula posição da célula
        const row = Math.floor(i / size);
        const col = i % size;

        // Verifica se está na borda
        const isEdge = row === 0 || row === size - 1 || col === 0 || col === size - 1;

        if (isEdge && Math.random() < 0.25) {
            // Coloca estrutura base aleatória
            const structure = baseStructures[Math.floor(Math.random() * baseStructures.length)];

            cell.innerText = structure.icon;
            cell.dataset.structure = structure.name;
            cell.dataset.occupied = "true";
            cell.style.backgroundColor = "#34495e";

            // Se for servidor, adiciona à lista de alvos
            if (structure.type === 'server') {
                cell.dataset.type = 'server';
                Game.state.servers.push(cell);
            }
        } else {
            // Célula vazia - permite construção
            cell.onclick = () => placeBuilding(cell);
        }

        gridElement.appendChild(cell);
    }

    // Garante pelo menos 1 servidor no grid
    if (Game.state.servers.length === 0) {
        const firstCell = gridElement.children[0];
        firstCell.innerText = '🖥️';
        firstCell.dataset.structure = 'Servidor';
        firstCell.dataset.type = 'server';
        firstCell.dataset.occupied = "true";
        firstCell.style.backgroundColor = "#34495e";
        Game.state.servers.push(firstCell);
    }
}

/* ==============================================
   SELEÇÃO DE CONSTRUÇÃO
   Ativado quando o jogador clica em um item da loja
============================================== */
function selectBuilding(type) {
    Game.state.selectedType = type;
    addLog(`Selecionado: ${type.toUpperCase()}`);
}

/* ==============================================
   COLOCAÇÃO DE CONSTRUÇÃO
   Constrói a defesa selecionada em uma célula vazia
============================================== */
function placeBuilding(cell) {
    const s = Game.state;
    
    // Valida se há seleção e célula está vazia
    if (!s.selectedType || cell.innerText) return;

    const data = buildingData[s.selectedType];

    // Verifica se tem dinheiro
    if (s.money < data.cost) {
        addLog("Verba insuficiente!", "log-danger");
        return;
    }

    // Deduz custo e adiciona benefícios
    s.money -= data.cost;
    s.defense = Math.min(100, s.defense + data.def);
    s.income += data.income;

    // Registra estatísticas
    s.stats.totalMoneySpent += data.cost;
    s.stats.buildingsBuilt++;

    // Ativa flags de ferramentas
    if (s.selectedType === "firewall") s.firewall = true;
    if (s.selectedType === "soc") s.soc = true;
    if (s.selectedType === "backup") s.backup = true;
    if (s.selectedType === "school") s.school = true;

    // Atualiza visual da célula
    cell.innerText = data.icon;
    cell.style.backgroundColor = "#2c3e50";

    addLog(`${s.selectedType.toUpperCase()} construído`, "log-alert");
    logEvent(`Construído: ${s.selectedType.toUpperCase()} (-${data.cost}g)`, 'warning');

    // Limpa seleção
    s.selectedType = null;
    updateUI();
}

/* ==============================================
   ATUALIZAÇÃO DA INTERFACE
   Sincroniza valores na tela com o estado do jogo
============================================== */
function updateUI() {
    document.getElementById('money').innerText = Game.state.money;
    document.getElementById('defense').innerText = Game.state.defense;
    document.getElementById('uptime').innerText = Game.state.uptime;
    document.getElementById('blocked').innerText = Game.state.attacksBlocked;
}

/* ==============================================
   SISTEMA DE LOG
   Adiciona mensagens ao console de eventos
============================================== */
function addLog(msg, className = '') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${className}`;
    entry.innerText = `> ${new Date().toLocaleTimeString()} — ${msg}`;
    logElement.prepend(entry);  // Adiciona no topo
}

/* ==============================================
   LOG DE EVENTOS (para relatório SIEM)
   Registra eventos importantes com timestamp
============================================== */
function logEvent(message, type = '') {
    const time = new Date().toLocaleTimeString();
    Game.state.stats.eventLog.push({ time, message, type });
}

/* ==============================================
   HOVER NA LOJA
   Mostra informações técnicas ao passar o mouse
============================================== */
function initShopHover() {
    document.querySelectorAll('.shop-item').forEach(button => {
        button.addEventListener('mouseenter', e => {
            const onclick = e.target.getAttribute('onclick');
            if (!onclick) return;

            const type = onclick.match(/'([^']+)'/)?.[1];
            if (!type || !buildingData[type]) return;

            document.getElementById('tech-details').innerHTML =
                `<b>Impacto Real:</b><br>${buildingData[type].realWorld}`;
        });
    });
}

/* ==============================================
   SISTEMA DE CIDADÃOS
   Cria e anima usuários circulando pela cidade
============================================== */
function spawnCitizens(amount) {
    for (let i = 0; i < amount; i++) {
        const citizen = document.createElement('div');
        citizen.className = 'citizen';
        citizen.innerText = citizenEmojis[Math.floor(Math.random() * citizenEmojis.length)];
        document.body.appendChild(citizen);

        const rect = gridElement.getBoundingClientRect();
        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + Math.random() * rect.height;

        Game.state.citizens.push({
            element: citizen,
            x, y,
            targetX: x,
            targetY: y,
            inside: false,      // Se está dentro de um prédio
            insideTimer: 0      // Tempo restante dentro
        });
    }
}

/* ==============================================
   ATUALIZAÇÃO DOS CIDADÃOS
   Move cidadãos e aplica comportamentos
============================================== */
function updateCitizens() {
    const rect = gridElement.getBoundingClientRect();
    const lowSecurity = Game.state.defense < 75;

    Game.state.citizens.forEach(c => {
        // Se estiver dentro de prédio, apenas conta o timer
        if (c.inside) {
            c.insideTimer--;
            if (c.insideTimer <= 0) {
                c.inside = false;
                c.element.style.display = 'block';
            }
            return;
        }

        // Define comportamento baseado na segurança
        const range = lowSecurity ? 120 : 40;  // Movimento mais errático se inseguro

        // Muda direção aleatoriamente
        if (Math.random() > 0.97) {
            c.targetX = clamp(
                c.x + (Math.random() - 0.5) * range,
                rect.left, rect.right - 20
            );
            c.targetY = clamp(
                c.y + (Math.random() - 0.5) * range,
                rect.top, rect.bottom - 20
            );
        }

        // Move suavemente em direção ao alvo
        c.x += (c.targetX - c.x) * 0.08;
        c.y += (c.targetY - c.y) * 0.08;

        c.element.style.left = `${c.x}px`;
        c.element.style.top = `${c.y}px`;

        // Chance de entrar em um prédio
        if (Math.random() > 0.995) {
            c.inside = true;
            c.insideTimer = 80;
            c.element.style.display = 'none';
        }

        // Aplica/remove modo pânico baseado na segurança
        c.element.classList.toggle('panic-mode', lowSecurity);
    });
}

/* ==============================================
   FUNÇÃO AUXILIAR: CLAMP
   Limita um valor entre min e max
============================================== */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/* ==============================================
   SPAWN DE ATAQUE DDoS
   Cria novo ataque visual no centro do grid
============================================== */
function spawnAttack() {
    // Não spawna se não há servidores
    if (Game.state.servers.length === 0) return;

    // Escolhe tipo aleatório
    const attackTypes = Object.keys(attackEmojis);
    const type = attackTypes[Math.floor(Math.random() * attackTypes.length)];

    // Registra estatísticas
    Game.state.stats.attacksByType[type]++;
    Game.state.stats.totalAttacks++;

    // Cria elemento visual
    const attack = document.createElement('div');
    attack.className = 'attack';
    attack.innerText = attackEmojis[type];
    document.body.appendChild(attack);

    // Define posição inicial (centro do grid)
    const gridRect = gridElement.getBoundingClientRect();
    const startX = gridRect.left + gridRect.width / 2;
    const startY = gridRect.top + gridRect.height / 2;

    // Escolhe servidor alvo aleatório
    const target = Game.state.servers[
        Math.floor(Math.random() * Game.state.servers.length)
    ];
    const targetRect = target.getBoundingClientRect();

    attack.style.left = `${startX}px`;
    attack.style.top = `${startY}px`;

    // Cria entidade de ataque
    const entity = {
        element: attack,
        type,
        x: startX,
        y: startY,
        targetX: targetRect.left + 30,
        targetY: targetRect.top + 30,
        speed: 0.03,        // Velocidade lenta para dar tempo de clicar
        alive: true
    };

    // Adiciona evento de clique para destruição manual
    attack.onclick = (e) => {
        e.stopPropagation();
        destroyAttack(entity);
    };

    Game.state.attacks.push(entity);
    addLog(`⚠️ Ataque ${type} detectado!`, "log-alert");
}

/* ==============================================
   DESTRUIÇÃO MANUAL DE ATAQUE
   Executado quando o jogador clica em um ataque
============================================== */
function destroyAttack(attackEntity) {
    if (!attackEntity.alive) return;

    attackEntity.alive = false;
    attackEntity.element.classList.add('exploding');

    // Recompensas
    Game.state.attacksBlocked++;
    Game.state.money += 20;

    // Estatísticas
    Game.state.stats.manualBlocks++;
    Game.state.stats.attacksFailed++;

    addLog(`💥 Ataque ${attackEntity.type} destruído manualmente! +20 moedas`, "log-success");
    logEvent(`BLOQUEIO MANUAL: ${attackEntity.type} (+20g)`, 'success');

    // Remove após animação
    setTimeout(() => {
        attackEntity.element.remove();
        const index = Game.state.attacks.indexOf(attackEntity);
        if (index > -1) {
            Game.state.attacks.splice(index, 1);
        }
    }, 300);

    updateUI();
}

/* ==============================================
   ATUALIZAÇÃO DOS ATAQUES
   Move ataques em direção aos servidores
============================================== */
function updateAttacks() {
    Game.state.attacks.forEach((a) => {
        if (!a.alive) return;

        // Move suavemente em direção ao alvo
        a.x += (a.targetX - a.x) * a.speed;
        a.y += (a.targetY - a.y) * a.speed;

        a.element.style.left = `${a.x}px`;
        a.element.style.top = `${a.y}px`;

        // Calcula distância até o alvo
        const dx = Math.abs(a.x - a.targetX);
        const dy = Math.abs(a.y - a.targetY);

        // Se chegou no servidor, resolve o ataque
        if (dx < 10 && dy < 10) {
            resolveAttack(a);
        }
    });
}

/* ==============================================
   RESOLUÇÃO DE ATAQUE
   Determina se ataque é bloqueado ou causa dano
============================================== */
function resolveAttack(attack) {
    if (!attack.alive) return;

    const s = Game.state;

    // ========================================
    // CÁLCULO DE CHANCE DE BLOQUEIO
    // ========================================
    let blockChance = s.defense * 0.5;  // Base: 50% da defesa

    // Bônus por ferramentas
    if (s.firewall) blockChance += 10;
    if (s.soc) blockChance += 15;

    // ========================================
    // TESTE DE BLOQUEIO AUTOMÁTICO
    // ========================================
    if (Math.random() * 100 < blockChance) {
        // BLOQUEADO
        attack.alive = false;
        attack.element.remove();
        s.attacksBlocked++;
        
        s.stats.autoBlocks++;
        s.stats.attacksFailed++;
        
        addLog(`🛡️ Ataque ${attack.type} bloqueado automaticamente!`, "log-alert");
        logEvent(`BLOQUEIO AUTO: ${attack.type}`, 'warning');
        
        const index = Game.state.attacks.indexOf(attack);
        if (index > -1) {
            Game.state.attacks.splice(index, 1);
        }
        updateUI();
        return;
    }

    // ========================================
    // ATAQUE BEM-SUCEDIDO - CAUSA DANO
    // ========================================
    let defenseDamage = 1;  // Dano base de 1%

    // Backup reduz dano pela metade
    if (s.backup) {
        defenseDamage *= 0.5;
    }

    // Aplica dano
    s.defense = Math.max(0, s.defense - defenseDamage);

    // Registra estatísticas
    s.stats.attacksSuccess++;

    attack.alive = false;
    attack.element.remove();

    addLog(
        `🚨 DDoS ${attack.type} atingiu servidor! -${defenseDamage.toFixed(1)}% defesa`,
        "log-danger"
    );
    logEvent(`ATAQUE SUCESSO: ${attack.type} (-${defenseDamage.toFixed(1)}% defesa)`, 'danger');

    const index = Game.state.attacks.indexOf(attack);
    if (index > -1) {
        Game.state.attacks.splice(index, 1);
    }

    checkGameOver();
    updateUI();
}

/* ==============================================
   GAME OVER
   Finaliza o jogo e exibe tela de resumo
============================================== */
function endGame() {
    // Para todos os loops
    clearInterval(Game.interval);
    clearInterval(Game.citizenInterval);
    clearInterval(Game.attackSpawnInterval);
    clearInterval(Game.attackUpdateInterval);

    addLog("FALHA CRÍTICA DE SEGURANÇA. OPERAÇÃO COMPROMETIDA.", "log-danger");
    logEvent("FALHA CRÍTICA - SISTEMA COMPROMETIDO", 'danger');

    // Calcula tempo de jogo
    const gameTime = Math.floor((Date.now() - Game.state.stats.gameStartTime) / 1000);
    Game.state.stats.gameTime = gameTime;

    // Calcula score final
    const score = calculateScore();

    // Salva no localStorage
    saveGameLocally(score);

    // Mostra tela de game over
    setTimeout(() => {
        showGameOverScreen(score);
    }, 1000);
}

/* ==============================================
   VERIFICAÇÃO DE GAME OVER
   Checa se alguma condição de derrota foi atingida
============================================== */
function checkGameOver() {
    if (Game.state.defense <= 0 || Game.state.uptime <= 0) {
        endGame();
    }
}

/* ==============================================
   TELA DE GAME OVER
   Exibe resumo rápido antes do relatório SIEM
============================================== */
function showGameOverScreen(score) {
    const s = Game.state;
    const stats = s.stats;

    document.getElementById('go-time').innerText = formatTime(stats.gameTime);
    document.getElementById('go-blocked').innerText = s.attacksBlocked;
    document.getElementById('go-defense').innerText = `${s.defense.toFixed(1)}%`;
    document.getElementById('go-money').innerText = s.money;
    document.getElementById('go-score').innerText = score;

    document.getElementById('gameover-screen').style.display = 'flex';
}

/* ==============================================
   CÁLCULO DE SCORE
   Fórmula para pontuação final
============================================== */
function calculateScore() {
    const s = Game.state;
    const stats = s.stats;

    return Math.floor(
        (s.money * 0.5) +              // 50% do dinheiro
        (stats.attacksFailed * 10) +   // 10 pontos por ataque bloqueado
        (stats.manualBlocks * 20) +    // 20 pontos por bloqueio manual
        (stats.buildingsBuilt * 50) +  // 50 pontos por construção
        (stats.gameTime * 2)           // 2 pontos por segundo de sobrevivência
    );
}

/* ==============================================
   DASHBOARD SIEM
   Relatório detalhado de segurança
============================================== */
function showSIEMDashboard() {
    // Esconde tela de game over
    document.getElementById('gameover-screen').style.display = 'none';

    const s = Game.state;
    const stats = s.stats;
    const score = calculateScore();

    // ========================================
    // PREENCHE CABEÇALHO
    // ========================================
    document.getElementById('siem-timestamp').innerText = new Date().toLocaleString();
    document.getElementById('final-score').innerText = score;
    
    // ========================================
    // ESTATÍSTICAS GERAIS
    // ========================================
    document.getElementById('game-duration').innerText = formatTime(stats.gameTime);
    document.getElementById('final-defense').innerText = `${s.defense.toFixed(1)}%`;
    document.getElementById('max-defense').innerText = `${stats.maxDefense.toFixed(1)}%`;
    document.getElementById('min-defense').innerText = `${stats.minDefense.toFixed(1)}%`;
    document.getElementById('final-uptime').innerText = `${s.uptime.toFixed(1)}%`;
    
    // ========================================
    // ANÁLISE DE ATAQUES
    // ========================================
    document.getElementById('total-attacks').innerText = stats.totalAttacks;
    document.getElementById('attacks-success').innerText = stats.attacksSuccess;
    document.getElementById('auto-blocks').innerText = stats.autoBlocks;
    document.getElementById('manual-blocks').innerText = stats.manualBlocks;
    
    const blockRate = stats.totalAttacks > 0 
        ? ((stats.attacksFailed / stats.totalAttacks) * 100).toFixed(1)
        : 0;
    document.getElementById('block-rate').innerText = `${blockRate}%`;
    
    // ========================================
    // PERFORMANCE FINANCEIRA
    // ========================================
    document.getElementById('final-money').innerText = s.money;
    document.getElementById('total-spent').innerText = stats.totalMoneySpent;
    document.getElementById('buildings-built').innerText = stats.buildingsBuilt;
    document.getElementById('income-rate').innerText = `${s.income}/5s`;
    
    // ========================================
    // GRÁFICOS DE ATAQUES POR TIPO
    // ========================================
    const totalAttacksByType = 
        stats.attacksByType.phishing +
        stats.attacksByType.malware +
        stats.attacksByType.ransomware +
        stats.attacksByType.ddos;
    
    if (totalAttacksByType > 0) {
        updateAttackBar('phishing', stats.attacksByType.phishing, totalAttacksByType);
        updateAttackBar('malware', stats.attacksByType.malware, totalAttacksByType);
        updateAttackBar('ransomware', stats.attacksByType.ransomware, totalAttacksByType);
        updateAttackBar('ddos', stats.attacksByType.ddos, totalAttacksByType);
    }
    
    // ========================================
    // TIMELINE DE EVENTOS
    // ========================================
    const timeline = document.getElementById('event-timeline');
    timeline.innerHTML = '';
    
    // Mostra os últimos 20 eventos, do mais recente ao mais antigo
    stats.eventLog.slice(-20).reverse().forEach(event => {
        const entry = document.createElement('div');
        entry.className = `timeline-entry ${event.type}`;
        entry.innerText = `[${event.time}] ${event.message}`;
        timeline.appendChild(entry);
    });
    
    // Mostra o dashboard
    document.getElementById('siem-dashboard').style.display = 'flex';
}

/* ==============================================
   ATUALIZAÇÃO DE BARRA DE ATAQUE
   Anima barras de progresso no SIEM
============================================== */
function updateAttackBar(type, count, total) {
    const percentage = ((count / total) * 100).toFixed(1);
    document.getElementById(`${type}-count`).innerText = count;
    
    const bar = document.getElementById(`${type}-bar`);
    
    // Anima com delay
    setTimeout(() => {
        bar.style.width = `${percentage}%`;
        bar.innerText = `${percentage}%`;
    }, 300);
}

/* ==============================================
   FORMATAÇÃO DE TEMPO
   Converte segundos em formato "Xm Ys"
============================================== */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

/* ==============================================
   SALVAR JOGO LOCALMENTE
   Armazena histórico no localStorage
============================================== */
function saveGameLocally(score) {
    try {
        const s = Game.state;
        const stats = s.stats;

        const gameData = {
            score: score,
            timestamp: new Date().toISOString(),
            duration: stats.gameTime,
            defense: s.defense,
            money: s.money,
            attacksBlocked: stats.attacksFailed
        };

        // Recupera histórico
        let history = JSON.parse(localStorage.getItem('seccity_history') || '[]');
        history.push(gameData);
        
        // Mantém apenas os últimos 10 jogos
        if (history.length > 10) {
            history = history.slice(-10);
        }
        
        localStorage.setItem('seccity_history', JSON.stringify(history));
        console.log("✅ Jogo salvo localmente");
    } catch (error) {
        console.error("❌ Erro ao salvar localmente:", error);
    }
}

/* ==============================================
   DOWNLOAD DE RELATÓRIO
   Exporta dados completos em arquivo .txt
============================================== */
function downloadReport() {
    const s = Game.state;
    const stats = s.stats;
    
    const report = `
==============================================
    SIEM - RELATÓRIO DE SEGURANÇA
==============================================
Data: ${new Date().toLocaleString()}
Duração: ${formatTime(stats.gameTime)}

ESTATÍSTICAS GERAIS:
- Defesa Final: ${s.defense.toFixed(1)}%
- Defesa Máxima: ${stats.maxDefense.toFixed(1)}%
- Defesa Mínima: ${stats.minDefense.toFixed(1)}%
- Uptime Final: ${s.uptime.toFixed(1)}%

ANÁLISE DE ATAQUES:
- Total de Ataques: ${stats.totalAttacks}
- Ataques Bem-Sucedidos: ${stats.attacksSuccess}
- Bloqueios Automáticos: ${stats.autoBlocks}
- Bloqueios Manuais: ${stats.manualBlocks}
- Taxa de Bloqueio: ${((stats.attacksFailed / stats.totalAttacks) * 100).toFixed(1)}%

ATAQUES POR TIPO:
- Phishing: ${stats.attacksByType.phishing}
- Malware: ${stats.attacksByType.malware}
- Ransomware: ${stats.attacksByType.ransomware}
- DDoS: ${stats.attacksByType.ddos}

PERFORMANCE FINANCEIRA:
- Moedas Finais: ${s.money}
- Total Gasto: ${stats.totalMoneySpent}
- Estruturas Construídas: ${stats.buildingsBuilt}
- Receita: ${s.income}/5s

TIMELINE DE EVENTOS:
${stats.eventLog.map(e => `[${e.time}] ${e.message}`).join('\n')}

==============================================
`;

    // Cria e baixa arquivo
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `siem-report-${Date.now()}.txt`;
    a.click();
}