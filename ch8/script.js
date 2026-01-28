'use strict';

/**
 * PROTOCOLO HIDRA - CAPÍTULO 8 (FINAL)
 * Space Shooter & Cinematic Ending & Share
 */

const game = {
    canvas: null, ctx: null,
    width: 0, height: 0,
    player: { x: 0, y: 0, width: 40, height: 40, speed: 5 },
    bullets: [],
    asteroids: [],
    
    credits: [
        "CREADORES:", "Javier Troncoso (El Mayoneso)", "Pablo Alvarado (Doro)", "", "", "", "", "",
        "CARRERA:", "Diseño Multimedia UpsQ", "", "", "", "", "",
        "MATERIAS:", "Programación web y disp. móviles", "Gest. procesos Multimedia", "", "", "", "", "",
        "GRACIAS A:", "Todos los que nos brindan su apoyo", "En especial a los que no", "", "", "", "", "", "", "",
        "VAO SYSTEMS", "FINAL DE TRANSMISIÓN"
    ],
    creditsY: 0,
    score: 0,
    timeLeft: 60,
    gameLoopId: null,
    spawnInterval: null,
    shootInterval: null, 
    timerInterval: null, 
    isPlaying: false,
    audio: null,

    init: function() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.audio = document.getElementById('bgm');
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleInput(e.touches[0].clientX, e.touches[0].clientY)
        }, { passive: false });
        this.canvas.addEventListener('mousemove', (e) => this.handleInput(e.clientX, e.clientY));
        
        console.log("Capítulo Final Iniciado.");
    },

    resize: function() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.creditsY = this.height + 50;
    },

    startSequence: function() {
        document.getElementById('story-modal').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        
        if(this.audio) {
            this.audio.volume = 0.5;
            this.audio.play().catch(e => console.log("Audio autoplay blocked"));
        }

        this.isPlaying = true;
        this.player.x = this.width / 2;
        this.player.y = this.height - 100;

        this.gameLoopId = requestAnimationFrame(() => this.loop());
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            document.getElementById('time-left').innerText = this.timeLeft;
            if(this.timeLeft <= 0) this.endGame();
        }, 1000);

        this.spawnInterval = setInterval(() => this.spawnAsteroid(), 350);
        this.shootInterval = setInterval(() => this.shoot(), 300);
    },

    handleInput: function(x, y) {
        if(!this.isPlaying) return;
        this.player.x = x - this.player.width/2;
        this.player.y = Math.max(this.height/2, Math.min(y - this.player.height/2, this.height - 60));
    },

    shoot: function() {
        // La bala sale un poco más arriba para que no salga del centro exacto
        this.bullets.push({ x: this.player.x + this.player.width/2, y: this.player.y - 10, speed: 10 });
    },

    spawnAsteroid: function() {
        const size = Math.random() * 30 + 20;
        this.asteroids.push({
            x: Math.random() * this.width,
            y: -50,
            size: size,
            speed: Math.random() * 4 + 2,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 0.1
        });
    },

    loop: function() {
        if(!this.isPlaying) return;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawStars();
        this.drawCredits();
        this.updateGameObjects();
        this.drawPlayer();
        this.gameLoopId = requestAnimationFrame(() => this.loop());
    },

    drawStars: function() {
        this.ctx.fillStyle = "#fff";
        for(let i=0; i<20; i++) {
            this.ctx.fillRect(Math.random()*this.width, Math.random()*this.height, 1, 1);
        }
    },

    drawCredits: function() {
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        this.ctx.font = "20px 'Roboto Mono'";
        this.ctx.textAlign = "center";
        this.creditsY -= 0.8;
        this.credits.forEach((line, index) => {
            const y = this.creditsY + (index * 40);
            if(y > -50 && y < this.height + 50) {
                this.ctx.fillText(line, this.width/2, y);
            }
        });
    },

    updateGameObjects: function() {
        this.ctx.fillStyle = "#38bdf8";
        for(let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.y -= b.speed;
            this.ctx.fillRect(b.x - 2, b.y, 4, 10);
            if(b.y < -10) this.bullets.splice(i, 1);
        }

        this.ctx.strokeStyle = "#ff0000";
        this.ctx.lineWidth = 2;
        for(let i = this.asteroids.length - 1; i >= 0; i--) {
            let a = this.asteroids[i];
            a.y += a.speed;
            a.rotation += a.rotSpeed;

            this.ctx.save();
            this.ctx.translate(a.x, a.y);
            this.ctx.rotate(a.rotation);
            this.ctx.strokeRect(-a.size/2, -a.size/2, a.size, a.size);
            this.ctx.restore();

            for(let j = this.bullets.length - 1; j >= 0; j--) {
                let b = this.bullets[j];
                let dx = a.x - b.x;
                let dy = a.y - b.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                if(dist < a.size) {
                    this.score++;
                    document.getElementById('score').innerText = this.score;
                    this.asteroids.splice(i, 1);
                    this.bullets.splice(j, 1);
                    break;
                }
            }
            if(a.y > this.height + 50) this.asteroids.splice(i, 1);
        }
    },

    // --- RENDERIZADO DEL JUGADOR (ICONO ROTADO) ---
    drawPlayer: function() {
        this.ctx.fillStyle = "#fff";
        this.ctx.font = '900 40px "Font Awesome 6 Free"';
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        // Calcular el centro de la nave
        const centerX = this.player.x + this.player.width/2;
        const centerY = this.player.y + this.player.height/2;

        // --- INICIO ROTACIÓN ---
        this.ctx.save(); // Guardar estado actual
        
        // Mover el punto de origen al centro de la nave
        this.ctx.translate(centerX, centerY);
        
        // Rotar -90 grados (o -PI/2 radianes) para apuntar hacia arriba
        this.ctx.rotate(-Math.PI / 2);
        
        // Dibujar el icono en el nuevo origen (0,0) relativo
        this.ctx.fillText('\uf197', 0, 0);
        
        this.ctx.restore(); // Restaurar estado (deshacer rotación para lo siguiente)
        // --- FIN ROTACIÓN ---
        
        // Fuego del motor (Dibujado normal, debajo de la nave)
        this.ctx.fillStyle = "#f59e0b";
        this.ctx.beginPath();
        // Ajustamos el punto de inicio del fuego para que coincida con la cola del cohete rotado
        const bottomY = this.player.y + this.player.height - 5; 

        this.ctx.moveTo(centerX - 5, bottomY);
        this.ctx.lineTo(centerX + 5, bottomY);
        this.ctx.lineTo(centerX, bottomY + 20 + Math.random()*15); // Llama parpadeante
        this.ctx.fill();
    },

    endGame: function() {
        this.isPlaying = false;
        clearInterval(this.gameLoopId);
        clearInterval(this.timerInterval);
        clearInterval(this.spawnInterval);
        clearInterval(this.shootInterval);
        document.getElementById('game-ui').classList.add('hidden');
        this.canvas.style.opacity = 0;
        setTimeout(() => this.playCinematic(), 1000);
    },

    playCinematic: function() {
        const container = document.getElementById('cinematic-container');
        container.classList.remove('hidden');
        setTimeout(() => {
            container.classList.add('zoom-out');
            container.classList.add('planet-visible');
        }, 3000);
        setTimeout(() => {
            this.showFinalModal();
        }, 8000);
    },

    showFinalModal: function() {
        const savedData = gameManager.loadProgress() || {};
        const finalWater = savedData.water || 0;
        document.getElementById('final-water').innerText = Math.floor(finalWater) + " L";
        document.getElementById('final-asteroids').innerText = this.score;
        document.getElementById('end-modal').classList.remove('hidden');
    },

    restartGame: function() {
        gameManager.clearProgress();
        localStorage.clear();
        window.location.href = "../index.html";
    },

    goToRepo: function() {
        window.location.href = "https://donmayoneso.github.io/VAO/";
    },

    shareLink: function() {
        const url = "https://donmayoneso.github.io/VAO/";
        const shareData = {
            title: 'PROTOCOLO HIDRA (VAO)',
            text: 'He completado el Protocolo Hidra. ¿Puedes sobrevivir tú al colapso?',
            url: url
        };

        if (navigator.share) {
            navigator.share(shareData)
                .then(() => console.log('Compartido con éxito'))
                .catch((err) => console.log('Error al compartir:', err));
        } else {
            navigator.clipboard.writeText(url).then(() => {
                alert("¡Enlace copiado al portapapeles! Compártelo con tus amigos.");
            }).catch(err => {
                 console.error('Error al copiar: ', err);
                 prompt("Copia el enlace manualmente:", url);
            });
        }
    }
};

window.addEventListener('load', () => game.init());