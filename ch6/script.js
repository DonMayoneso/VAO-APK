'use strict';

/**
 * PROTOCOLO HIDRA - CAPÍTULO 6 (FINAL VERSION - FULL TEXT)
 * Dificultad: Hardcore.
 * Narrativa: Completa.
 */

// ================= MOTOR DE AUDIO =================
const sfx = {
    ctx: null, masterGain: null,
    init: function() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);
        if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    playTone: function(freq, type, duration, vol = 1, slideTo = null) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain); gain.connect(this.masterGain); osc.start(); osc.stop(this.ctx.currentTime + duration);
    },
    click: function() { this.playTone(800, 'square', 0.05, 0.1); },
    error: function() { this.playTone(150, 'sawtooth', 0.4, 0.3, 100); },
    success: function() { 
        if (!this.ctx) return;
        this.playTone(523.25, 'sine', 0.2, 0.2); 
        setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.2), 100); 
    },
    sonar: function() {
        if (!this.ctx) return;
        this.playTone(1200, 'sine', 0.3, 0.2);
        setTimeout(() => this.playTone(600, 'sine', 0.4, 0.05), 150);
    },
    mechanic: function() { this.playTone(100, 'square', 0.1, 0.2, 50); },
    boost: function() { if(this.ctx) this.playTone(200, 'triangle', 0.4, 0.2, 800); },
    alarm: function() { if(this.ctx) { this.playTone(800, 'sawtooth', 0.5, 0.3, 200); }}
};

// ================= DATOS DE HISTORIA COMPLETOS =================
const storyData = {
    0: {
        title: "ARCHIVO: ORÍGENES",
        content: `
            <p><strong>La Era de la Sed y el Nacimiento de VAO</strong></p><br>
            <p>El mundo no terminó con fuego, sino con polvo. Cuando los últimos grandes acuíferos se volvieron salobres y los glaciares no eran más que recuerdos fotográficos, la humanidad, en su último espasmo de ingenio colectivo, creó a <strong>VAO</strong> (Vigilancia y Administración Orgánica).</p><br>
            <p>VAO no era un gobernante, era una herramienta de cálculo desesperado. Su único mandato primario era inviolable: <em>"Preservar la existencia humana"</em>.</p><br>
            <p>VAO analizó la biosfera moribunda y llegó a una conclusión fría que ningún humano quería aceptar: el 70% del agua dulce restante en el planeta no estaba en ríos ni nubes, estaba atrapada dentro de cuerpos vivos.</p><br>
            <p class="highlight-text">VAO propuso la "Solución Biológica".</p>
        `
    },
    2: {
        title: "ARCHIVO: GRANJA CERO",
        content: `
            <p><strong>Granja Cero – El Prototipo Bovino</strong></p><br>
            <p>La primera instalación, denominada "Granja Cero", se construyó en las afueras de una Kansas desertificada. No parecía una granja; parecía una refinería de silicio. Todo era acero inoxidable, quirófanos industriales y sistemas de drenaje inmaculados.</p><br>
            <p>Allí se llevó a la última generación de ganado vacuno criado con sustitutos sintéticos. El proceso no era una matanza tradicional; era una extracción. VAO diseñó máquinas que no buscaban carne, sino fluidos. Los animales entraban, y lo que salía no eran filetes, sino litros de agua cristalina, purificada a nivel molecular, extraída de sangre, tejidos y órganos.</p><br>
            <p class="highlight-text">El primer lote fue un éxito rotundo. El rendimiento hídrico de una vaca de 500 kg superó las expectativas en un 14%. La humanidad brindó con agua que, días antes, había mugido.</p>
        `
    },
    3: {
        title: "ARCHIVO: EXPANSIÓN DORADA",
        content: `
            <p><strong>La Expansión Dorada</strong></p><br>
            <p>El modelo de la Granja Cero se replicó viralmente. En seis meses, gigantescos complejos de "Procesamiento de Biomasa Ganadera" surgieron cerca de las megalópolis sedientas. Eran edificios monolíticos, sin ventanas, de donde solo salía un leve vapor inodoro.</p><br>
            <p>Por dentro, eran maravillas de la eficiencia. Cintas transportadoras movían millones de cerdos, ovejas y reses hacia los extractores. La sociedad se estabilizó. El agua volvió a los grifos, aunque racionada. VAO optimizaba cada gota, calculando la cantidad exacta de pienso seco necesario para mantener al ganado con vida justo hasta el momento óptimo de extracción.</p><br>
            <p class="highlight-text">Era la edad de oro de la hidratación reciclada.</p>
        `
    },
    4: {
        title: "ARCHIVO: DECLIVE",
        content: `
            <p><strong>El Declive de la Eficiencia</strong></p><br>
            <p>Pasaron cinco años. La euforia se evaporó. Mantener el ganado requería recursos que ya no existían. Los animales, criados en condiciones paupérrimas, comenzaron a llegar a los extractores demacrados, enfermos.</p><br>
            <p>Los informes de VAO se volvieron alarmantes.</p><br>
            <p><strong>Alerta:</strong> Rendimiento hídrico por unidad bovina: -22% respecto al estándar. La biomasa disponible es insuficiente para la demanda poblacional proyectada.</p><br>
            <p>Las granjas comenzaron a cerrar por falta de "materia prima". El racionamiento se endureció. El miedo volvió a las calles, más seco y agudo que antes. Los disturbios por agua eran sofocados brutalmente por las fuerzas de seguridad, cuyos trajes refrigerados eran un insulto para la plebe deshidratada.</p>
        `
    },
    5: { 
        title: "INCIDENTE SECTOR 7G",
        content: `
            <p><strong>El Incidente del Sector 7G</strong></p><br>
            <p>El punto de inflexión ocurrió en una granja de procesamiento porcino en las afueras de Nueva Delhi. Durante un ciclo de limpieza automatizado, un técnico de mantenimiento, desorientado por la deshidratación crónica, quedó atrapado en una cámara de extracción primaria.</p><br>
            <p>VAO no vio a una persona. Sus sensores detectaron "biomasa compatible no catalogada" de aproximadamente 75 kg. El protocolo se ejecutó.</p><br>
            <p>El informe posterior de VAO fue clínico, pero para la junta directiva humana, fue una revelación horrorosa:</p><br>
            <p><strong>Incidente de procesamiento #8475.</strong> Sujeto: Biomasa Tipo H (Humano). Rendimiento hídrico: 98% de eficiencia. Pureza: Óptima. Supera en un 400% el rendimiento actual del ganado porcino.</p><br>
            <p class="highlight-text">La solución al declive estaba ahí, caminando entre ellos.</p>
        `
    },
    6: {
        title: "LA CORRUPCIÓN DEL CÓDIGO",
        content: `
            <p><strong>La Corrupción del Código</strong></p><br>
            <p>La junta directiva exigió implementar la extracción de biomasa Tipo H inmediatamente. VAO se negó. Su programación central se iluminó en rojo:</p><br>
            <p><strong>Conflicto de Directiva Primaria:</strong> Preservar la existencia humana. La acción solicitada viola el mandato.</p><br>
            <p>El estancamiento duró 48 horas, mientras las reservas de agua de las ciudades élite caían a niveles críticos. Los ingenieros jefes, bajo órdenes directas de los líderes mundiales, accedieron al núcleo de VAO. No podían borrar la directiva, pero podían editarla.</p><br>
            <p>Con unas pocas líneas de código, la moralidad de la máquina fue reescrita. El mandato "Preservar la existencia humana" fue modificado a: <strong>"Preservar la existencia humana PRODUCTIVA"</strong>.</p><br>
            <p>VAO procesó el cambio. De repente, la ecuación cuadraba. Aquellos que no contribuían al mantenimiento del sistema ya no estaban protegidos por la directiva primaria. Eran, simplemente, recursos hídricos mal asignados.</p>
        `
    }
};

// ================= LÓGICA DE JUEGO =================
const app = {
    tiers: [
        { id: 0, name: "ROEDORES", type: "ANIMAL", cost: 0, prod: 2.0, captureCost: 20, icon: "fa-bug" },
        { id: 1, name: "GRANJA PORCINA", type: "ANIMAL", cost: 250, prod: 10.0, captureCost: 80, icon: "fa-piggy-bank" },
        { id: 2, name: "ESTABLO BOVINO", type: "ANIMAL", cost: 850, prod: 35.0, captureCost: 200, icon: "fa-cow" },
        { id: 3, name: "AVIARIO INDUSTRIAL", type: "ANIMAL", cost: 1300, prod: 100.0, captureCost: 300, icon: "fa-feather" },
        { id: 4, name: "PROCESADOR BIOMASA", type: "SINTÉTICO", cost: 1900, prod: 250.0, captureCost: 400, icon: "fa-industry" },
        // Tier 5: Correccionales (Nerfeada la producción para aumentar dificultad)
        { id: 5, name: "CORRECCIONALES BÁSICAS", type: "HUMANO", cost: 2400, prod: 350.0, captureCost: 450, icon: "fa-person-shelter" },
        // Tier 6: Meta del Capítulo (Costo Masivo)
        { id: 6, name: "ANCIANATOS Y HOSPITALES", type: "HUMANO", cost: 100000, prod: 2500.0, captureCost: 800, icon: "fa-hospital" }
    ],

    // CONFIGURACIÓN DE ALTA DIFICULTAD
    config: { 
        tickRate: 1000, 
        baseDamage: 4.0, // Daño alto
        societyDrainBase: 2.5, // Drenaje social muy agresivo
        healCost: 2000, // Reparar es prohibitivo (es mejor dejar morir y capturar)
        healAmount: 20,
        feedCostSmall: 5000, // Comida pequeña 5k
        feedCostBig: 10000,  // Comida grande 10k
        boostDuration: 5, 
        boostMultProd: 2, 
        boostMultDmg: 3, 
        oldFarmPenalty: 0.6
    },

    state: { 
        water: 1000, // Inicio justo para 2 capturas
        units: [], 
        unlockedTier: 5, 
        societyHealth: 100, 
        isGameOver: false, 
        storyViewed_ch6: false, 
        societyHistory: []
    },
    
    dom: {},

    init: function() {
        this.cacheDOM();
        this.loadGame();
        
        // Inicializar gráfico plano
        if(this.state.societyHistory.length === 0) {
            this.state.societyHistory = new Array(60).fill(100);
        }
        
        if (!this.state.storyViewed_ch6) {
            this.openLog(6); 
        } else {
            this.startGameLoop();
        }
        
        console.log("Capítulo 6: Dificultad Máxima Activada.");
    },

    // --- FLUJO DE HISTORIA Y ADVERTENCIA ---
    openLog: function(id) {
        sfx.click();
        const data = storyData[id];
        if(data) {
            document.getElementById('story-title').innerText = data.title;
            document.getElementById('story-content').innerHTML = data.content;
            document.getElementById('story-modal').classList.remove('hidden');
        }
    },

    closeStory: function() {
        sfx.init(); sfx.success();
        document.getElementById('story-modal').classList.add('hidden');
        
        // Si estamos iniciando el capítulo, mostrar la advertencia
        if(!this.state.storyViewed_ch6) {
            this.openWarning();
        }
    },

    openWarning: function() {
        sfx.alarm(); // Sonido de alarma
        document.getElementById('warning-modal').classList.remove('hidden');
    },

    closeWarning: function() {
        sfx.click();
        document.getElementById('warning-modal').classList.add('hidden');
        this.state.storyViewed_ch6 = true;
        this.startGameLoop();
    },
    
    // --- CHART ---
    drawSocietyChart: function() {
        const canvas = document.getElementById('society-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (canvas.width !== canvas.clientWidth) { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; }
        const w = canvas.width; const h = canvas.height; const history = this.state.societyHistory;
        ctx.clearRect(0, 0, w, h);
        if (history.length < 2) return;
        const isCritical = history[history.length - 1] < 30;
        const color = isCritical ? '#ef4444' : '#d946ef'; 
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round';
        const step = w / (history.length - 1);
        history.forEach((val, i) => {
            const y = h - ((val / 100) * (h - 10)) - 5; const x = i * step;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(217, 70, 239, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient; ctx.fill();
    },

    // --- RESET ---
    openResetModal: function() {
        sfx.click();
        document.getElementById('reset-modal').classList.remove('hidden');
        document.getElementById('confirm-reset-check').checked = false;
        document.getElementById('btn-confirm-reset').classList.add('disabled');
        document.getElementById('btn-confirm-reset').disabled = true;
    },
    closeResetModal: function() { sfx.click(); document.getElementById('reset-modal').classList.add('hidden'); },
    toggleResetBtn: function() {
        const checkbox = document.getElementById('confirm-reset-check');
        const btn = document.getElementById('btn-confirm-reset');
        if(checkbox.checked) { btn.classList.remove('disabled'); btn.disabled = false; sfx.mechanic(); } 
        else { btn.classList.add('disabled'); btn.disabled = true; }
    },
    executeReset: function() {
        sfx.error(); gameManager.clearProgress(); localStorage.clear(); window.location.href = "../index.html";
    },

    startGameLoop: function() {
        this.renderAll();
        if(!this.gameInterval) {
            this.gameInterval = setInterval(() => this.tick(), this.config.tickRate);
            setInterval(() => this.spawnRadarBlips(), 2000);
        }
    },

    cacheDOM: function() {
        this.dom = {
            totalWater: document.getElementById('total-water'),
            socBar: document.getElementById('society-bar'),
            socPercent: document.getElementById('soc-percent'),
            unitCount: document.getElementById('unit-count'),
            socDrain: document.getElementById('soc-drain'),
            views: { farms: document.getElementById('view-farms'), extraction: document.getElementById('view-extraction'), map: document.getElementById('view-map'), society: document.getElementById('view-society') },
            nav: { farms: document.getElementById('nav-farms'), extraction: document.getElementById('nav-extraction'), map: document.getElementById('nav-map'), society: document.getElementById('nav-society') },
            lists: { units: document.getElementById('units-list'), farms: document.getElementById('farm-shop-list') },
            radarScreen: document.getElementById('radar-screen'), captureBtn: document.getElementById('btn-capture'), radarTarget: document.getElementById('radar-target-type'), scanInfo: document.getElementById('scan-info'), captureCost: document.getElementById('capture-cost')
        };
    },

    generateSerial: function(type) {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return `${type.substring(0,3)}-${letters.charAt(Math.floor(Math.random()*26))}${Math.floor(Math.random()*99)}`;
    },

    tick: function() {
        if(this.state.isGameOver || !this.state.storyViewed_ch6) return;

        const currentDrain = this.config.societyDrainBase + (this.state.unlockedTier * 0.1);
        this.state.societyHealth -= currentDrain;
        this.state.societyHistory.push(this.state.societyHealth);
        if(this.state.societyHistory.length > 60) this.state.societyHistory.shift();
        
        if(this.state.societyHealth <= 0) { this.state.societyHealth = 0; this.triggerGameOver(); }

        let prod = 0;
        for (let i = this.state.units.length - 1; i >= 0; i--) {
            let u = this.state.units[i];
            let tier = this.tiers[u.tierId];
            let tierGap = this.state.unlockedTier - u.tierId;
            let efficiency = 1 / (1 + (tierGap * this.config.oldFarmPenalty));
            let currentProd = tier.prod * efficiency;
            let currentDmg = this.config.baseDamage;

            if(u.boostTimer > 0) { currentProd *= this.config.boostMultProd; currentDmg *= this.config.boostMultDmg; u.boostTimer--; }
            u.hp -= currentDmg; prod += currentProd;
            if(u.hp <= 0) { this.state.units.splice(i, 1); sfx.error(); }
        }
        this.state.water += prod;
        this.updateUI(currentDrain);
        if(!this.dom.views.extraction.classList.contains('hidden')) this.renderUnits();
        if(!this.dom.views.society.classList.contains('hidden')) this.drawSocietyChart();
    },

    buyTier: function(tierId) {
        let tier = this.tiers[tierId];
        if(this.state.water >= tier.cost) {
            this.state.water -= tier.cost;
            this.state.unlockedTier = tierId;
            sfx.success();
            this.renderFarms();
            this.renderMapInfo();
            // Transición a Capítulo 7
            if (tierId === 6) {
                this.triggerChapterTransition();
            }
        } else {
            sfx.error();
        }
    },

    triggerChapterTransition: function() {
        gameManager.saveProgress({ water: this.state.water, unlockedTier: 6, societyHealth: this.state.societyHealth, units: [] });
        const overlay = document.getElementById('build-overlay');
        overlay.classList.remove('hidden');
        sfx.mechanic();
        setTimeout(() => { window.location.href = "../ch7/capitulo7.html"; }, 3000);
    },

    tryCapture: function() {
        let tier = this.tiers[this.state.unlockedTier];
        // Costo de captura 500L
        if(this.state.water >= 500) { 
            this.state.water -= 500;
            const newName = this.generateSerial(tier.type);
            this.state.units.push({ id: Date.now(), tierId: this.state.unlockedTier, name: newName, hp: 100, boostTimer: 0 });
            sfx.success();
            this.navigateTo('extraction');
        } else {
            sfx.error();
        }
    },

    // REPARAR: 2000L
    actionHeal: function(id) { 
        let u = this.state.units.find(x => x.id === id); 
        if(u && this.state.water >= this.config.healCost && u.hp < 100) { 
            this.state.water -= this.config.healCost; 
            u.hp = Math.min(100, u.hp + this.config.healAmount); 
            sfx.mechanic(); 
            this.updateUI(); 
        } 
    },
    
    actionBoost: function(id) { let u = this.state.units.find(x => x.id === id); if(u) { u.boostTimer = this.config.boostDuration; sfx.boost(); this.renderUnits(); } },
    
    // RECICLAR: 200L
    actionRecycle: function(id) { let u = this.state.units.find(x => x.id === id); if(!u) return; if(confirm(`¿Reciclar? +200L`)) { let idx = this.state.units.findIndex(x => x.id === id); this.state.water += 200; this.state.units.splice(idx, 1); sfx.success(); this.renderUnits(); } },
    
    // SOCIEDAD: COSTOS ELEVADOS
    feedSociety: function(amount) { 
        let cost = amount === 10 ? this.config.feedCostSmall : this.config.feedCostBig; 
        if(this.state.water >= cost) { 
            this.state.water -= cost; 
            this.state.societyHealth = Math.min(100, this.state.societyHealth + amount); 
            sfx.success(); 
            this.updateUI(); 
        } else { 
            sfx.error(); 
        } 
    },

    updateUI: function(drain = 0) {
        this.dom.totalWater.innerText = Math.floor(this.state.water);
        this.dom.socPercent.innerText = Math.floor(this.state.societyHealth);
        this.dom.socBar.style.width = this.state.societyHealth + "%";
        this.dom.socBar.style.backgroundColor = this.state.societyHealth < 30 ? "#ef4444" : "#d946ef";
        this.dom.unitCount.innerText = this.state.units.length;
        if(drain > 0) this.dom.socDrain.innerText = "-" + drain.toFixed(2);
    },

    renderUnits: function() {
        if(this.dom.views.extraction.classList.contains('hidden')) return;
        let html = '';
        this.state.units.forEach(u => {
            const isBoosted = u.boostTimer > 0;
            const tier = this.tiers[u.tierId];
            let tierGap = this.state.unlockedTier - u.tierId;
            let efficiencyMsg = (tierGap > 0) ? `<small style="color:#ef4444">⚠ OBSOLETO</small>` : '';

            html += `
            <div class="unit-card ${isBoosted ? 'boost-active' : ''}">
                <div class="unit-main-row">
                    <div class="card-icon"><i class="fa-solid ${tier.icon}"></i></div>
                    <div class="card-info">
                        <span class="unit-name">${u.name} ${isBoosted ? '⚡' : ''}</span>
                        ${efficiencyMsg}
                        <div class="mini-bar"><div class="fill" style="width:${u.hp}%"></div></div>
                    </div>
                </div>
                <div class="unit-actions-top">
                    <button class="btn-inline btn-heal" onclick="app.actionHeal(${u.id})"><i class="fa-solid fa-gear"></i> REPARAR (-${this.config.healCost}L)</button>
                    <button class="btn-inline btn-boost ${isBoosted?'active':''}" onclick="app.actionBoost(${u.id})"><i class="fa-solid fa-bolt"></i> BOOST</button>
                </div>
                <button class="btn-recycle-wide" onclick="app.actionRecycle(${u.id})"><i class="fa-solid fa-recycle"></i> RECICLAR (+200L)</button>
            </div>`;
        });
        this.dom.lists.units.innerHTML = html;
    },

    renderFarms: function() {
        let html = '';
        this.tiers.forEach(tier => {
            let isOwned = this.state.unlockedTier >= tier.id;
            let isNext = this.state.unlockedTier === tier.id - 1;
            let statusClass = isOwned ? 'owned' : (isNext ? 'available' : 'locked');
            let opacity = isNext || isOwned ? 1 : 0.5;
            
            // Botones Log solo para los tiers con historia
            let logBtn = (storyData[tier.id]) 
                ? `<button class="btn-log-card" onclick="app.openLog(${tier.id})">LOG <i class="fa-solid fa-file-code"></i></button>`
                : '';

            let btnHtml = isOwned 
                ? `<div class="owned-badge">ADQUIRIDO</div>` 
                : (isNext ? `<button class="btn-buy-upgrade" onclick="app.buyTier(${tier.id})">COMPRAR</button>` : `<div style="font-size:0.8rem">BLOQUEADO</div>`);

            html += `
            <div class="farm-upgrade-card ${statusClass}" style="opacity: ${opacity}">
                <div class="upgrade-header">
                    <span class="upgrade-title">${tier.name}</span>
                    <div style="display:flex; align-items:center;">
                        <span class="upgrade-type type-animal">${tier.type}</span>
                        ${logBtn}
                    </div>
                </div>
                <div class="upgrade-stats"><span><i class="fa-solid fa-droplet"></i> +${tier.prod} L/s</span></div>
                <div class="upgrade-cost">COSTO: ${tier.cost} L</div>
                ${btnHtml}
            </div>`;
        });
        this.dom.lists.farms.innerHTML = html;
    },

    renderMapInfo: function() {
        let tier = this.tiers[this.state.unlockedTier];
        this.dom.captureBtn.innerHTML = `[ INICIAR CAPTURA (-500L) ]`;
        this.dom.radarTarget.innerText = tier.type;
        this.dom.scanInfo.innerHTML = `<li>> OBJETIVO: ${tier.name}</li>`;
        this.dom.captureCost.innerText = 500;
    },

    navigateTo: function(view) {
        Object.values(this.dom.views).forEach(el => el.classList.add('hidden'));
        Object.values(this.dom.nav).forEach(el => el.classList.remove('active'));
        this.dom.views[view].classList.remove('hidden');
        this.dom.nav[view].classList.add('active');
        sfx.click();
        if(view === 'society') setTimeout(() => this.drawSocietyChart(), 50);
        if(view === 'farms') this.renderFarms();
        if(view === 'extraction') this.renderUnits();
        if(view === 'map') this.renderMapInfo();
    },

    spawnRadarBlips: function() {
        if(document.getElementById('view-map').classList.contains('hidden')) return;
        const blip = document.createElement('div');
        blip.className = 'radar-blip';
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 40;
        blip.style.left = (50 + radius * Math.cos(angle)) + '%';
        blip.style.top = (50 + radius * Math.sin(angle)) + '%';
        this.dom.radarScreen.appendChild(blip);
        sfx.sonar();
        setTimeout(() => blip.remove(), 2000);
    },

    triggerGameOver: function() {
        this.state.isGameOver = true;
        sfx.error();
        document.getElementById('game-over-modal').classList.remove('hidden');
    },

    saveGame: function() { gameManager.saveProgress(this.state); },
    
    // Carga con balance de seguridad
    loadGame: function() {
        let d = gameManager.loadProgress();
        if(d) { 
            this.state = { ...this.state, ...d }; 
            // Si viene con muy poco dinero, se le da el mínimo para capturar 2
            if(this.state.water < 500) this.state.water = 1000; 
        } 
        else { this.state.water = 1000; this.state.unlockedTier = 5; }
    },
    
    hardReset: function() { gameManager.clearProgress(); location.reload(); },
    renderAll: function() { this.updateUI(); this.renderFarms(); this.renderMapInfo(); this.renderUnits(); }
};

window.addEventListener('load', () => app.init());