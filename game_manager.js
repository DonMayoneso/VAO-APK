class GameManager {
    constructor() {
        this.dbName = 'hidra_save_system';
        this.currentSaveSlot = 'auto_save';
    }

    // Guardar estado
    saveProgress(state) {
        try {
            const key = `${this.dbName}_${this.currentSaveSlot}`;
            // Agregamos un timestamp para saber cuándo se guardó (útil para debug)
            state.timestamp = Date.now(); 
            const serializedState = JSON.stringify(state);
            localStorage.setItem(key, serializedState);
            // console.log("Progreso guardado:", state); // Descomentar para depurar
            return true;
        } catch (e) {
            console.error("Error crítico al guardar:", e);
            return false;
        }
    }

    // Cargar estado
    loadProgress() {
        try {
            const key = `${this.dbName}_${this.currentSaveSlot}`;
            const serializedState = localStorage.getItem(key);
            
            if (serializedState === null) {
                console.warn("No hay partida guardada. Iniciando valores por defecto del Capítulo.");
                return null; // Esto le dice al script del capítulo que use sus valores iniciales
            }

            const state = JSON.parse(serializedState);
            console.log("Partida cargada exitosamente.");
            return state;
        } catch (e) {
            console.error("Error al cargar (Archivo corrupto):", e);
            return null;
        }
    }

    // Borrar partida (HARD RESET)
    clearProgress() {
        const saveKey = `${this.dbName}_${this.currentSaveSlot}`;
        const visitKey = `${this.dbName}_visited`;
        
        // 1. Borrar datos de juego
        localStorage.removeItem(saveKey);
        
        // 2. Borrar marca de "Visto" para que las intros salgan de nuevo
        localStorage.removeItem(visitKey);
        
        console.log("⚠️ SISTEMA PURGADO: Todos los datos han sido eliminados.");
    }

    // Verificar si es la primera vez (para mostrar modales de historia)
    isFirstTime() {
        return !localStorage.getItem(`${this.dbName}_visited`);
    }

    // Marcar que el jugador ya vio la intro/tutorial
    setVisited() {
        localStorage.setItem(`${this.dbName}_visited`, 'true');
    }
}

// Instancia global disponible para todos los scripts
const gameManager = new GameManager();