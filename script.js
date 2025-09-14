document.addEventListener('DOMContentLoaded', () => {
    // ============= ELEMEN DOM =============
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const timerElement = document.getElementById('timer');
    const finalScoreElement = document.getElementById('final-score');
    const gameOverElement = document.getElementById('game-over');
    const pauseElement = document.getElementById('pause');
    const restartBtn = document.getElementById('restart-btn');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const creditsBtn = document.getElementById('credits-btn');
    const settingsModal = document.getElementById('settings-modal');
    const creditsModal = document.getElementById('credits-modal');
    const closeSettings = document.getElementById('close-settings');
    const closeCredits = document.getElementById('close-credits');
    const musicToggle = document.getElementById('music-toggle');
    const soundEffectsToggle = document.getElementById('sound-effects-toggle');
    const musicVolumeSlider = document.getElementById('music-volume');
    const soundEffectsVolumeSlider = document.getElementById('sound-effects-volume');
    const newHighScoreElement = document.getElementById('new-high-score');
    
    // ============= ELEMEN AUDIO =============
    const backgroundMusic = document.getElementById('background-music');
    const eatSound = document.getElementById('eat-sound');
    const gameOverSound = document.getElementById('game-over-sound');
    const newHighscoreSound = document.getElementById('new-highscore-sound');
    const levelUpSound = document.getElementById('level-up-sound');
    
    // ============= KONSTANTA GAME =============
    const GRID_SIZE = 30;
    const GRID_WIDTH = canvas.width / GRID_SIZE;
    const GRID_HEIGHT = canvas.height / GRID_SIZE;
    const LIGHT_SQUARE = '#f0d9b5';
    const DARK_SQUARE = '#b58863';
    
    // ============= VARIABEL GAME =============
    let snake = [];
    let food = {};
    let direction = 'right';
    let nextDirection = 'right';
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let gameSpeed = 10; // Frames per second
    let gameRunning = false;
    let gameLoopId = null;
    let startTime = 0;
    let elapsedTime = 0;
    let timerInterval = null;
    let musicEnabled = true;
    let soundEffectsEnabled = true;
    let musicVolume = 0.7;
    let soundEffectsVolume = 0.7;
    let lastRenderTime = 0;
    let moveSoundCooldown = 0;
    let isPlayingSoundEffect = false;
    
    // ============= LOAD ASSETS =============
    const assets = {
        head_up: new Image(),
        head_down: new Image(),
        head_left: new Image(),
        head_right: new Image(),
        tail_up: new Image(),
        tail_down: new Image(),
        tail_left: new Image(),
        tail_right: new Image(),
        body_horizontal: new Image(),
        body_vertical: new Image(),
        body_topleft: new Image(),
        body_topright: new Image(),
        body_bottomleft: new Image(),
        body_bottomright: new Image(),
        apple: new Image()
    };
    
    // Set source for assets
    assets.head_up.src = './Graphics/head_up.png';
    assets.head_down.src = './Graphics/head_down.png';
    assets.head_left.src = './Graphics/head_left.png';
    assets.head_right.src = './Graphics/head_right.png';
    assets.tail_up.src = './Graphics/tail_up.png';
    assets.tail_down.src = './Graphics/tail_down.png';
    assets.tail_left.src = './Graphics/tail_left.png';
    assets.tail_right.src = './Graphics/tail_right.png';
    assets.body_horizontal.src = './Graphics/body_horizontal.png';
    assets.body_vertical.src = './Graphics/body_vertical.png';
    assets.body_topleft.src = './Graphics/body_topleft.png';
    assets.body_topright.src = './Graphics/body_topright.png';
    assets.body_bottomleft.src = './Graphics/body_bottomleft.png';
    assets.body_bottomright.src = './Graphics/body_bottomright.png';
    assets.apple.src = './Graphics/apple.png';
    
    // ============= INISIALISASI GAME =============
    function initGame() {
        snake = [
            {x: 5, y: 5},
            {x: 4, y: 5},
            {x: 3, y: 5}
        ];
        
        generateFood();
        score = 0;
        updateScore();
        direction = 'right';
        nextDirection = 'right';
        
        // Reset UI
        newHighScoreElement.classList.add('hidden');
        
        // Hapus interval waktu sebelumnya jika ada
        if (timerInterval) clearInterval(timerInterval);
        
        // Mulai timer
        startTime = Date.now();
        elapsedTime = 0;
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
        
        // Set volume
        updateAudioVolumes();
        
        // Play background music if enabled
        if (musicEnabled) {
            backgroundMusic.currentTime = 0;
            backgroundMusic.play().catch(e => console.log("Audio play failed:", e));
        }
    }
    
    // ============= UPDATE VOLUME AUDIO =============
    function updateAudioVolumes() {
        backgroundMusic.volume = musicVolume;
        eatSound.volume = soundEffectsVolume;
        gameOverSound.volume = soundEffectsVolume;
        newHighscoreSound.volume = soundEffectsVolume;
        levelUpSound.volume = soundEffectsVolume;
    }
    
    // ============= PLAY SOUND EFFECT =============
    function playSoundEffect(sound) {
        if (!soundEffectsEnabled) return;
        
        // Kurangi volume musik saat sound effect diputar
        backgroundMusic.volume = Math.max(0.1, musicVolume - 0.3);
        isPlayingSoundEffect = true;
        
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio play failed:", e));
        
        // Kembalikan volume musik setelah sound effect selesai
        sound.onended = () => {
            backgroundMusic.volume = musicVolume;
            isPlayingSoundEffect = false;
        };
    }
    
    // ============= GENERATOR MAKANAN =============
    function generateFood() {
        const x = Math.floor(Math.random() * GRID_WIDTH);
        const y = Math.floor(Math.random() * GRID_HEIGHT);
        
        // Pastikan makanan tidak muncul di tubuh ular
        for (let part of snake) {
            if (part.x === x && part.y === y) {
                return generateFood();
            }
        }
        
        food = {x, y};
    }
    
    // ============= UPDATE SCORE =============
    function updateScore() {
        scoreElement.textContent = score;
        highScoreElement.textContent = highScore;
    }
    
    // ============= UPDATE TIMER =============
    function updateTimer() {
        if (gameRunning) {
            elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsedTime / 60);
            const seconds = elapsedTime % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    // ============= DRAW CHESSBOARD =============
    function drawChessboard() {
        for (let x = 0; x < GRID_WIDTH; x++) {
            for (let y = 0; y < GRID_HEIGHT; y++) {
                ctx.fillStyle = (x + y) % 2 === 0 ? LIGHT_SQUARE : DARK_SQUARE;
                ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        }
    }
    
    // ============= GET SNAKE PART IMAGE =============
    function getSnakePartImage(segment, index) {
        if (index === 0) {
            // Head
            switch(direction) {
                case 'up': return assets.head_up;
                case 'down': return assets.head_down;
                case 'left': return assets.head_left;
                case 'right': return assets.head_right;
            }
        } else if (index === snake.length - 1) {
            // Tail - determine direction based on previous segment
            const prev = snake[index - 1];
            
            // Calculate direction with wrapping consideration
            let dx = segment.x - prev.x;
            let dy = segment.y - prev.y;
            
            // Handle wrapping
            if (dx > 1) dx = -1;
            if (dx < -1) dx = 1;
            if (dy > 1) dy = -1;
            if (dy < -1) dy = 1;
            
            if (dx === 1) return assets.tail_left;
            if (dx === -1) return assets.tail_right;
            if (dy === 1) return assets.tail_up;
            if (dy === -1) return assets.tail_down;
        } else {
            // Body - determine type based on adjacent segments
            const prev = snake[index - 1];
            const next = snake[index + 1];
            
            // Calculate differences with wrapping
            let dxPrev = segment.x - prev.x;
            let dyPrev = segment.y - prev.y;
            let dxNext = next.x - segment.x;
            let dyNext = next.y - segment.y;
            
            // Handle wrapping
            if (dxPrev > 1) dxPrev = -1;
            if (dxPrev < -1) dxPrev = 1;
            if (dyPrev > 1) dyPrev = -1;
            if (dyPrev < -1) dyPrev = 1;
            if (dxNext > 1) dxNext = -1;
            if (dxNext < -1) dxNext = 1;
            if (dyNext > 1) dyNext = -1;
            if (dyNext < -1) dyNext = 1;
            
            // Straight segments
            if (dxPrev === 0 && dxNext === 0) return assets.body_vertical;
            if (dyPrev === 0 && dyNext === 0) return assets.body_horizontal;
            
            // Corner segments
            if ((dxPrev === 1 && dyNext === -1) || (dyPrev === 1 && dxNext === -1)) return assets.body_bottomleft;
            if ((dxPrev === -1 && dyNext === -1) || (dyPrev === 1 && dxNext === 1)) return assets.body_bottomright;
            if ((dxPrev === 1 && dyNext === 1) || (dyPrev === -1 && dxNext === -1)) return assets.body_topleft;
            if ((dxPrev === -1 && dyNext === 1) || (dyPrev === -1 && dxNext === 1)) return assets.body_topright;
        }
        
        // Default to horizontal body part
        return assets.body_horizontal;
    }
    
    // ============= DRAW GAME =============
    function draw() {
        // Draw chessboard background
        drawChessboard();
        
        // Draw food (apple)
        if (assets.apple.complete) {
            ctx.drawImage(assets.apple, food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        } else {
            // Fallback if apple image not loaded
            ctx.fillStyle = '#e94560';
            ctx.beginPath();
            ctx.arc(
                food.x * GRID_SIZE + GRID_SIZE/2,
                food.y * GRID_SIZE + GRID_SIZE/2,
                GRID_SIZE/2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        // Draw snake
        for (let i = 0; i < snake.length; i++) {
            const segment = snake[i];
            const img = getSnakePartImage(segment, i);
            
            if (img.complete) {
                ctx.drawImage(img, segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            } else {
                // Fallback if image not loaded
                ctx.fillStyle = (i === 0) ? '#2a9d8f' : '#4ecca3';
                ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        }
    }
    
    // ============= UPDATE GAME STATE =============
    function update() {
        // Update direction
        direction = nextDirection;
        
        // Save previous head position
        const head = {x: snake[0].x, y: snake[0].y};
        
        // Move head based on direction
        if (direction === 'right') head.x++;
        if (direction === 'left') head.x--;
        if (direction === 'up') head.y--;
        if (direction === 'down') head.y++;
        
        // Handle wrapping around edges
        if (head.x < 0) head.x = GRID_WIDTH - 1;
        if (head.x >= GRID_WIDTH) head.x = 0;
        if (head.y < 0) head.y = GRID_HEIGHT - 1;
        if (head.y >= GRID_HEIGHT) head.y = 0;
        
        // Check collision with self
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                gameOver();
                return;
            }
        }
        
        // Add new head
        snake.unshift(head);
        
        // Check if food eaten
        if (head.x === food.x && head.y === food.y) {
            // Add score
            score += 10;
            
            // Play eat sound if enabled
            playSoundEffect(eatSound);
            
            // Check for level up (every 50 points)
            if (score % 50 === 0) {
                playSoundEffect(levelUpSound);
            }
            
            // Update UI
            updateScore();
            
            // Generate new food
            generateFood();
        } else {
            // Remove tail if no food eaten
            snake.pop();
        }
    }
    
    // ============= GAME LOOP =============
    function gameLoop(currentTime) {
        if (!gameRunning) return;
        
        window.requestAnimationFrame(gameLoop);
        
        const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
        if (secondsSinceLastRender < 1 / gameSpeed) return;
        
        lastRenderTime = currentTime;
        
        update();
        draw();
    }
    
    // ============= GAME OVER =============
    function gameOver() {
        gameRunning = false;
        
        // Stop background music
        backgroundMusic.pause();
        
        // Play game over sound if enabled
        playSoundEffect(gameOverSound);
        
        // Update high score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            newHighScoreElement.classList.remove('hidden');
            
            // Play new high score sound if enabled
            playSoundEffect(newHighscoreSound);
        }
        
        // Show game over screen
        finalScoreElement.textContent = score;
        gameOverElement.classList.remove('hidden');
        
        // Enable start button again
        startBtn.disabled = false;
    }
    
    // ============= TOGGLE PAUSE =============
    function togglePause() {
        if (!gameRunning) return;
        
        if (pauseElement.classList.contains('hidden')) {
            // Pause the game
            pauseElement.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
            resumeBtn.classList.remove('hidden');
            
            // Pause background music
            backgroundMusic.pause();
        } else {
            // Resume the game
            pauseElement.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
            resumeBtn.classList.add('hidden');
            
            // Resume background music if enabled
            if (musicEnabled) {
                backgroundMusic.play().catch(e => console.log("Audio play failed:", e));
            }
            
            // Resume game loop
            lastRenderTime = performance.now();
            window.requestAnimationFrame(gameLoop);
        }
    }
    
    // ============= START GAME =============
    function startGame() {
        if (!gameRunning) {
            initGame();
            gameOverElement.classList.add('hidden');
            pauseElement.classList.add('hidden');
            resumeBtn.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
            gameRunning = true;
            lastRenderTime = performance.now();
            window.requestAnimationFrame(gameLoop);
            startBtn.disabled = true;
            pauseBtn.disabled = false;
        }
    }
    
    // ============= RESTART GAME =============
    function restartGame() {
        initGame();
        gameOverElement.classList.add('hidden');
        pauseElement.classList.add('hidden');
        resumeBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        gameRunning = true;
        lastRenderTime = performance.now();
        window.requestAnimationFrame(gameLoop);
        startBtn.disabled = true;
        pauseBtn.disabled = false;
    }
    
    // ============= EVENT LISTENERS =============
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) return;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (direction !== 'left') nextDirection = 'right';
                break;
            case ' ':
                togglePause();
                break;
            case 'Escape':
                if (!pauseElement.classList.contains('hidden')) {
                    togglePause();
                }
                break;
        }
    });
    
    // Start button
    startBtn.addEventListener('click', startGame);
    
    // Pause button
    pauseBtn.addEventListener('click', togglePause);
    
    // Resume button
    resumeBtn.addEventListener('click', togglePause);
    
    // Restart button
    restartBtn.addEventListener('click', restartGame);
    
    // Settings button
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });
    
    // Credits button
    creditsBtn.addEventListener('click', () => {
        creditsModal.classList.remove('hidden');
    });
    
    // Close settings
    closeSettings.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
        // Save settings
        musicEnabled = musicToggle.checked;
        soundEffectsEnabled = soundEffectsToggle.checked;
        musicVolume = parseFloat(musicVolumeSlider.value);
        soundEffectsVolume = parseFloat(soundEffectsVolumeSlider.value);
        
        // Update audio based on settings
        updateAudioVolumes();
        
        if (musicEnabled && gameRunning && pauseElement.classList.contains('hidden')) {
            backgroundMusic.play().catch(e => console.log("Audio play failed:", e));
        } else {
            backgroundMusic.pause();
        }
    });
    
    // Close credits
    closeCredits.addEventListener('click', () => {
        creditsModal.classList.add('hidden');
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
            musicEnabled = musicToggle.checked;
            soundEffectsEnabled = soundEffectsToggle.checked;
            musicVolume = parseFloat(musicVolumeSlider.value);
            soundEffectsVolume = parseFloat(soundEffectsVolumeSlider.value);
            
            // Update audio based on settings
            updateAudioVolumes();
            
            if (musicEnabled && gameRunning && pauseElement.classList.contains('hidden')) {
                backgroundMusic.play().catch(e => console.log("Audio play failed:", e));
            } else {
                backgroundMusic.pause();
            }
        }
        if (e.target === creditsModal) {
            creditsModal.classList.add('hidden');
        }
    });
    
    // Volume sliders
    musicVolumeSlider.addEventListener('input', () => {
        musicVolume = parseFloat(musicVolumeSlider.value);
        if (!isPlayingSoundEffect) {
            backgroundMusic.volume = musicVolume;
        }
    });
    
    soundEffectsVolumeSlider.addEventListener('input', () => {
        soundEffectsVolume = parseFloat(soundEffectsVolumeSlider.value);
        updateAudioVolumes();
    });
    
    // Toggle switches
    musicToggle.addEventListener('change', () => {
        musicEnabled = musicToggle.checked;
        if (musicEnabled && gameRunning && pauseElement.classList.contains('hidden')) {
            backgroundMusic.play().catch(e => console.log("Audio play failed:", e));
        } else {
            backgroundMusic.pause();
        }
    });
    
    soundEffectsToggle.addEventListener('change', () => {
        soundEffectsEnabled = soundEffectsToggle.checked;
    });
    
    // ============= INITIALIZATION =============
    updateScore();
    
    // Draw initial state after images are loaded
    let imagesLoaded = 0;
    const totalImages = Object.keys(assets).length;
    
    for (const key in assets) {
        assets[key].onload = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                draw();
            }
        };
        
        // Handle image loading errors
        assets[key].onerror = () => {
            console.error(`Failed to load image: ${key}`);
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                draw();
            }
        };
    }
    
    // Disable pause button initially
    pauseBtn.disabled = true;
    
    // Set initial toggle states
    musicToggle.checked = musicEnabled;
    soundEffectsToggle.checked = soundEffectsEnabled;
    musicVolumeSlider.value = musicVolume;
    soundEffectsVolumeSlider.value = soundEffectsVolume;
    
    // Initial draw
    draw();
});