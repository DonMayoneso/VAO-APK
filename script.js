'use strict';

/**
 * PROTOCOLO HIDRA - ENGINE V4.1
 * Update: Agregado sonido específico para BOOST (Turbina ascendente).
 */

// ================= MOTOR DE AUDIO (SINTETIZADOR) =================
const sfx = {
    ctx: null,
    masterGain: null,
    
    init: function() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; 
        this.masterGain.connect(this.ctx.destination);
        
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        
        this.startAmbience();
    },

    playTone: function(freq, type, duration, vol = 1, slideTo = null) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type; 
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        // Deslizamiento de frecuencia (Slide)
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

    // --- EFECTOS ESPECÍFICOS ---
    
    click: function() {
        this.playTone(800, 'square', 0.05, 0.1);
    },

    error: function() {
        this.playTone(150, 'sawtooth', 0.4, 0.3, 100);
    },

    success: function() {
        if (!this.ctx) return;
        this.playTone(523.25, 'sine', 0.2, 0.2); 
        setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.2), 100); 
        setTimeout(() => this.playTone(783.99, 'sine', 0.4, 0.2), 200); 
    },

    sonar: function() {
        if (!this.ctx) return;
        this.playTone(1200, 'sine', 0.3, 0.2);
        setTimeout(() => this.playTone(600, 'sine', 0.4, 0.05), 150);
    },

    mechanic: function() {
        this.playTone(100, 'square', 0.1, 0.2, 50);
    },

    // NUEVO SONIDO: BOOST (Efecto de carga/aceleración)
    boost: function() {
        if (!this.ctx) return;
        // Empieza en 200Hz y sube a 800Hz rápidamente (Efecto turbina)
        this.playTone(200, 'triangle', 0.4, 0.2, 800);
    },

    scan: function() {
        this.playTone(2000, 'sawtooth', 0.1, 0.05, 500);
    },

    startAmbience: function() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 50; 
        gain.gain.value = 0.05; 
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
    }
};

// ================= LÓGICA DEL JUEGO =================

const app = {
    config: { 
        tickRate: 1000, 
        baseDamage: 2.0,       
        societyDrain: 0.2,     
        goalWater: 250,        
        captureCost: 20,
        healCost: 10,
        healAmount: 15,        
        feedCost: 10,
        boostDuration: 5,
        boostMultProd: 2,
        boostMultDmg: 3,
        videoDuration: 15000   
    },

    state: { 
        water: 30,             
        units: [],
        societyHealth: 100,
        step: -1,              
        isGameOver: false,
        introEnded: false
    },
    
    dom: {},

    init: function() {
        this.cacheDOM();
        console.log("Sistema listo.");
    },

    startExperience: function() {
        sfx.init();
        sfx.success();
        document.getElementById('menu-screen').style.display = 'none';
        this.playIntroVideo();
    },

    playIntroVideo: function() {
        const layer = document.getElementById('intro-layer');
        const video = document.getElementById('intro-video');
        
        layer.classList.remove('hidden'); 
        video.muted = false; 
        video.volume = 1.0;
        
        video.onended = () => this.endIntro();

        setTimeout(() => {
            if (!this.state.introEnded) this.endIntro();
        }, this.config.videoDuration + 1000);

        video.play().catch(e => {
            console.error("Video error:", e);
            this.endIntro();
        });
    },

    endIntro: function() {
        if (this.state.introEnded) return;
        this.state.introEnded = true;

        const layer = document.getElementById('intro-layer');
        const video = document.getElementById('intro-video');
        
        video.pause();
        layer.style.opacity = '0'; 
        
        setTimeout(() => {
            layer.style.display = 'none';
            this.startGameLoop();
        }, 1000);
    },

    startGameLoop: function() {
        this.renderAll();
        setInterval(() => this.tick(), this.config.tickRate);
        setInterval(() => this.spawnRadarBlips(), 2000);
        
        this.setStep(0);
        sfx.scan();
    },

    cacheDOM: function() {
        this.dom = {
            totalWater: document.getElementById('total-water'),
            socBar: document.getElementById('society-bar'),
            socPercent: document.getElementById('soc-percent'),
            unitCount: document.getElementById('unit-count'),
            tutorialText: document.getElementById('tutorial-text'),
            tutorialBox: document.getElementById('tutorial-overlay'),
            currentObjective: document.getElementById('current-objective'),
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
        return `${type}-${letters.charAt(Math.floor(Math.random()*26))}${Math.floor(Math.random()*99).toString().padStart(2,'0')}`;
    },

    setStep: function(s) {
        this.state.step = s;
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
        document.querySelectorAll('.tutorial-pointer').forEach(el => el.classList.remove('tutorial-pointer'));

        let msg = "";
        let obj = "";

        switch(s) {
            case 0:
                msg = "Bienvenido Operador. El RADAR ha detectado vida. Inicie captura.";
                obj = "CAPTURAR ESPÉCIMEN";
                this.dom.captureBtn.classList.add('tutorial-highlight', 'tutorial-pointer');
                this.renderMapInfo("ROEDOR [PRUEBA]", this.config.captureCost);
                this.dom.tutorialBox.classList.remove('hidden');
                break;
            case 1:
                msg = "Captura exitosa. Vaya a EXTRACCIÓN para ver la unidad.";
                obj = "IR A EXTRACCIÓN";
                this.dom.nav.extraction.classList.remove('element-locked');
                this.dom.nav.extraction.classList.add('tutorial-highlight', 'tutorial-pointer');
                this.dom.nav.map.classList.add('element-locked'); 
                break;
            case 2:
                msg = "PRUEBA DE RENDIMIENTO: Usa el botón BOOST para acelerar la producción.";
                obj = "ACTIVAR BOOST";
                break;
            case 3:
                msg = "¡ATENCIÓN! El Boost daña la unidad. REPARALA usando la Tuerca varias veces.";
                obj = "REPARAR DAÑOS";
                setTimeout(() => {
                    this.updateTutorialMsg("ALERTA CRÍTICA: La sociedad consume agua. Ve a la sección SOCIEDAD.");
                    this.dom.nav.society.classList.remove('element-locked');
                    this.dom.nav.society.classList.add('tutorial-highlight', 'tutorial-pointer');
                    this.state.step = 4; 
                    this.dom.currentObjective.innerText = "IR A SOCIEDAD";
                    sfx.error(); 
                }, 6000);
                break;
            case 4:
                obj = "IR A SOCIEDAD";
                break;
            case 5:
                msg = `Evita el colapso. Acumula ${this.config.goalWater}L. Si necesitas agua urgente, RECICLA unidades.`;
                obj = `ACUMULAR ${this.config.goalWater} L`;
                this.dom.nav.extraction.classList.remove('element-locked');
                this.dom.nav.map.classList.remove('element-locked');
                break;
            case 6:
                msg = "Recursos suficientes. Acceda a INFRA para evolucionar.";
                obj = "COMPRAR GRANJA";
                this.dom.nav.farms.classList.remove('element-locked');
                this.dom.nav.farms.classList.add('tutorial-highlight', 'tutorial-pointer');
                this.renderFarmShop();
                sfx.success();
                break;
        }
        if(msg) this.updateTutorialMsg(msg);
        if(obj) this.dom.currentObjective.innerText = obj;
    },

    updateTutorialMsg: function(text) {
        this.dom.tutorialText.innerText = text;
        const box = this.dom.tutorialBox;
        box.style.animation = 'none';
        box.offsetHeight; 
        box.style.animation = 'slideDown 0.5s ease';
        sfx.scan(); 
    },

    tick: function() {
        if(this.state.isGameOver || this.state.step === -1) return;

        this.state.societyHealth -= this.config.societyDrain;
        if(this.state.societyHealth <= 0) {
            this.state.societyHealth = 0;
            this.triggerGameOver();
        }

        let prod = 0;
        for (let i = this.state.units.length - 1; i >= 0; i--) {
            let u = this.state.units[i];
            let currentProd = 3.0;
            let currentDmg = this.config.baseDamage;

            if(u.boostTimer > 0) {
                currentProd *= this.config.boostMultProd; 
                currentDmg *= this.config.boostMultDmg;
                u.boostTimer--;
            }

            u.hp -= currentDmg;
            prod += currentProd;

            if(u.hp <= 0) {
                this.state.units.splice(i, 1);
                sfx.error(); 
                this.updateTutorialMsg("AVISO: Unidad colapsada. Captura otra en el RADAR.");
            }
        }

        this.state.water += prod;

        if(this.state.step === 5 && this.state.water >= this.config.goalWater) {
            this.setStep(6);
        }

        if(!this.dom.views.extraction.classList.contains('hidden')) {
            this.renderUnits();
        }
        this.updateUI();
    },

    tryCapture: function() {
        if(this.state.water >= this.config.captureCost) {
            this.state.water -= this.config.captureCost;
            
            const newName = this.generateSerial("ROEDOR");
            this.state.units.push({ id: Date.now(), name: newName, hp: 100, boostTimer: 0 });
            
            sfx.success(); 
            
            if(this.state.step === 0) this.setStep(1);
            else this.navigateTo('extraction');
        } else {
            sfx.error(); 
            this.updateTutorialMsg(`Falta Agua (${this.config.captureCost}L).`);
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

    // ACCIÓN BOOST: AHORA CON SONIDO PROPIO
    actionBoost: function(id) {
        let u = this.state.units.find(x => x.id === id);
        if(u) { 
            u.boostTimer = this.config.boostDuration;
            sfx.boost(); // <--- Sonido de turbina/carga
            if(this.state.step === 2) this.setStep(3);
            this.renderUnits();
        }
    },

    actionRecycle: function(id) {
        const refund = Math.floor(this.config.captureCost / 2);
        if(confirm(`¿RECICLAR UNIDAD? Recibirás +${refund}L de agua.`)) {
            let idx = this.state.units.findIndex(x => x.id === id);
            if(idx > -1) {
                this.state.water += refund;
                this.state.units.splice(idx, 1);
                sfx.success(); 
                this.renderUnits();
            }
        }
    },

    feedSociety: function(amount) {
        if(this.state.water >= this.config.feedCost) {
            this.state.water -= this.config.feedCost;
            this.state.societyHealth = Math.min(100, this.state.societyHealth + 15);
            sfx.success(); 
            this.updateUI();
        } else {
            sfx.error();
        }
    },

    buyFarmUpgrade: function() {
        if(this.state.water >= 250) {
            sfx.success();
            gameManager.saveProgress({
                water: this.state.water - 250,
                unlockedTier: 1, 
                societyHealth: 100,
                units: [] 
            });

            const overlay = document.getElementById('build-overlay');
            if(overlay) overlay.classList.remove('hidden');
            
            sfx.scan();

            setTimeout(() => {
                window.location.href = "ch1/capitulo1.html";
            }, 3000);
        } else {
            sfx.error();
        }
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
        
        sfx.sonar(); // Sonido de Sonar Ping
        
        setTimeout(() => blip.remove(), 2000);
    },

    navigateTo: function(view) {
        if(this.state.step === 0 && view !== 'map') return;
        if(this.state.step === 1 && view !== 'extraction') return;
        if(this.state.step === 3 && view === 'society') return; 
        if(this.state.step === 4 && view !== 'society' && view !== 'extraction') return;

        Object.values(this.dom.views).forEach(el => el.classList.add('hidden'));
        Object.values(this.dom.nav).forEach(el => el.classList.remove('active'));
        this.dom.views[view].classList.remove('hidden');
        this.dom.nav[view].classList.add('active');

        sfx.click(); // Sonido Click

        if(view === 'extraction' && this.state.step === 1) this.setStep(2);
        if(view === 'society' && this.state.step === 4) this.setStep(5);
        
        this.updateUI();
    },

    updateUI: function() {
        this.dom.totalWater.innerText = Math.floor(this.state.water);
        this.dom.socPercent.innerText = Math.floor(this.state.societyHealth);
        this.dom.socBar.style.width = this.state.societyHealth + "%";
        this.dom.socBar.style.backgroundColor = this.state.societyHealth < 30 ? "#ef4444" : "#d946ef";
        this.dom.unitCount.innerText = this.state.units.length;
    },

    renderUnits: function() {
        if(this.dom.views.extraction.classList.contains('hidden')) return;
        let html = '';
        if(this.state.units.length === 0) {
            html = '<div class="loading-msg">SIN UNIDADES</div>';
        } else {
            const refundAmount = Math.floor(this.config.captureCost / 2);
            this.state.units.forEach(u => {
                const isBoosted = u.boostTimer > 0;
                const highlightBoost = (this.state.step === 2) ? 'tutorial-highlight tutorial-pointer' : '';
                
                html += `
                <div class="unit-card ${isBoosted ? 'boost-active' : ''}">
                    <div class="unit-main-row">
                        <div class="card-icon"><i class="fa-solid fa-bug"></i></div>
                        <div class="card-info">
                            <span class="unit-name">${u.name} ${isBoosted ? '⚡' : ''}</span>
                            <div class="mini-bar"><div class="fill" style="width:${u.hp}%"></div></div>
                        </div>
                    </div>
                    <div class="unit-actions-top">
                        <button class="btn-inline btn-heal" onclick="app.actionHeal(${u.id})">
                            <i class="fa-solid fa-gear"></i> REPARAR (-${this.config.healCost}L)
                        </button>
                        <button class="btn-inline btn-boost ${isBoosted?'active':''} ${highlightBoost}" onclick="app.actionBoost(${u.id})">
                            <i class="fa-solid fa-bolt"></i> BOOST
                        </button>
                    </div>
                    <button class="btn-recycle-wide" onclick="app.actionRecycle(${u.id})">
                        <i class="fa-solid fa-recycle"></i> RECICLAR (+${refundAmount}L)
                    </button>
                </div>`;
            });
        }
        this.dom.lists.units.innerHTML = html;
    },

    renderMapInfo: function(name, cost) {
        this.dom.captureBtn.innerHTML = `[ INICIAR CAPTURA (-${cost}L) ]`;
        this.dom.radarTarget.innerText = "SEÑAL";
        this.dom.scanInfo.innerHTML = `<li>> OBJETIVO: ${name}</li>`;
        this.dom.captureCost.innerText = cost;
    },

    renderFarmShop: function() {
        const canBuy = this.state.water >= 250;
        this.dom.lists.farms.innerHTML = `
            <div class="farm-upgrade-card ${canBuy ? 'available' : 'locked'}" style="opacity: ${canBuy ? 1 : 0.5}; border-color: var(--accent-color);">
                <div class="upgrade-header">
                    <span class="upgrade-title">GRANJA AVIAR (NIVEL 1)</span>
                    <span class="upgrade-type type-animal">ANIMAL</span>
                </div>
                <div class="upgrade-stats">
                    <span><i class="fa-solid fa-droplet"></i> +10.0 L/s</span>
                    <span><i class="fa-solid fa-users"></i> Fin del Tutorial</span>
                </div>
                <div class="upgrade-cost" style="color:var(--accent-color)">REQUERIDO: 250 L</div>
                <button class="btn-buy-upgrade tutorial-highlight tutorial-pointer" onclick="app.buyFarmUpgrade()">
                    <i class="fa-solid fa-check"></i> CREAR GRANJA AVIAR
                </button>
            </div>
        `;
    },

    triggerGameOver: function() {
        this.state.isGameOver = true;
        sfx.error();
        document.getElementById('game-over-modal').classList.remove('hidden');
    },

    hardReset: function() {
        gameManager.clearProgress();
        location.reload();
    },

    renderAll: function() {
        this.updateUI();
        this.renderUnits();
    }
};

window.addEventListener('load', () => app.init());