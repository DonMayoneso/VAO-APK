'use strict';

/**
 * PROTOCOLO HIDRA - CAPÍTULO 3 (REBALANCEADO - AUDIO FIX)
 * Ajustes: Captura Aviario 300L, Inicio 600L.
 * Audio: Corregido para iniciar tras interacción del usuario.
 */

// ================= MOTOR DE AUDIO =================
const sfx = {
    ctx: null, 
    masterGain: null,
    
    // Ahora init devuelve una promesa para asegurar que el audio esté listo antes de tocar
    init: function() {
        return new Promise((resolve) => {
            // 1. Crear el contexto si no existe
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioContext();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 0.3;
                this.masterGain.connect(this.ctx.destination);
            }

            // 2. Reanudar si está suspendido (Política de Autoplay)
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().then(() => {
                    console.log("AudioContext reanudado.");
                    resolve();
                });
            } else {
                resolve();
            }
        });
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
    
    // Modificado para asegurar inicialización
    success: function() { 
        if (!this.ctx) {
            this.init().then(() => {
                this.playTone(523.25, 'sine', 0.2, 0.2); 
                setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.2), 100);
            });
        } else {
            this.playTone(523.25, 'sine', 0.2, 0.2); 
            setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.2), 100); 
        }
    },
    
    sonar: function() {
        if (!this.ctx) return;
        this.playTone(1200, 'sine', 0.3, 0.2);
        setTimeout(() => this.playTone(600, 'sine', 0.4, 0.05), 150);
    },
    mechanic: function() { this.playTone(100, 'square', 0.1, 0.2, 50); },
    boost: function() { if(this.ctx) this.playTone(200, 'triangle', 0.4, 0.2, 800); }
};

// ================= DATOS DE HISTORIA =================
const storyData = {
    0: {
        title: "ARCHIVO: ORÍGENES",
        content: `<p>La Era de la Sed y el Nacimiento de VAO...</p><p class="highlight-text">VAO propuso la "Solución Biológica".</p>`
    },
    2: {
        title: "ARCHIVO: GRANJA CERO",
        content: `<p>El primer lote fue un éxito rotundo. La humanidad brindó con agua que, días antes, había mugido.</p>`
    },
    3: {
        title: "ARCHIVO: EXPANSIÓN DORADA",
        content: `
            <p>El modelo de la Granja Cero se replicó viralmente. En seis meses, gigantescos complejos de "Procesamiento de Biomasa Ganadera" surgieron cerca de las megalópolis.</p><br>
            <p>Cintas transportadoras movían millones de cerdos, ovejas y reses hacia los extractores. La sociedad se estabilizó. El agua volvió a los grifos, aunque racionada.</p><br>
            <p class="highlight-text">VAO optimizaba cada gota. Era la edad de oro de la hidratación reciclada.</p>
        `
    }
};

// ================= LÓGICA DE JUEGO =================
const app = {
    tiers: [
        { id: 0, name: "ROEDORES (OBSOLETO)", type: "ANIMAL", cost: 0, prod: 2.0, captureCost: 20, icon: "fa-bug" },
        { id: 1, name: "GRANJA PORCINA", type: "ANIMAL", cost: 250, prod: 10.0, captureCost: 80, icon: "fa-piggy-bank" },
        { id: 2, name: "ESTABLO BOVINO", type: "ANIMAL", cost: 850, prod: 35.0, captureCost: 200, icon: "fa-cow" },
        // CORRECCIÓN: Costo de captura reducido a 300L
        { id: 3, name: "AVIARIO INDUSTRIAL", type: "ANIMAL", cost: 1300, prod: 100.0, captureCost: 300, icon: "fa-feather" },
        // Meta del Capítulo
        { id: 4, name: "PROCESADOR DE BIOMASA", type: "SINTÉTICO", cost: 1900, prod: 250.0, captureCost: 5000, icon: "fa-industry" } 
    ],

    config: { 
        tickRate: 1000, baseDamage: 2.0, societyDrainBase: 1.2, healCost: 15, healAmount: 20,
        feedCostSmall: 50, feedCostBig: 200, boostDuration: 5, boostMultProd: 2, boostMultDmg: 3, oldFarmPenalty: 0.4
    },

    state: { 
        water: 600, // CORRECCIÓN: Inicio con 600L
        units: [], unlockedTier: 3, societyHealth: 100, isGameOver: false, storyViewed_ch3: false, societyHistory: []
    },
    
    dom: {},

    init: function() {
        this.cacheDOM();
        this.loadGame();
        if(this.state.societyHistory.length === 0) this.state.societyHistory = new Array(60).fill(100);
        
        if (!this.state.storyViewed_ch3) {
            this.openLog(3); 
        } else {
            this.startGameLoop();
        }
        
        console.log("Capítulo 3: Inicializado.");
    },

    // --- LOGIC ---
    openLog: function(id) {
        // Intento de sonido al abrir, puede fallar si no hubo interacción previa
        sfx.click();
        const data = storyData[id];
        if(data) {
            document.getElementById('story-title').innerText = data.title;
            document.getElementById('story-content').innerHTML = data.content;
            document.getElementById('story-modal').classList.remove('hidden');
        }
    },

    closeStory: function() {
        // 1. INICIALIZAR AUDIO AHORA (Evento de Usuario)
        sfx.init();
        
        // 2. Reproducir sonido
        sfx.success();
        
        document.getElementById('story-modal').classList.add('hidden');
        if(!this.state.storyViewed_ch3) {
            this.state.storyViewed_ch3 = true;
            this.startGameLoop();
        }
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
        if(this.state.isGameOver || !this.state.storyViewed_ch3) return;

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
            if (tierId === 4) this.triggerChapterTransition();
        } else {
            sfx.error();
        }
    },

    triggerChapterTransition: function() {
        gameManager.saveProgress({ water: this.state.water, unlockedTier: 4, societyHealth: this.state.societyHealth, units: [] });
        const overlay = document.getElementById('build-overlay');
        overlay.classList.remove('hidden');
        sfx.mechanic();
        setTimeout(() => { window.location.href = "../ch4/capitulo4.html"; }, 3000);
    },

    tryCapture: function() {
        let tier = this.tiers[this.state.unlockedTier];
        if(this.state.water >= tier.captureCost) {
            this.state.water -= tier.captureCost;
            const newName = this.generateSerial(tier.type);
            this.state.units.push({ id: Date.now(), tierId: this.state.unlockedTier, name: newName, hp: 100, boostTimer: 0 });
            sfx.success();
            this.navigateTo('extraction');
        } else {
            sfx.error();
        }
    },

    actionHeal: function(id) {
        let u = this.state.units.find(x => x.id === id);
        if(u && this.state.water >= this.config.healCost && u.hp < 100) {
            this.state.water -= this.config.healCost;
            u.hp = Math.min(100, u.hp + this.config.healAmount); 
            sfx.mechanic();
            this.updateUI();
        }
    },

    actionBoost: function(id) {
        let u = this.state.units.find(x => x.id === id);
        if(u) { u.boostTimer = this.config.boostDuration; sfx.boost(); this.renderUnits(); }
    },

    actionRecycle: function(id) {
        let u = this.state.units.find(x => x.id === id);
        if(!u) return;
        let tier = this.tiers[u.tierId];
        let refund = Math.floor(tier.captureCost / 2);
        if(confirm(`¿Reciclar? Recuperas +${refund}L`)) {
            let idx = this.state.units.findIndex(x => x.id === id);
            this.state.water += refund;
            this.state.units.splice(idx, 1);
            sfx.success();
            this.renderUnits();
        }
    },

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
            const refund = Math.floor(tier.captureCost / 2);
            let tierGap = this.state.unlockedTier - u.tierId;
            let efficiencyMsg = tierGap > 0 ? `<small style="color:#ef4444">⚠ OBSOLETO</small>` : '';

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
                <button class="btn-recycle-wide" onclick="app.actionRecycle(${u.id})"><i class="fa-solid fa-recycle"></i> RECICLAR (+${refund}L)</button>
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
        this.dom.captureBtn.innerHTML = `[ INICIAR CAPTURA (-${tier.captureCost}L) ]`;
        this.dom.radarTarget.innerText = tier.type;
        this.dom.scanInfo.innerHTML = `<li>> OBJETIVO: ${tier.name}</li>`;
        this.dom.captureCost.innerText = tier.captureCost;
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
    
    // CORRECCIÓN: Inicio con 600L
    loadGame: function() {
        let d = gameManager.loadProgress();
        if(d) { 
            this.state = { ...this.state, ...d }; 
            if(this.state.water < 300) this.state.water = 600; 
        } 
        else { this.state.water = 600; this.state.unlockedTier = 3; }
    },
    
    hardReset: function() { gameManager.clearProgress(); location.reload(); },
    renderAll: function() { this.updateUI(); this.renderFarms(); this.renderMapInfo(); this.renderUnits(); }
};

window.addEventListener('load', () => app.init());