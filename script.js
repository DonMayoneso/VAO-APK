'use strict';

/**
 * PROTOCOLO HIDRA - CORE ENGINE V3.0
 * Incluye: Sistema de Sociedad, Hacking VAO, Obsolescencia y Economía Idle.
 */

const app = {
    // ================= CONFIGURACIÓN Y BALANCE =================
    tiers: [
        { id: 0, name: "TUTORIAL: ROEDORES", type: "ANIMAL", cost: 0, prod: 3.0, captureCost: 20, icon: "fa-bug" },
        { id: 1, name: "GANADO PORCINO", type: "ANIMAL", cost: 250, prod: 10.0, captureCost: 80, icon: "fa-piggy-bank" },
        { id: 2, name: "GANADO BOVINO", type: "ANIMAL", cost: 1200, prod: 35.0, captureCost: 300, icon: "fa-cow" },
        { id: 3, name: "AVIARIO INDUSTRIAL", type: "ANIMAL", cost: 5000, prod: 100.0, captureCost: 1000, icon: "fa-feather" },
        // Tier 4: El punto de quiebre ético (Requiere Hackeo)
        { id: 4, name: "PRISIÓN LOCAL", type: "HUMANO", cost: 15000, prod: 400.0, captureCost: 4000, icon: "fa-user" },
        { id: 5, name: "CAMPO DE EXTRACCIÓN", type: "HUMANO", cost: 60000, prod: 1200.0, captureCost: 12000, icon: "fa-person-shelter" }
    ],

    config: { 
        tickRate: 1000,           // Actualización cada 1 segundo
        saveInterval: 3000,       // Guardado automático
        
        baseDamage: 4.0,          // Daño base que reciben las unidades por tick
        societyDrainBase: 0.4,    // Cuánto baja la sociedad por segundo (base)
        societyDrainScaling: 0.15, // Cuánto aumenta el drenaje por cada nivel desbloqueado
        
        recycleRefund: 0.5,       // % del costo devuelto al reciclar (50%)
        oldFarmInefficiency: 0.35 // % de producción que PIERDEN las granjas viejas por cada nivel de diferencia
    },

    state: { 
        water: 60,                // Recursos iniciales
        units: [],                // Array de unidades
        unlockedTier: 0,          // Nivel actual
        societyHealth: 100,       // Barra de vida de la sociedad
        vaoHacked: false,         // Estado del hackeo a la IA
        tutorialStep: 0,          // Progreso del tutorial
        isGameOver: false,
        startTime: Date.now()
    },
    
    // Variables volátiles (no se guardan)
    hackProgress: 0,
    hackDecayInterval: null,
    dom: {},

    // ================= INICIALIZACIÓN =================
    init: function() {
        this.cacheDOM();
        this.loadGame();
        
        // Setup Inicial para nuevos jugadores
        if(this.state.units.length === 0 && this.state.unlockedTier === 0 && this.state.water <= 60) {
            this.showTutorial("Bienvenido, Operador. Inicie el RADAR para obtener su primer espécimen.");
        }

        this.renderAll();
        
        // Loop Principal (Lógica de juego)
        setInterval(() => this.tick(), this.config.tickRate);
        
        // Loop de Guardado
        setInterval(() => this.saveGame(), this.config.saveInterval);
        
        // Loop del Minijuego (Resistencia de la IA)
        setInterval(() => {
            if(!this.dom.hackModal.classList.contains('hidden') && this.hackProgress > 0) {
                // La IA lucha contra el hackeo bajando la barra
                this.hackProgress = Math.max(0, this.hackProgress - 2.5); 
                this.updateHackUI();
            }
        }, 100);

        console.log("Sistema HIDRA: Operativo.");
    },

    cacheDOM: function() {
        // Cacheamos referencias para mejorar rendimiento en móviles
        this.dom = {
            totalWater: document.getElementById('total-water'),
            netFlow: document.getElementById('net-flow'),
            unitCount: document.getElementById('unit-count'),
            accessLevel: document.getElementById('access-level'),
            
            // Elementos de Sociedad
            socPercent: document.getElementById('soc-percent'),
            socBar: document.getElementById('society-bar'),
            socDrain: document.getElementById('soc-drain'),
            
            // Vistas (Pestañas)
            views: {
                farms: document.getElementById('view-farms'),
                extraction: document.getElementById('view-extraction'),
                map: document.getElementById('view-map'),
                society: document.getElementById('view-society')
            },
            
            // Modales y Overlays
            hackModal: document.getElementById('hack-modal'),
            hackBar: document.getElementById('hack-bar'),
            gameOverModal: document.getElementById('game-over-modal'),
            tutorialOverlay: document.getElementById('tutorial-overlay'),
            tutorialText: document.getElementById('tutorial-text'),
            
            // Listas dinámicas
            lists: {
                farms: document.getElementById('farm-shop-list'),
                units: document.getElementById('units-list')
            },
            
            // Navegación y Radar
            navBtns: document.querySelectorAll('.nav-item'),
            map: {
                cost: document.getElementById('capture-cost'),
                target: document.getElementById('radar-target-type'),
                info: document.getElementById('scan-info')
            }
        };
    },

    // ================= MOTOR PRINCIPAL (TICK) =================
    tick: function() {
        if(this.state.isGameOver) return;

        // 1. DRENAJE DE SOCIEDAD
        // A mayor tecnología, la sociedad demanda más recursos
        let currentDrain = this.config.societyDrainBase + (this.state.unlockedTier * this.config.societyDrainScaling);
        this.state.societyHealth -= currentDrain;
        
        // Check Game Over
        if(this.state.societyHealth <= 0) {
            this.state.societyHealth = 0;
            this.triggerGameOver();
        }

        // 2. PROCESAMIENTO DE UNIDADES
        let cycleProd = 0;
        
        if(this.state.units.length > 0) {
            // Iteramos al revés para poder borrar elementos sin romper el índice
            for(let i = this.state.units.length - 1; i >= 0; i--) {
                let u = this.state.units[i];
                let tier = this.tiers[u.tierId];
                
                // CÁLCULO DE EFICIENCIA (OBSOLESCENCIA)
                // Si desbloqueaste nivel 3, las unidades nivel 0 producen muchísimo menos.
                let tierGap = this.state.unlockedTier - u.tierId;
                
                // Fórmula: 1 / (1 + (Diferencia * 0.35))
                // Ejemplo: Gap de 2 niveles = Producción reducida al 58%
                let efficiency = 1 / (1 + (tierGap * this.config.oldFarmInefficiency));
                
                let rate = tier.prod * efficiency;
                
                // Boost temporal (x2)
                if(u.boosted) { 
                    rate *= 2; 
                    u.boosted = false; // El boost dura solo 1 tick (1 segundo)
                }

                // Las unidades sufren daño constante
                u.hp -= this.config.baseDamage;
                cycleProd += rate;

                // Muerte de la unidad
                if(u.hp <= 0) {
                    this.state.units.splice(i, 1); // Se elimina sin reembolso
                }
            }
        }

        // 3. ACTUALIZACIÓN DE ESTADO
        this.state.water += cycleProd;
        this.updateUI(cycleProd, currentDrain);
    },

    // ================= ACCIONES DEL JUGADOR =================
    
    // Comprar nueva granja (Subir de nivel)
    buyTier: function(tierId) {
        let tier = this.tiers[tierId];
        
        // INTERVENCIÓN DE LA IA (Minijuego)
        // Si es Humano (Tier 4) y no ha sido hackeado:
        if(tier.type === "HUMANO" && !this.state.vaoHacked) {
            this.startHackMinigame();
            return;
        }

        if(this.state.water >= tier.cost) {
            this.state.water -= tier.cost;
            this.state.unlockedTier = tierId;
            
            // Tutorial: Avisar sobre obsolescencia
            if(tierId === 1 && this.state.tutorialStep < 3) {
                this.showTutorial("ATENCIÓN: Las unidades antiguas ahora son ineficientes. Recíclalas.");
                this.state.tutorialStep = 3;
            }

            this.renderFarms();
            this.renderMapInfo(); // Actualiza el radar al nuevo objetivo
            alert(`CONCESIÓN APROBADA: ${tier.name}`);
        } else {
            // Feedback háptico de error
            if(navigator.vibrate) navigator.vibrate([50, 50, 50]);
            alert("FONDOS INSUFICIENTES");
        }
    },

    // Intentar capturar unidad en el Radar
    tryCapture: function() {
        let currentTier = this.tiers[this.state.unlockedTier];
        
        if(this.state.water >= currentTier.captureCost) {
            this.state.water -= currentTier.captureCost;
            this.createUnit(this.state.unlockedTier);
            
            // Tutorial: Primer paso
            if(this.state.tutorialStep === 0) {
                this.showTutorial("Unidad capturada. Ve a EXTRAC para gestionarla.");
                this.state.tutorialStep = 1;
            }
            
            if(navigator.vibrate) navigator.vibrate(50);
            this.navigateTo('extraction');
        } else {
            alert("AGUA INSUFICIENTE PARA OPERACIÓN");
        }
    },

    // Mantener a la sociedad (Evitar Game Over)
    feedSociety: function(amountPct) {
        // Inflación: Cuesta más mantener la sociedad cuanto más avanzado estás
        let baseCost = amountPct === 10 ? 100 : 450;
        let inflationMult = 1 + (this.state.unlockedTier * 0.4);
        let finalCost = Math.floor(baseCost * inflationMult);
        
        if(this.state.water >= finalCost) {
            this.state.water -= finalCost;
            this.state.societyHealth = Math.min(100, this.state.societyHealth + amountPct);
            this.updateUI(0, 0);
            
            // Tutorial: Explicar sociedad
            if(this.state.tutorialStep === 1) {
                this.showTutorial("Mantén la estabilidad social o el sistema colapsará.");
                this.state.tutorialStep = 2;
            }
        } else {
            alert(`RECURSOS INSUFICIENTES. Requerido: ${finalCost} L`);
        }
    },

    // ================= GESTIÓN DE UNIDADES =================
    
    createUnit: function(tierId) {
        let tier = this.tiers[tierId];
        this.state.units.push({
            id: Date.now() + Math.random(),
            tierId: tierId,
            name: `${tier.type.substr(0,3)}-${Math.floor(Math.random()*999)}`,
            hp: 100,
            boosted: false
        });
        this.renderUnits();
    },

    // Acción: Reciclar (Vender)
    actionRecycle: function(id) {
        let idx = this.state.units.findIndex(x => x.id === id);
        if(idx > -1) {
            let u = this.state.units[idx];
            let tier = this.tiers[u.tierId];
            
            // Cálculo del reembolso (50%)
            let refund = Math.floor(tier.captureCost * this.config.recycleRefund);
            
            this.state.water += refund;
            this.state.units.splice(idx, 1); // Eliminar del array
            
            this.renderUnits();
            this.updateUI(0, 0);
        }
    },

    // Acción: Reparar (Curar)
    actionHeal: function(id) {
        let u = this.state.units.find(x => x.id === id);
        // Curar cuesta 15 L fijos
        if(u && this.state.water >= 15 && u.hp < 100) {
            this.state.water -= 15;
            u.hp = Math.min(100, u.hp + 30); // Cura 30 HP
            this.renderUnits();
            this.updateUI(0, 0);
        }
    },

    // Acción: Boost (Acelerar producción)
    actionBoost: function(id) {
        let u = this.state.units.find(x => x.id === id);
        if(u) { 
            u.boosted = true; 
            this.renderUnits(); 
        }
    },

    // ================= MINIJUEGO: HACKEO VAO =================
    
    startHackMinigame: function() {
        this.dom.hackModal.classList.remove('hidden');
        this.hackProgress = 0;
        this.updateHackUI();
    },

    clickHack: function(e) {
        if(e) e.preventDefault(); // Evita zoom en móviles
        
        // Cada click suma progreso
        this.hackProgress += 8; 
        
        if(navigator.vibrate) navigator.vibrate(20);

        if(this.hackProgress >= 100) {
            // Victoria
            this.state.vaoHacked = true;
            this.dom.hackModal.classList.add('hidden');
            alert("PROTOCOLO VAO: NEUTRALIZADO. ACCESO A RECURSOS HUMANOS: AUTORIZADO.");
            this.renderFarms(); // Se actualiza la tienda para desbloquear el botón
        }
        this.updateHackUI();
    },

    updateHackUI: function() {
        this.dom.hackBar.style.width = this.hackProgress + "%";
    },

    // ================= UI & RENDERIZADO =================
    
    updateUI: function(flow, drain) {
        // Contadores numéricos
        this.dom.totalWater.innerText = Math.floor(this.state.water);
        this.dom.netFlow.innerText = (flow > 0 ? "+" : "") + flow.toFixed(1);
        this.dom.accessLevel.innerText = this.state.unlockedTier + 1;
        
        // Barra de Sociedad
        let hp = Math.max(0, this.state.societyHealth);
        this.dom.socPercent.innerText = hp.toFixed(1);
        this.dom.socBar.style.width = hp + "%";
        
        // Cambiar color a rojo si está crítico (<20%)
        if(hp < 20) {
            this.dom.socBar.style.backgroundColor = "#ef4444"; // Rojo Alerta
            this.dom.socBar.style.boxShadow = "0 0 10px #ef4444";
        } else {
            this.dom.socBar.style.backgroundColor = "var(--society-color)"; // Rosa Normal
            this.dom.socBar.style.boxShadow = "0 0 10px var(--society-color)";
        }
        
        if(this.dom.socDrain) this.dom.socDrain.innerText = "-" + drain.toFixed(2);
    },

    // Renderiza la lista de Granjas (Tienda)
    renderFarms: function() {
        let html = '';
        this.tiers.forEach((tier) => {
            let isOwned = this.state.unlockedTier >= tier.id;
            let isNext = this.state.unlockedTier === tier.id - 1;
            
            // Ocultar tiers muy avanzados (Anti-Spoiler)
            let isHidden = tier.id > this.state.unlockedTier + 1;

            // Datos visuales (Censurados si isHidden)
            let displayName = isHidden ? '<span class="blur-text">CLASIFICADO</span>' : tier.name;
            let displayType = isHidden ? '???' : tier.type;
            let displayCost = isHidden ? '???' : tier.cost + " L";
            let displayProd = isHidden ? '???' : tier.prod;
            
            // Lógica del botón de compra
            let btnHtml = '';
            if(isOwned) {
                btnHtml = `<div class="owned-badge">EN POSESIÓN</div>`;
            } else if(isNext) {
                // Si es humano y no está hackeado, el botón inicia el minijuego
                btnHtml = `<button class="btn-buy-upgrade" onclick="app.buyTier(${tier.id})">COMPRAR CONCESIÓN</button>`;
            } else {
                btnHtml = `<div style="font-size:0.7rem;color:#555"><i class="fa-solid fa-lock"></i> REQUIERE NIVEL ${tier.id}</div>`;
            }

            // Render de la tarjeta
            html += `
            <div class="farm-upgrade-card ${isOwned ? 'owned' : ''}">
                <div class="upgrade-header">
                    <span class="upgrade-title">${displayName}</span>
                    ${isHidden ? '<span class="classified-badge">TOP SECRET</span>' : `<span class="upgrade-type type-${tier.type.toLowerCase()}">${displayType}</span>`}
                </div>
                <div class="upgrade-stats">
                    <span><i class="fa-solid fa-droplet"></i> +${displayProd}/s</span>
                </div>
                <div class="upgrade-cost">COSTO: ${displayCost}</div>
                ${btnHtml}
            </div>`;
        });
        this.dom.lists.farms.innerHTML = html;
    },

    // Renderiza la lista de Unidades Activas
    renderUnits: function() {
        this.dom.unitCount.innerText = this.state.units.length;
        if(this.state.units.length === 0) {
            this.dom.lists.units.innerHTML = '<div class="loading-msg">SIN UNIDADES ACTIVAS</div>';
            return;
        }

        let html = '';
        this.state.units.forEach(u => {
            let tier = this.tiers[u.tierId];
            let tierGap = this.state.unlockedTier - u.tierId;
            
            // Cálculo visual de penalización para mostrar al usuario
            let penaltyPercent = Math.round((1 - (1 / (1 + (tierGap * this.config.oldFarmInefficiency)))) * 100);
            let prodReal = tier.prod / (1 + (tierGap * this.config.oldFarmInefficiency));
            
            // Aviso de ineficiencia
            let warning = tierGap > 0 
                ? `<div style="color:#ef4444; font-size:0.7rem; margin-top:2px;">⚠ INEFICIENTE (Perdida: ${penaltyPercent}%)</div>` 
                : '';

            // Cálculo del reembolso visual
            let refund = Math.floor(tier.captureCost * this.config.recycleRefund);

            html += `
            <div class="unit-card ${u.hp < 30 ? 'critical' : ''}">
                <div class="unit-main-row">
                    <div class="card-icon"><i class="fa-solid ${tier.icon}"></i></div>
                    <div class="card-info">
                        <div class="card-header">
                            <span class="unit-name">${u.name}</span>
                            ${warning}
                        </div>
                        <div class="stat-row">
                            <div class="mini-bar"><div class="fill" style="width:${u.hp}%"></div></div>
                        </div>
                        <div style="font-size:0.7rem; color:#777; display:flex; justify-content:space-between;">
                            <span>PROD: +${prodReal.toFixed(1)} L/s</span>
                        </div>
                    </div>
                </div>
                <div class="unit-actions-row">
                    <button class="btn-inline btn-heal" onclick="app.actionHeal(${u.id})">
                        <i class="fa-solid fa-syringe"></i><br>-15L
                    </button>
                    <button class="btn-inline btn-boost ${u.boosted?'active':''}" onclick="app.actionBoost(${u.id})">
                        <i class="fa-solid fa-bolt"></i><br>x2
                    </button>
                    <button class="btn-inline btn-recycle" onclick="app.actionRecycle(${u.id})">
                        <i class="fa-solid fa-recycle"></i><br>+${refund}L
                    </button>
                </div>
            </div>`;
        });
        this.dom.lists.units.innerHTML = html + '<div style="height:80px"></div>';
    },

    // Renderiza la información del Radar
    renderMapInfo: function() {
        let tier = this.tiers[this.state.unlockedTier];
        this.dom.map.cost.innerText = tier.captureCost;
        this.dom.map.target.innerText = tier.type;
        this.dom.map.info.innerHTML = `
            <li>> OBJETIVO: ${tier.name}</li>
            <li>> CATEGORÍA: ${tier.type}</li>
            <li>> RIESGO BIOLÓGICO: BAJO</li>
        `;
    },

    renderAll: function() {
        this.updateUI(0, 0);
        this.renderFarms();
        this.renderUnits();
        this.renderMapInfo();
    },

    // ================= NAVEGACIÓN SPA =================
    
    navigateTo: function(view) {
        // Ocultar todas las vistas
        Object.values(this.dom.views).forEach(el => el.classList.add('hidden'));
        this.dom.navBtns.forEach(b => b.classList.remove('active'));
        
        // Mostrar la seleccionada
        if(this.dom.views[view]) {
            this.dom.views[view].classList.remove('hidden');
            
            // Mapeo manual de botones activos
            let index = 0;
            if(view === 'extraction') index = 1;
            if(view === 'map') index = 2;
            if(view === 'society') index = 3;
            
            this.dom.navBtns[index].classList.add('active');
            
            // Refrescar render específico
            if(view === 'farms') this.renderFarms();
            if(view === 'extraction') this.renderUnits();
            if(view === 'map') this.renderMapInfo();
        }
    },

    // Muestra mensajes de tutorial
    showTutorial: function(msg) {
        this.dom.tutorialText.innerText = msg;
        this.dom.tutorialOverlay.classList.remove('hidden');
        // Se oculta automáticamente después de 5 segundos
        setTimeout(() => this.dom.tutorialOverlay.classList.add('hidden'), 5000);
    },

    // Activa la pantalla de derrota
    triggerGameOver: function() {
        this.state.isGameOver = true;
        this.dom.gameOverModal.classList.remove('hidden');
        if(navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
    },

    // ================= PERSISTENCIA =================
    saveGame: function() {
        if(!this.state.isGameOver) {
            localStorage.setItem('hidra_v3_save', JSON.stringify(this.state));
        }
    },
    loadGame: function() {
        let d = localStorage.getItem('hidra_v3_save');
        if(d) {
            try {
                // Merge seguro: Combina el save con el estado default para evitar errores si añades variables nuevas
                let saved = JSON.parse(d);
                this.state = { ...this.state, ...saved };
            } catch(e) {
                console.error("Save file corrupto, iniciando nueva partida.");
            }
        }
    },
    hardReset: function() {
        if(confirm("¿RESET COMPLETO? Se perderá todo el progreso.")) {
            localStorage.removeItem('hidra_v3_save');
            location.reload();
        }
    }
};

// Arrancar cuando el DOM esté listo
window.addEventListener('load', () => app.init());