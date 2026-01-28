'use strict';

/**
 * PROTOCOLO HIDRA - CAPÍTULO 8 (FINAL)
 * Space Shooter, Cinematic Ending, Share & Leaderboard
 */

const sfx = {
    ctx: null, masterGain: null,
    init: function() {
        return new Promise((resolve) => {
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioContext();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 0.3;
                this.masterGain.connect(this.ctx.destination);
            }
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().then(() => { console.log("AudioContext reanudado."); resolve(); });
            } else { resolve(); }
        });
    },
    playTone: function(freq, type, duration, vol = 1, slideTo = null) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
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
    error: function() { this.playTone(150, 'sawtooth', 0.4, 0.3); },
    success: function() { if (!this.ctx) this.init(); this.playTone(523.25, 'sine', 0.2, 0.2); setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.2), 100); },
    sonar: function() { if (!this.ctx) return; this.playTone(1200, 'sine', 0.3, 0.2); setTimeout(() => this.playTone(600, 'sine', 0.4, 0.05), 150); },
    mechanic: function() { this.playTone(100, 'square', 0.1, 0.2); },
    boost: function() { if(this.ctx) this.playTone(200, 'triangle', 0.4, 0.2, 800); },
    alarm: function() { if(this.ctx) { this.playTone(800, 'sawtooth', 0.5, 0.3, 200); }},
    clock: function() { if(this.ctx) { this.playTone(1000, 'sine', 0.05, 0.5); } }
};

// ================= SISTEMA DE LEADERBOARD =================
const leaderboard = {
    API_URL: "https://script.google.com/macros/s/AKfycbyeeh6ptSs5l3kd0rvFIiYODbrp2df1H4vU6CtPET9Y968VItL2QVXT6kN6OcbHG3AD/exec",
    
    currentWater: 0,
    currentAsteroids: 0,

    open: function() {
        sfx.click();
        const savedData = gameManager.loadProgress() || {};
        this.currentWater = Math.floor(savedData.water || 0);
        this.currentAsteroids = game.score; 

        document.getElementById('leaderboard-modal').classList.remove('hidden');
        this.fetchScores();
    },

    close: function() {
        sfx.click();
        document.getElementById('leaderboard-modal').classList.add('hidden');
    },

    submit: function() {
        const nameInput = document.getElementById('player-name');
        const statusMsg = document.getElementById('form-status');
        const submitBtn = document.querySelector('#score-form button');
        const name = nameInput.value.trim().toUpperCase();

        if (name.length < 3) {
            statusMsg.innerText = "NOMBRE MUY CORTO (MIN 3 LETRAS)";
            sfx.error();
            return;
        }

        statusMsg.innerText = "ENVIANDO DATOS...";
        sfx.mechanic();
        nameInput.disabled = true;
        submitBtn.disabled = true;

        const payload = { nombre: name, agua: this.currentWater, asteroides: this.currentAsteroids };

        fetch(this.API_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if(data.result === "success") {
                statusMsg.innerText = "¡REGISTRO CONFIRMADO!";
                statusMsg.style.color = "#10b981";
                sfx.success();
                setTimeout(() => this.fetchScores(), 1500);
            } else {
                throw new Error("Error del servidor");
            }
        })
        .catch(err => {
            console.error(err);
            statusMsg.innerText = "ERROR DE RED. PUEDE QUE SE HAYA GUARDADO.";
            sfx.error();
            nameInput.disabled = false;
            submitBtn.disabled = false;
        });
    },

    fetchScores: function() {
        const container = document.getElementById('lb-content');
        container.innerHTML = '<p style="padding:20px; text-align:center; color:#888;">CONECTANDO...</p>';

        fetch(this.API_URL)
        .then(res => res.json())
        .then(data => {
            let html = '';
            if (!data || data.length === 0) {
                container.innerHTML = '<p style="padding:20px; text-align:center">AÚN NO HAY REGISTROS.</p>';
                return;
            }

            const currentNameInput = document.getElementById('player-name');
            const myName = currentNameInput ? currentNameInput.value.trim().toUpperCase() : "";

            data.forEach((row, index) => {
                let rankClass = index < 3 ? `rank-${index+1}` : 'rank-idx';
                let icon = index === 0 ? '👑' : (index+1) + '.';
                let isMe = (row.nombre === myName && myName.length > 0);
                let rowClass = isMe ? 'lb-row my-score' : 'lb-row';
                
                html += `
                <div class="${rowClass}">
                    <span class="${rankClass}">${icon}</span>
                    <span style="color:#fff">${row.nombre}</span>
                    <span style="color:#38bdf8; text-align:right;">${row.agua} L</span>
                    <span style="color:#ef4444; text-align:right;">${row.asteroides}</span>
                </div>`;
            });
            container.innerHTML = html;
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = '<p style="padding:20px; color:#ef4444; text-align:center">ERROR AL CARGAR DATOS.</p>';
        });
    }
};

const game = {
    canvas: null, ctx: null, width: 0, height: 0,
    player: { x: 0, y: 0, width: 40, height: 40, speed: 5 },
    bullets: [], asteroids: [],
    credits: ["CREADORES:", "Javier Troncoso (El Mayoneso)", "Pablo Alvarado (Doro)", "", "", "", "", "", "CARRERA:", "Diseño Multimedia UpsQ", "", "", "", "", "", "MATERIAS:", "Programación web y disp. móviles", "Gest. procesos Multimedia", "", "", "", "", "", "GRACIAS A:", "Todos los que nos brindan su apoyo", "En especial a los que no", "", "", "", "", "", "", "", "VAO SYSTEMS", "FINAL DE TRANSMISIÓN"],
    creditsY: 0, score: 0, timeLeft: 60, gameLoopId: null, spawnInterval: null, shootInterval: null, timerInterval: null, isPlaying: false, audio: null,

    init: function() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.audio = document.getElementById('bgm');
        this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); this.handleInput(e.touches[0].clientX, e.touches[0].clientY) }, { passive: false });
        this.canvas.addEventListener('mousemove', (e) => this.handleInput(e.clientX, e.clientY));
        console.log("Capítulo Final Iniciado.");
    },
    resize: function() { this.width = window.innerWidth; this.height = window.innerHeight; this.canvas.width = this.width; this.canvas.height = this.height; this.creditsY = this.height + 50; },
    startSequence: function() {
        sfx.init().then(() => {
            document.getElementById('story-modal').classList.add('hidden');
            document.getElementById('game-ui').classList.remove('hidden');
            if(this.audio) { this.audio.volume = 0.5; this.audio.play().catch(e => console.log("Audio blocked")); }
            this.isPlaying = true;
            this.player.x = this.width / 2; this.player.y = this.height - 100;
            this.gameLoopId = requestAnimationFrame(() => this.loop());
            this.timerInterval = setInterval(() => { this.timeLeft--; document.getElementById('time-left').innerText = this.timeLeft; if(this.timeLeft <= 0) this.endGame(); }, 1000);
            this.spawnInterval = setInterval(() => this.spawnAsteroid(), 350);
            this.shootInterval = setInterval(() => this.shoot(), 300);
        });
    },
    handleInput: function(x, y) { if(!this.isPlaying) return; this.player.x = x - this.player.width/2; this.player.y = Math.max(this.height/2, Math.min(y - this.player.height/2, this.height - 60)); },
    shoot: function() { this.bullets.push({ x: this.player.x + this.player.width/2, y: this.player.y - 10, speed: 10 }); },
    spawnAsteroid: function() { const size = Math.random() * 30 + 20; this.asteroids.push({ x: Math.random() * this.width, y: -50, size: size, speed: Math.random() * 4 + 2, rotation: 0, rotSpeed: (Math.random() - 0.5) * 0.1 }); },
    loop: function() { if(!this.isPlaying) return; this.ctx.clearRect(0, 0, this.width, this.height); this.drawStars(); this.drawCredits(); this.updateGameObjects(); this.drawPlayer(); this.gameLoopId = requestAnimationFrame(() => this.loop()); },
    drawStars: function() { this.ctx.fillStyle = "#fff"; for(let i=0; i<20; i++) { this.ctx.fillRect(Math.random()*this.width, Math.random()*this.height, 1, 1); } },
    drawCredits: function() { this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)"; this.ctx.font = "20px 'Roboto Mono'"; this.ctx.textAlign = "center"; this.creditsY -= 0.8; this.credits.forEach((line, index) => { const y = this.creditsY + (index * 40); if(y > -50 && y < this.height + 50) { this.ctx.fillText(line, this.width/2, y); } }); },
    updateGameObjects: function() {
        this.ctx.fillStyle = "#38bdf8"; for(let i = this.bullets.length - 1; i >= 0; i--) { let b = this.bullets[i]; b.y -= b.speed; this.ctx.fillRect(b.x - 2, b.y, 4, 10); if(b.y < -10) this.bullets.splice(i, 1); }
        this.ctx.strokeStyle = "#ff0000"; this.ctx.lineWidth = 2;
        for(let i = this.asteroids.length - 1; i >= 0; i--) {
            let a = this.asteroids[i]; a.y += a.speed; a.rotation += a.rotSpeed;
            this.ctx.save(); this.ctx.translate(a.x, a.y); this.ctx.rotate(a.rotation); this.ctx.strokeRect(-a.size/2, -a.size/2, a.size, a.size); this.ctx.restore();
            for(let j = this.bullets.length - 1; j >= 0; j--) {
                let b = this.bullets[j]; let dx = a.x - b.x; let dy = a.y - b.y; let dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < a.size) { this.score++; document.getElementById('score').innerText = this.score; this.asteroids.splice(i, 1); this.bullets.splice(j, 1); break; }
            }
            if(a.y > this.height + 50) this.asteroids.splice(i, 1);
        }
    },
    drawPlayer: function() {
        this.ctx.fillStyle = "#fff"; this.ctx.font = '900 40px "Font Awesome 6 Free"'; this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle";
        const centerX = this.player.x + this.player.width/2; const centerY = this.player.y + this.player.height/2;
        this.ctx.save(); this.ctx.translate(centerX, centerY); this.ctx.rotate(-Math.PI / 2); this.ctx.fillText('\uf197', 0, 0); this.ctx.restore();
        this.ctx.fillStyle = "#f59e0b"; this.ctx.beginPath(); const bottomY = this.player.y + this.player.height - 5;
        this.ctx.moveTo(centerX - 5, bottomY); this.ctx.lineTo(centerX + 5, bottomY); this.ctx.lineTo(centerX, bottomY + 20 + Math.random()*15); this.ctx.fill();
    },
    endGame: function() {
        this.isPlaying = false; clearInterval(this.gameLoopId); clearInterval(this.timerInterval); clearInterval(this.spawnInterval); clearInterval(this.shootInterval);
        document.getElementById('game-ui').classList.add('hidden'); this.canvas.style.opacity = 0; setTimeout(() => this.playCinematic(), 1000);
    },
    playCinematic: function() {
        const container = document.getElementById('cinematic-container'); container.classList.remove('hidden');
        setTimeout(() => { container.classList.add('zoom-out'); container.classList.add('planet-visible'); }, 3000);
        setTimeout(() => { this.showFinalModal(); }, 8000);
    },
    showFinalModal: function() {
        const savedData = gameManager.loadProgress() || {};
        const finalWater = savedData.water || 0;
        document.getElementById('final-water').innerText = Math.floor(finalWater) + " L";
        document.getElementById('final-asteroids').innerText = this.score;
        document.getElementById('end-modal').classList.remove('hidden');
    },
    restartGame: function() { gameManager.clearProgress(); localStorage.clear(); window.location.href = "../index.html"; },
    goToRepo: function() { window.location.href = "https://donmayoneso.github.io/VAO/"; },
    shareLink: function() {
        const url = "https://donmayoneso.github.io/VAO/";
        const shareData = { title: 'PROTOCOLO HIDRA (VAO)', text: 'He completado el Protocolo Hidra. ¿Puedes sobrevivir tú al colapso?', url: url };
        if (navigator.share) { navigator.share(shareData).then(() => console.log('Shared')).catch((err) => console.log(err)); } 
        else { navigator.clipboard.writeText(url).then(() => alert("¡Enlace copiado!")).catch(err => prompt("Copia:", url)); }
    }
};

window.addEventListener('load', () => game.init());