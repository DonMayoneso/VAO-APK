class AudioController {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;

        // Crear contexto de audio compatible con todos los navegadores
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        // Crear control de volumen maestro
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.4; // Volumen general (0.0 a 1.0)
        this.masterGain.connect(this.ctx.destination);
        
        this.isInitialized = true;
        
        // Desbloquear audio para móviles (resume context)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Generador de tonos sintéticos
    playTone(freq, type, duration, vol = 1) {
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type; // 'sine' (suave), 'square' (retro), 'sawtooth' (agresivo)
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // Envolvente de sonido (Fade in - Fade out rápido para evitar "clicks")
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // --- EFECTOS DE SONIDO ESPECÍFICOS ---

    // Click de Interfaz (Corto y tecnológico)
    playClick() {
        this.playTone(800, 'square', 0.05, 0.1);
    }

    // Éxito / Compra / Captura (Acorde feliz)
    playSuccess() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        this.playTone(523.25, 'sine', 0.1, 0.2); // Do
        setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.2), 100); // Mi
        setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.2), 200); // Sol
    }

    // Error / Acceso Denegado (Grave y rasposo)
    playError() {
        this.playTone(150, 'sawtooth', 0.3, 0.3);
    }

    // Radar Ping (Agudo y resonante)
    playRadar() {
        this.playTone(1200, 'sine', 0.15, 0.05);
    }
}

// Instancia global que usará el script.js
const audioSys = new AudioController();