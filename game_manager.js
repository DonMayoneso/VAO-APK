class GameManager {
    constructor() {
        this.dbName = 'hidra_save_system';
        this.currentSaveSlot = 'auto_save';
    }

    // Guardar estado (DESACTIVADO PARA PRUEBAS)
    saveProgress(state) {
        // En modo producción aquí iría el localStorage.setItem
        console.log("Modo Pruebas: Guardado simulado (No se persiste en disco).", state);
        return true;
    }

    // Cargar estado (DESACTIVADO PARA PRUEBAS)
    loadProgress() {
        // En modo producción aquí iría el localStorage.getItem
        console.warn("Modo Pruebas: Carga desactivada. Iniciando estado fresco.");
        return null; // Retornar null fuerza al juego a usar los valores por defecto
    }

    // Borrar partida
    clearProgress() {
        console.log("Modo Pruebas: Limpieza simulada.");
        localStorage.removeItem(`${this.dbName}_${this.currentSaveSlot}`);
    }

    isFirstTime() {
        return !localStorage.getItem(`${this.dbName}_visited`);
    }

    setVisited() {
        localStorage.setItem(`${this.dbName}_visited`, 'true');
    }
}

const gameManager = new GameManager();