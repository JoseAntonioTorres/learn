// js/arcade-main.js
import { db } from './firebase-config.js'; // Si manejas Firebase modular

let currentGameModule = null; // Guardará la referencia al módulo activo
const GAME_CONTAINER_ID = 'arcade-game-container'; // Contenedor único en tu HTML

/**
 * Cambia de juego de forma dinámica y optimizada
 * @param {string} gameId - El ID del juego (ej. 'anagrams', 'invaders')
 */
async function launchGame(gameId) {
    // 1. Limpieza Preventiva: Si hay un juego corriendo, lo destruimos primero
    if (currentGameModule && typeof currentGameModule.destroy === 'function') {
        currentGameModule.destroy();
    }

    // 2. Limpiar el contenedor visual y preparar la interfaz
    const container = document.getElementById(GAME_CONTAINER_ID);
    container.innerHTML = '<div class="loader">Cargando componentes del juego...</div>';

    // 3. Actualizar el Salón de la Fama en Firebase para el nuevo juego
    loadHighScores(gameId); 

    try {
        // 4. CARGA MODULAR BAJO DEMANDA (La magia de la optimización)
        // Solo descarga el archivo .js del juego si el usuario lo va a jugar
        const modulePath = `./games/${gameId}.js`;
        currentGameModule = await import(modulePath);

        // 5. Inyectar callbacks para que el juego se comunique con el Arcade central
        currentGameModule.init(
            GAME_CONTAINER_ID,
            (finalScore) => handleGameOver(gameId, finalScore), // Callback de fin de juego
            (currentScore) => handleScoreUpdate(currentScore)   // Callback de actualización de puntos
        );

    } catch (error) {
        console.error(`Error al cargar el módulo del juego [${gameId}]:`, error);
        container.innerHTML = `
            <div class="error-msg">
                <p>No se pudo inicializar el juego de forma modular.</p>
                <small>Verifica que el archivo js/games/${gameId}.js exista y exporte init().</small>
            </div>
        `;
    }
}

// Manejadores centrales (Se ejecutan desde adentro del módulo del juego)
function handleScoreUpdate(points) {
    // Actualiza el marcador visible en el HUD general del Arcade
    document.getElementById('hud-score').innerText = `Puntos: ${points}`;
}

function handleGameOver(gameId, score) {
    console.log(`Juego terminado en ${gameId}. Puntaje final: ${score}`);
    // Aquí ejecutas tu modal de "Guardar récord" conectado a Firestore
    openSaveScoreModal(gameId, score);
}