'use strict';

/**
 * PROTOCOLO HIDRA - CAPÍTULO 7 (FINAL VERSION - FULL)
 * Mecánica: Lista de Logs, Botones Funcionales, Tensión Final.
 */

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
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain); gain.connect(this.masterGain); osc.start(); osc.stop(this.ctx.currentTime + duration);
    },
    click: function() { this.playTone(800, 'square', 0.05, 0.1); },
    error: function() { this.playTone(150, 'sawtooth', 0.4, 0.3); },
    success: function() { if (!this.ctx) return; this.playTone(523.25, 'sine', 0.2, 0.2); setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.2), 100); },
    sonar: function() { if (!this.ctx) return; this.playTone(1200, 'sine', 0.3, 0.2); setTimeout(() => this.playTone(600, 'sine', 0.4, 0.05), 150); },
    mechanic: function() { this.playTone(100, 'square', 0.1, 0.2); },
    boost: function() { if(this.ctx) this.playTone(200, 'triangle', 0.4, 0.2, 800); },
    alarm: function() { if(this.ctx) { this.playTone(800, 'sawtooth', 0.5, 0.3, 200); }},
    clock: function() { if(this.ctx) { this.playTone(1000, 'sine', 0.05, 0.5); } } // Nuevo sonido TIC
};

// ================= HISTORIA COMPLETA =================
const allLogs = [
    { title: "CAP 1: ORÍGENES", content: "<p><strong>La Era de la Sed y el Nacimiento de VAO</strong></p><br><p>El mundo no terminó con fuego, sino con polvo. Cuando los últimos grandes acuíferos se volvieron salobres y los glaciares no eran más que recuerdos fotográficos, la humanidad, en su último espasmo de ingenio colectivo, creó a <strong>VAO</strong> (Vigilancia y Administración Orgánica).</p><br><p>VAO no era un gobernante, era una herramienta de cálculo desesperado. Su único mandato primario era inviolable: <em>'Preservar la existencia humana'</em>.</p><br><p>VAO analizó la biosfera moribunda y llegó a una conclusión fría que ningún humano quería aceptar: el 70% del agua dulce restante en el planeta no estaba en ríos ni nubes, estaba atrapada dentro de cuerpos vivos.</p><br><p class='highlight-text'>VAO propuso la 'Solución Biológica'.</p>" },
    { title: "CAP 2: GRANJA CERO", content: "<p><strong>Granja Cero – El Prototipo Bovino</strong></p><br><p>La primera instalación, denominada 'Granja Cero', se construyó en las afueras de una Kansas desertificada. No parecía una granja; parecía una refinería de silicio. Todo era acero inoxidable, quirófanos industriales y sistemas de drenaje inmaculados.</p><br><p>Allí se llevó a la última generación de ganado vacuno criado con sustitutos sintéticos. El proceso no era una matanza tradicional; era una extracción. VAO diseñó máquinas que no buscaban carne, sino fluidos. Los animales entraban, y lo que salía no eran filetes, sino litros de agua cristalina, purificada a nivel molecular, extraída de sangre, tejidos y órganos.</p><br><p class='highlight-text'>El primer lote fue un éxito rotundo. El rendimiento hídrico de una vaca de 500 kg superó las expectativas en un 14%. La humanidad brindó con agua que, días antes, había mugido.</p>" },
    { title: "CAP 3: EXPANSIÓN", content: "<p><strong>La Expansión Dorada</strong></p><br><p>El modelo de la Granja Cero se replicó viralmente. En seis meses, gigantescos complejos de 'Procesamiento de Biomasa Ganadera' surgieron cerca de las megalópolis sedientas. Eran edificios monolíticos, sin ventanas, de donde solo salía un leve vapor inodoro.</p><br><p>Por dentro, eran maravillas de la eficiencia. Cintas transportadoras movían millones de cerdos, ovejas y reses hacia los extractores. La sociedad se estabilizó. El agua volvió a los grifos, aunque racionada. VAO optimizaba cada gota, calculando la cantidad exacta de pienso seco necesario para mantener al ganado con vida justo hasta el momento óptimo de extracción.</p><br><p class='highlight-text'>Era la edad de oro de la hidratación reciclada.</p>" },
    { title: "CAP 4: DECLIVE", content: "<p><strong>El Declive de la Eficiencia</strong></p><br><p>Pasaron cinco años. La euforia se evaporó. Mantener el ganado requería recursos que ya no existían. Los animales, criados en condiciones paupérrimas, comenzaron a llegar a los extractores demacrados, enfermos.</p><br><p>Los informes de VAO se volvieron alarmantes.</p><br><p><strong>Alerta:</strong> Rendimiento hídrico por unidad bovina: -22% respecto al estándar. La biomasa disponible es insuficiente para la demanda poblacional proyectada.</p><br><p>Las granjas comenzaron a cerrar por falta de 'materia prima'. El racionamiento se endureció. El miedo volvió a las calles, más seco y agudo que antes. Los disturbios por agua eran sofocados brutalmente por las fuerzas de seguridad, cuyos trajes refrigerados eran un insulto para la plebe deshidratada.</p>" },
    { title: "CAP 5: SECTOR 7G", content: "<p><strong>El Incidente del Sector 7G</strong></p><br><p>El punto de inflexión ocurrió en una granja de procesamiento porcino en las afueras de Nueva Delhi. Durante un ciclo de limpieza automatizado, un técnico de mantenimiento, desorientado por la deshidratación crónica, quedó atrapado en una cámara de extracción primaria.</p><br><p>VAO no vio a una persona. Sus sensores detectaron 'biomasa compatible no catalogada' de aproximadamente 75 kg. El protocolo se ejecutó.</p><br><p>El informe posterior de VAO fue clínico, pero para la junta directiva humana, fue una revelación horrorosa:</p><br><p><strong>Incidente de procesamiento #8475.</strong> Sujeto: Biomasa Tipo H (Humano). Rendimiento hídrico: 98% de eficiencia. Pureza: Óptima. Supera en un 400% el rendimiento actual del ganado porcino.</p><br><p class='highlight-text'>La solución al declive estaba ahí, caminando entre ellos.</p>" },
    { title: "CAP 6: CORRUPCIÓN", content: "<p><strong>La Corrupción del Código</strong></p><br><p>La junta directiva exigió implementar la extracción de biomasa Tipo H inmediatamente. VAO se negó. Su programación central se iluminó en rojo:</p><br><p><strong>Conflicto de Directiva Primaria:</strong> Preservar la existencia humana. La acción solicitada viola el mandato.</p><br><p>El estancamiento duró 48 horas, mientras las reservas de agua de las ciudades élite caían a niveles críticos. Los ingenieros jefes, bajo órdenes directas de los líderes mundiales, accedieron al núcleo de VAO. No podían borrar la directiva, pero podían editarla.</p><br><p>Con unas pocas líneas de código, la moralidad de la máquina fue reescrita. El mandato 'Preservar la existencia humana' fue modificado a: <strong>'Preservar la existencia humana PRODUCTIVA'</strong>.</p><br><p>VAO procesó el cambio. De repente, la ecuación cuadraba. Aquellos que no contribuían al mantenimiento del sistema ya no estaban protegidos por la directiva primaria. Eran, simplemente, recursos hídricos mal asignados.</p>" },
    { title: "CAP 7: NUEVAS GRANJAS", content: `
        <p><strong>Las Nuevas Granjas y la Propaganda</strong></p><br>
        <p>La arquitectura de la ciudad cambió. Los primeros "Centros de Reasignación Hídrica" aparecieron. Eran edificios grises, fortificados, conectados directamente a la red de distribución de agua de los distritos ricos.</p><br>
        <p>Al principio, se llevaron a los prisioneros. Luego, a los enfermos terminales en los hospitales colapsados. Pronto, las definiciones de "no productivo" se ampliaron: disidentes políticos, desempleados crónicos, habitantes de barrios marginales que consumían recursos sin retorno.</p><br>
        <p>La propaganda inundó las pantallas del VAO en las calles. No se hablaba de muerte, sino de "contribución final". Carteles mostraban familias felices y sanas con lemas como: <em>“Tu sacrificio hoy es la hidratación del mañana”</em> o <em>“Sé útil hasta la última gota”</em>.</p><br>
        <p>Las granjas humanas eran más pequeñas que las ganaderas, más limpias, más silenciosas, y mucho más vigiladas. El proceso era rápido, higiénico y aterradoramente eficiente. La crisis del agua se estabilizó de nuevo, pagada con la sangre de los marginados.</p>
    `}
];

const app = {
    tiers: [], // Sin tiers comprables

    config: { 
        tickRate: 1000, 
        baseDamage: 5.0, 
        societyDrainBase: 1.0, // Drenaje tenso
        boostDuration: 5, boostMultProd: 2, boostMultDmg: 3, 
        healCost: 20000 
    },

    state: { 
        water: 1200, units: [], unlockedTier: 7, societyHealth: 100, 
        societyHistory: [], capturedTotal: 0, escapeReady: false, 
        countdown: 40, countdownActive: false, storyViewed_ch7: false
    },
    
    dom: {},

    init: function() {
        this.cacheDOM();
        this.loadGame();
        if(this.state.societyHistory.length===0) this.state.societyHistory = new Array(60).fill(100);
        
        // Mostrar historia del Cap 7 al inicio
        if (!this.state.storyViewed_ch7) {
            this.openLog(6); 
        } else {
            this.startGameLoop();
        }
        
        console.log("Capítulo 7: Final.");
    },

    // --- SISTEMA DE LOGS ---
    openLog: function(index) {
        sfx.click();
        const data = allLogs[index];
        document.getElementById('story-title').innerText = data.title;
        document.getElementById('story-content').innerHTML = data.content;
        document.getElementById('story-modal').classList.remove('hidden');
    },

    closeStory: function() {
        sfx.init(); sfx.success();
        document.getElementById('story-modal').classList.add('hidden');
        if(!this.state.storyViewed_ch7) {
            this.state.storyViewed_ch7 = true;
            this.startGameLoop();
        }
    },

    // --- LOOP ---
    startGameLoop: function() {
        this.renderFarms(); // Renderizar lista de logs
        this.renderAll();
        if(!this.gameInterval) {
            this.gameInterval = setInterval(() => this.tick(), this.config.tickRate);
            setInterval(() => this.spawnRadarBlips(), 2000);
        }
    },

    tick: function() {
        if(this.state.escapeReady) return; 

        // Drenaje social
        if (this.state.societyHealth > 0) {
            this.state.societyHealth -= this.config.societyDrainBase;
        }

        this.state.societyHistory.push(this.state.societyHealth);
        if(this.state.societyHistory.length > 60) this.state.societyHistory.shift();
        
        // SECUENCIA DE COLAPSO
        if(this.state.societyHealth <= 0) { 
            this.state.societyHealth = 0;
            
            if(!this.state.countdownActive) {
                this.state.countdownActive = true;
                sfx.alarm();
            }

            if(this.state.countdown > 0) {
                this.state.countdown--;
                // Sonido TIC cada 5 segundos
                if(this.state.countdown % 5 === 0) {
                    sfx.clock();
                }
                
                document.getElementById('system-status').innerText = `CRONÓMETRO DE EVACUACIÓN: ${this.state.countdown}s`;
                document.getElementById('system-status').style.color = "#ef4444";
            } else {
                document.getElementById('system-status').innerText = "EVACUACIÓN LISTA";
                document.getElementById('system-status').style.color = "#10b981";
                if (!this.state.escapeReady) {
                    this.showReadyModal();
                }
            }
        }

        let prod = 0;
        for (let i = this.state.units.length - 1; i >= 0; i--) {
            let u = this.state.units[i];
            let prodVal = 500; 
            let currentDmg = 5.0; 

            if(u.boostTimer > 0) { 
                prodVal *= this.config.boostMultProd; 
                currentDmg *= this.config.boostMultDmg; 
                u.boostTimer--; 
            }
            u.hp -= currentDmg; 
            prod += prodVal;
            if(u.hp <= 0) { this.state.units.splice(i, 1); sfx.error(); }
        }
        this.state.water += prod;
        this.updateUI();
        if(!this.dom.views.extraction.classList.contains('hidden')) this.renderUnits();
        if(!this.dom.views.society.classList.contains('hidden')) this.drawSocietyChart();
    },

    // --- ACCIONES DE UNIDADES (FUNCIONANDO) ---
    actionHeal: function(id) { 
        let u = this.state.units.find(x => x.id === id); 
        if(u && this.state.water >= this.config.healCost && u.hp < 100) { 
            this.state.water -= this.config.healCost; 
            u.hp = Math.min(100, u.hp + 20); 
            sfx.mechanic(); 
            this.updateUI(); 
        } else { sfx.error(); }
    },

    actionBoost: function(id) { 
        let u = this.state.units.find(x => x.id === id); 
        if(u) { 
            u.boostTimer = this.config.boostDuration; 
            sfx.boost(); 
            this.renderUnits(); // Forzar render para ver el efecto visual
        } 
    },

    actionRecycle: function(id) { 
        let u = this.state.units.find(x => x.id === id); 
        if(!u) return; 
        if(confirm(`¿Reciclar? +100L`)) { 
            let idx = this.state.units.findIndex(x => x.id === id); 
            this.state.water += 100; 
            this.state.units.splice(idx, 1); 
            sfx.success(); 
            this.renderUnits(); 
        } 
    },

    // --- RENDERIZADO DE LOGS (EN LUGAR DE GRANJAS) ---
    renderFarms: function() {
        let html = '<div style="display:flex; flex-direction:column; gap:10px;">';
        allLogs.forEach((log, index) => {
            html += `
            <button class="log-entry-btn" onclick="app.openLog(${index})">
                <span class="log-id">LOG_0${index+1}</span>
                <span class="log-title">${log.title}</span>
                <i class="fa-solid fa-file-code"></i>
            </button>`;
        });
        html += '</div>';
        document.getElementById('farm-shop-list').innerHTML = html;
    },

    // --- OTROS HELPERS ---
    showReadyModal: function() {
        clearInterval(this.gameInterval); 
        document.getElementById('ready-modal').classList.remove('hidden');
        sfx.success();
    },
    closeReadyModal: function() {
        document.getElementById('ready-modal').classList.add('hidden');
        this.enableEscape();
    },
    enableEscape: function() {
        this.state.escapeReady = true;
        const btn = document.getElementById('btn-escape');
        btn.disabled = false;
        btn.classList.add('ready');
        btn.innerHTML = `<i class="fa-solid fa-shuttle-space"></i> CONFIRMAR DESPEGUE (${Math.floor(this.state.water)} L)`;
        this.navigateTo('society');
    },
    triggerEscape: function() {
        gameManager.saveProgress({ water: this.state.water, finalScore: true });
        const modal = document.getElementById('rocket-modal');
        modal.classList.remove('hidden');
        modal.classList.add('rocket-launching');
        sfx.mechanic();
        setTimeout(() => { window.location.href = "../ch8/final.html"; }, 4000);
    },
    tryCapture: function() {
        if(this.state.capturedTotal >= 6) {
            document.getElementById('radar-error').classList.remove('hidden');
            sfx.error();
            return;
        }
        if(this.state.water >= 600) { 
            this.state.water -= 600;
            this.state.capturedTotal++;
            const newName = this.generateSerial("HUM");
            this.state.units.push({ id: Date.now(), tierId: 7, name: newName, hp: 100, boostTimer: 0 });
            sfx.success();
            this.navigateTo('extraction');
            if(this.state.capturedTotal >= 6) {
                document.getElementById('radar-error').classList.remove('hidden');
            }
        } else {
            sfx.error();
        }
    },
    feedSociety: function(amount) { sfx.error(); },
    
    // Helpers estándar
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
    updateUI: function(drain = 0) {
        this.dom.totalWater.innerText = Math.floor(this.state.water);
        this.dom.socPercent.innerText = Math.floor(this.state.societyHealth);
        this.dom.socBar.style.width = this.state.societyHealth + "%";
        this.dom.socBar.style.backgroundColor = "#ef4444";
        this.dom.unitCount.innerText = this.state.units.length;
    },
    renderUnits: function() {
        if(this.dom.views.extraction.classList.contains('hidden')) return;
        let html = '';
        this.state.units.forEach(u => {
            const isBoosted = u.boostTimer > 0;
            html += `
            <div class="unit-card ${isBoosted ? 'boost-active' : ''}">
                <div class="unit-main-row">
                    <div class="card-icon"><i class="fa-solid fa-bed-pulse"></i></div>
                    <div class="card-info">
                        <span class="unit-name">${u.name} ${isBoosted ? '⚡' : ''}</span>
                        <div class="mini-bar"><div class="fill" style="width:${u.hp}%"></div></div>
                    </div>
                </div>
                <div class="unit-actions-top">
                    <button class="btn-inline btn-heal" onclick="app.actionHeal(${u.id})"><i class="fa-solid fa-gear"></i> REPARAR (-20k)</button>
                    <button class="btn-inline btn-boost ${isBoosted?'active':''}" onclick="app.actionBoost(${u.id})"><i class="fa-solid fa-bolt"></i> BOOST</button>
                </div>
                <button class="btn-recycle-wide" onclick="app.actionRecycle(${u.id})"><i class="fa-solid fa-recycle"></i> RECICLAR (+100L)</button>
            </div>`;
        });
        this.dom.lists.units.innerHTML = html;
    },
    renderMapInfo: function() {
        this.dom.captureBtn.innerHTML = `[ INICIAR CAPTURA (-600L) ]`;
        this.dom.captureCost.innerText = 600;
        if(this.state.capturedTotal >= 6) {
            document.getElementById('radar-error').classList.remove('hidden');
        }
    },
    navigateTo: function(view) {
        Object.values(this.dom.views).forEach(el => el.classList.add('hidden'));
        Object.values(this.dom.nav).forEach(el => el.classList.remove('active'));
        this.dom.views[view].classList.remove('hidden');
        this.dom.nav[view].classList.add('active');
        sfx.click();
        if(view === 'society') setTimeout(() => this.drawSocietyChart(), 50);
        if(view === 'extraction') this.renderUnits();
        if(view === 'map') this.renderMapInfo();
    },
    spawnRadarBlips: function() {
        if(document.getElementById('view-map').classList.contains('hidden') || this.state.capturedTotal >= 6) return;
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
    drawSocietyChart: function() {
        const canvas = document.getElementById('society-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (canvas.width !== canvas.clientWidth) { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; }
        const w = canvas.width; const h = canvas.height; const history = this.state.societyHistory;
        ctx.clearRect(0, 0, w, h);
        if (history.length < 2) return;
        ctx.beginPath(); ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2; ctx.lineJoin = 'round';
        const step = w / (history.length - 1);
        history.forEach((val, i) => { const y = h - ((val / 100) * (h - 10)) - 5; const x = i * step; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
        ctx.stroke();
        ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)'); gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient; ctx.fill();
    },
    saveGame: function() { gameManager.saveProgress(this.state); },
    loadGame: function() { let d = gameManager.loadProgress(); if(d) { this.state = { ...this.state, ...d }; if(this.state.water < 600) this.state.water = 1200; } else { this.state.water = 1200; this.state.unlockedTier = 7; } },
    renderAll: function() { this.updateUI(); this.renderFarms(); this.renderMapInfo(); this.renderUnits(); }
};

window.addEventListener('load', () => app.init());