'use strict';

/**
 * PROTOCOLO HIDRA - CAPÍTULO 1 (FINAL)
 * Incluye: Gestión de Tiers, Historia, Reset de Fábrica y Transición a Cap 2.
 */

// ================= MOTOR DE AUDIO INTEGRADO =================
const sfx = {
    ctx: null,
    masterGain: null,
    
    init: function() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Volumen maestro
        this.masterGain.connect(this.ctx.destination);
        
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    playTone: function(freq, type, duration, vol = 1, slideTo = null) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type; 
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    // --- EFECTOS ---
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
    boost: function() { if(this.ctx) this.playTone(200, 'triangle', 0.4, 0.2, 800); }
};

// ================= LÓGICA DE JUEGO =================
const app = {
    tiers: [
        { id: 0, name: "ROEDORES (OBSOLETO)", type: "ANIMAL", cost: 0, prod: 2.0, captureCost: 20, icon: "fa-bug" },
        { id: 1, name: "GRANJA PORCINA", type: "ANIMAL", cost: 250, prod: 10.0, captureCost: 80, icon: "fa-piggy-bank" },
        { id: 2, name: "ESTABLO BOVINO", type: "ANIMAL", cost: 850, prod: 35.0, captureCost: 300, icon: "fa-cow" }, // Meta Cap 1
        { id: 3, name: "AVIARIO INDUSTRIAL", type: "ANIMAL", cost: 5000, prod: 100.0, captureCost: 1000, icon: "fa-feather" }
    ],

    config: { 
        tickRate: 1000, 
        baseDamage: 2.0,       
        societyDrainBase: 0.5,
        healCost: 15,
        healAmount: 20,
        feedCostSmall: 50,
        feedCostBig: 200,
        boostDuration: 5,
        boostMultProd: 2,
        boostMultDmg: 3,
        oldFarmPenalty: 0.4
    },

    state: { 
        water: 100,             
        units: [],
        unlockedTier: 1, 
        societyHealth: 100,
        isGameOver: false,
        storyViewed: false
    },
    
    dom: {},

    init: function() {
        this.cacheDOM();
        this.loadGame();
        
        // Si no se ha visto la historia, mostrarla. Si no, iniciar juego.
        if (!this.state.storyViewed) {
            document.getElementById('story-modal').classList.remove('hidden');
        } else {
            this.startGameLoop();
        }
        
        console.log("Capítulo 1: Inicializado.");
    },

    // ================= HISTORIA & RESET =================
    
    // Abrir LOG (Llamado desde el botón en la tarjeta Tier 0)
    openLog: function() {
        sfx.click();
        document.getElementById('story-modal').classList.remove('hidden');
    },

    closeStory: function() {
        sfx.init(); // Asegurar audio
        sfx.success();
        document.getElementById('story-modal').classList.add('hidden');
        
        if(!this.state.storyViewed) {
            this.state.storyViewed = true;
            this.startGameLoop();
        }
    },

    // Abrir modal de confirmación de Reset
    openResetModal: function() {
        sfx.click();
        const modal = document.getElementById('reset-modal');
        modal.classList.remove('hidden');
        
        // Resetear estado del checkbox y botón
        document.getElementById('confirm-reset-check').checked = false;
        const btn = document.getElementById('btn-confirm-reset');
        btn.classList.add('disabled');
        btn.disabled = true;
    },

    closeResetModal: function() {
        sfx.click();
        document.getElementById('reset-modal').classList.add('hidden');
    },

    // Activar/Desactivar botón de borrado según checkbox
    toggleResetBtn: function() {
        const checkbox = document.getElementById('confirm-reset-check');
        const btn = document.getElementById('btn-confirm-reset');
        
        if(checkbox.checked) {
            btn.classList.remove('disabled');
            btn.disabled = false;
            sfx.mechanic();
        } else {
            btn.classList.add('disabled');
            btn.disabled = true;
        }
    },

    // EJECUTAR BORRADO TOTAL
    executeReset: function() {
        sfx.error(); // Sonido dramático
        gameManager.clearProgress();
        localStorage.clear(); // Limpieza profunda
        
        // Redirigir al inicio del juego (index.html en la raiz)
        window.location.href = "../index.html";
    },

    // ================= LOOP PRINCIPAL =================
    
    startGameLoop: function() {
        this.renderAll();
        // Evitar duplicar intervalos si se abre/cierra el log
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
            
            views: {
                farms: document.getElementById('view-farms'),
                extraction: document.getElementById('view-extraction'),
                map: document.getElementById('view-map'),
                society: document.getElementById('view-society')
            },
            
            nav: {
                farms: document.getElementById('nav-farms'),
                extraction: document.getElementById('nav-extraction'),
                map: document.getElementById('nav-map'),
                society: document.getElementById('nav-society')
            },

            lists: {
                units: document.getElementById('units-list'),
                farms: document.getElementById('farm-shop-list')
            },

            radarScreen: document.getElementById('radar-screen'),
            captureBtn: document.getElementById('btn-capture'),
            radarTarget: document.getElementById('radar-target-type'),
            scanInfo: document.getElementById('scan-info'),
            captureCost: document.getElementById('capture-cost')
        };
    },

    generateSerial: function(type) {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return `${type.substring(0,3)}-${letters.charAt(Math.floor(Math.random()*26))}${Math.floor(Math.random()*99)}`;
    },

    tick: function() {
        if(this.state.isGameOver || !this.state.storyViewed) return;

        // Calcular drenaje de sociedad (Aumenta con el nivel)
        const currentDrain = this.config.societyDrainBase + (this.state.unlockedTier * 0.1);
        this.state.societyHealth -= currentDrain;
        
        if(this.state.societyHealth <= 0) {
            this.state.societyHealth = 0;
            this.triggerGameOver();
        }

        let prod = 0;
        // Iterar unidades
        for (let i = this.state.units.length - 1; i >= 0; i--) {
            let u = this.state.units[i];
            let tier = this.tiers[u.tierId];
            
            // Penalización por granja vieja (obsolescencia)
            let tierGap = this.state.unlockedTier - u.tierId;
            let efficiency = 1 / (1 + (tierGap * this.config.oldFarmPenalty));
            
            let currentProd = tier.prod * efficiency;
            let currentDmg = this.config.baseDamage;

            // Lógica Boost
            if(u.boostTimer > 0) {
                currentProd *= this.config.boostMultProd; 
                currentDmg *= this.config.boostMultDmg;
                u.boostTimer--;
            }

            u.hp -= currentDmg;
            prod += currentProd;

            // Muerte unidad
            if(u.hp <= 0) {
                this.state.units.splice(i, 1);
                sfx.error();
            }
        }

        this.state.water += prod;
        this.updateUI(currentDrain);
        
        // Renderizado eficiente: solo si la vista está activa
        if(!this.dom.views.extraction.classList.contains('hidden')) {
            this.renderUnits();
        }
    },

    // ================= ACCIONES DEL JUGADOR =================
    
    // Comprar nueva granja (Tier)
    buyTier: function(tierId) {
        let tier = this.tiers[tierId];
        
        if(this.state.water >= tier.cost) {
            this.state.water -= tier.cost;
            this.state.unlockedTier = tierId;
            sfx.success();
            this.renderFarms(); // Actualizar UI de tienda
            this.renderMapInfo(); // Actualizar costo radar

            // DETECTAR FINAL DE CAPÍTULO (Compra de Vacas)
            if (tierId === 2) {
                this.triggerChapterTransition();
            }

        } else {
            sfx.error();
        }
    },

    // Animación y Redirección a Cap 2
    triggerChapterTransition: function() {
        // Guardar estado
        gameManager.saveProgress({
            water: this.state.water,
            unlockedTier: 2, 
            societyHealth: this.state.societyHealth,
            units: [] // Limpiar unidades para el siguiente nivel (opcional)
        });

        // Mostrar Overlay
        const overlay = document.getElementById('build-overlay');
        overlay.classList.remove('hidden');
        sfx.mechanic(); // Sonido construcción

        // Redirigir
        setTimeout(() => {
            window.location.href = "../ch2/capitulo2.html";
        }, 3000);
    },

    tryCapture: function() {
        let tier = this.tiers[this.state.unlockedTier];
        if(this.state.water >= tier.captureCost) {
            this.state.water -= tier.captureCost;
            const newName = this.generateSerial(tier.type);
            this.state.units.push({ 
                id: Date.now(), 
                tierId: this.state.unlockedTier,
                name: newName, 
                hp: 100, 
                boostTimer: 0 
            });
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
        if(u) { 
            u.boostTimer = this.config.boostDuration;
            sfx.boost();
            this.renderUnits();
        }
    },

    actionRecycle: function(id) {
        let u = this.state.units.find(x => x.id === id);
        if(!u) return;
        let tier = this.tiers[u.tierId];
        let refund = Math.floor(tier.captureCost / 2);
        
        if(confirm(`¿Reciclar unidad? Recuperas +${refund}L`)) {
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

    // ================= RENDERIZADO UI =================
    
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
            
            // Mensaje de obsolescencia
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
                    <button class="btn-inline btn-heal" onclick="app.actionHeal(${u.id})">
                        <i class="fa-solid fa-gear"></i> REPARAR (-${this.config.healCost}L)
                    </button>
                    <button class="btn-inline btn-boost ${isBoosted?'active':''}" onclick="app.actionBoost(${u.id})">
                        <i class="fa-solid fa-bolt"></i> BOOST
                    </button>
                </div>
                <button class="btn-recycle-wide" onclick="app.actionRecycle(${u.id})">
                    <i class="fa-solid fa-recycle"></i> RECICLAR (+${refund}L)
                </button>
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
            
            // --- BOTÓN LOG ESPECIAL PARA TIER 0 ---
            // Se inserta dentro del header si es el Tier 0
            let headerExtra = tier.id === 0 
                ? `<button class="btn-log-card" onclick="app.openLog()">LOG <i class="fa-solid fa-file-code"></i></button>` 
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
                        ${headerExtra}
                    </div>
                </div>
                <div class="upgrade-stats">
                    <span><i class="fa-solid fa-droplet"></i> +${tier.prod} L/s</span>
                </div>
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

    // SISTEMA
    saveGame: function() {
        gameManager.saveProgress(this.state);
    },
    
    loadGame: function() {
        let d = gameManager.loadProgress();
        if(d) {
            this.state = { ...this.state, ...d };
        } else {
            // Valores iniciales si no hay guardado (Testing)
            this.state.water = 100;
            this.state.unlockedTier = 1;
        }
    },
    
    hardReset: function() {
        gameManager.clearProgress();
        location.reload();
    },

    renderAll: function() {
        this.updateUI();
        this.renderFarms();
        this.renderMapInfo();
        this.renderUnits();
    }
};

window.addEventListener('load', () => app.init());