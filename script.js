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
    let gamePaused = false;
    let gameLoopId = null;
    let startTime = 0;
    let elapsedTime = 0;
    let pausedTime = 0;
    let timerInterval = null;
    let musicEnabled = true;
    let soundEffectsEnabled = true;
    let musicVolume = 0.7;
    let soundEffectsVolume = 0.7;
    let lastRenderTime = 0;
    
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
        gamePaused = false;
        
        // Reset UI
        newHighScoreElement.classList.add('hidden');
        
        // Hapus interval waktu sebelumnya jika ada
        if (timerInterval) clearInterval(timerInterval);
        
        // Mulai timer
        startTime = Date.now();
        elapsedTime = 0;
        pausedTime = 0;
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
        
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio play failed:", e));
    }
    
    // ============= GENERATOR MAKANAN =============
    function generateFood() {
        do {
            food = {
                x: Math.floor(Math.random() * GRID_WIDTH),
                y: Math.floor(Math.random() * GRID_HEIGHT)
            };
        } while (isSnakeCollision(food.x, food.y));
    }
    
    // ============= CHECK COLLISION WITH SNAKE =============
    function isSnakeCollision(x, y) {
        return snake.some(segment => segment.x === x && segment.y === y);
    }
    
    // ============= UPDATE SCORE =============
    function updateScore() {
        scoreElement.textContent = score;
        highScoreElement.textContent = highScore;
    }
    
    // ============= UPDATE TIMER =============
    function updateTimer() {
        if (gameRunning && !gamePaused) {
            elapsedTime = Math.floor((Date.now() - startTime - pausedTime) / 1000);
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
    
    // ============= GET DIRECTION BETWEEN TWO POINTS =============
    function getDirection(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        
        // Handle wrapping
        const wrappedDx = Math.abs(dx) > 1 ? (dx > 0 ? -1 : 1) : dx;
        const wrappedDy = Math.abs(dy) > 1 ? (dy > 0 ? -1 : 1) : dy;
        
        if (wrappedDx === 1) return 'right';
        if (wrappedDx === -1) return 'left';
        if (wrappedDy === 1) return 'down';
        if (wrappedDy === -1) return 'up';
        
        return 'right'; // default
    }
    
    // ============= GET SNAKE PART IMAGE =============
    function getSnakePartImage(segment, index) {
        if (index === 0) {
            // Head - gunakan direction saat ini
            switch(direction) {
                case 'up': return assets.head_up;
                case 'down': return assets.head_down;
                case 'left': return assets.head_left;
                case 'right': return assets.head_right;
                default: return assets.head_right;
            }
        } else if (index === snake.length - 1) {
            // Tail - arah berdasarkan dari mana ekor berasal
            if (snake.length > 1) {
                const prev = snake[index - 1];
                const tailDirection = getDirection(prev, segment);
                
                switch(tailDirection) {
                    case 'up': return assets.tail_up;
                    case 'down': return assets.tail_down;
                    case 'left': return assets.tail_left;
                    case 'right': return assets.tail_right;
                    default: return assets.tail_right;
                }
            }
            return assets.tail_right;
        } else {
            // Body - tentukan berdasarkan segmen sebelum dan sesudah
            const prev = snake[index - 1];
            const next = snake[index + 1];
            
            const dirFromPrev = getDirection(prev, segment);
            const dirToNext = getDirection(segment, next);
            
            // Straight segments
            if ((dirFromPrev === 'left' || dirFromPrev === 'right') && 
                (dirToNext === 'left' || dirToNext === 'right')) {
                return assets.body_horizontal;
            }
            if ((dirFromPrev === 'up' || dirFromPrev === 'down') && 
                (dirToNext === 'up' || dirToNext === 'down')) {
                return assets.body_vertical;
            }
            
            // Corner segments
            if ((dirFromPrev === 'right' && dirToNext === 'up') || 
                (dirFromPrev === 'down' && dirToNext === 'left')) {
                return assets.body_topleft;
            }
            if ((dirFromPrev === 'left' && dirToNext === 'up') || 
                (dirFromPrev === 'down' && dirToNext === 'right')) {
                return assets.body_topright;
            }
            if ((dirFromPrev === 'right' && dirToNext === 'down') || 
                (dirFromPrev === 'up' && dirToNext === 'left')) {
                return assets.body_bottomleft;
            }
            if ((dirFromPrev === 'left' && dirToNext === 'down') || 
                (dirFromPrev === 'up' && dirToNext === 'right')) {
                return assets.body_bottomright;
            }
            
            // Default to horizontal if can't determine
            return assets.body_horizontal;
        }
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
            
            if (img && img.complete) {
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
        if (gamePaused) return;
        
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
        if (isSnakeCollision(head.x, head.y)) {
            gameOver();
            return;
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
            if (score % 50 === 0 && score > 0) {
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
        
        gameLoopId = window.requestAnimationFrame(gameLoop);
        
        const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
        if (secondsSinceLastRender < 1 / gameSpeed) return;
        
        lastRenderTime = currentTime;
        
        update();
        draw();
    }
    
    // ============= GAME OVER =============
    function gameOver() {
        gameRunning = false;
        gamePaused = false;
        
        // Stop timer
        if (timerInterval) clearInterval(timerInterval);
        
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
            setTimeout(() => playSoundEffect(newHighscoreSound), 500);
        }
        
        // Show game over screen
        finalScoreElement.textContent = score;
        gameOverElement.classList.remove('hidden');
        
        // Reset UI buttons
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        pauseBtn.classList.remove('hidden');
        resumeBtn.classList.add('hidden');
        
        // Cancel game loop
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }
    }
    
    // ============= TOGGLE PAUSE =============
    function togglePause() {
        if (!gameRunning) return;
        
        if (!gamePaused) {
            // Pause the game
            gamePaused = true;
            pauseElement.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
            resumeBtn.classList.remove('hidden');
            
            // Record pause time
            pausedTime += Date.now();
            
            // Pause background music
            backgroundMusic.pause();
        } else {
            // Resume the game
            gamePaused = false;
            pauseElement.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
            resumeBtn.classList.add('hidden');
            
            // Adjust for paused time
            pausedTime = Date.now() - pausedTime;
            
            // Resume background music if enabled
            if (musicEnabled) {
                backgroundMusic.play().catch(e => console.log("Audio play failed:", e));
            }
            
            // Resume game loop
            lastRenderTime = performance.now();
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
            gamePaused = false;
            lastRenderTime = performance.now();
            gameLoopId = window.requestAnimationFrame(gameLoop);
            startBtn.disabled = true;
            pauseBtn.disabled = false;
        }
    }
    
    // ============= RESTART GAME =============
    function restartGame() {
        // Stop current game
        gameRunning = false;
        gamePaused = false;
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }
        if (timerInterval) clearInterval(timerInterval);
        
        // Start new game
        startGame();
    }
    
    // ============= EVENT LISTENERS =============
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!gameRunning || gamePaused) return;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (direction !== 'down') nextDirection = 'up';
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (direction !== 'up') nextDirection = 'down';
                e.preventDefault();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (direction !== 'right') nextDirection = 'left';
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (direction !== 'left') nextDirection = 'right';
                e.preventDefault();
                break;
        }
    });
    
    // Pause controls
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) return;
        
        if (e.key === ' ' || e.key === 'Spacebar') {
            togglePause();
            e.preventDefault();
        } else if (e.key === 'Escape') {
            if (gamePaused) {
                togglePause();
            }
            e.preventDefault();
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
    });
    
    // Close credits
    closeCredits.addEventListener('click', () => {
        creditsModal.classList.add('hidden');
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
        if (e.target === creditsModal) {
            creditsModal.classList.add('hidden');
        }
    });
    
    // Audio controls
    musicToggle.addEventListener('change', () => {
        musicEnabled = musicToggle.checked;
        if (musicEnabled && gameRunning && !gamePaused) {
            backgroundMusic.play().catch(e => console.log("Audio play failed:", e));
        } else {
            backgroundMusic.pause();
        }
    });
    
    soundEffectsToggle.addEventListener('change', () => {
        soundEffectsEnabled = soundEffectsToggle.checked;
    });
    
    musicVolumeSlider.addEventListener('input', () => {
        musicVolume = parseFloat(musicVolumeSlider.value);
        backgroundMusic.volume = musicVolume;
    });
    
    soundEffectsVolumeSlider.addEventListener('input', () => {
        soundEffectsVolume = parseFloat(soundEffectsVolumeSlider.value);
        updateAudioVolumes();
    });
    
    // ============= INITIALIZATION =============
    updateScore();
    
    // Wait for images to load
    let imagesLoaded = 0;
    const totalImages = Object.keys(assets).length;
    
    function checkImagesLoaded() {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            draw();
        }
    }
    
    // Load all images
    for (const key in assets) {
        assets[key].onload = checkImagesLoaded;
        assets[key].onerror = () => {
            console.warn(`Failed to load image: ${key}`);
            checkImagesLoaded();
        };
    }
    
    // Initial setup
    pauseBtn.disabled = true;
    musicToggle.checked = musicEnabled;
    soundEffectsToggle.checked = soundEffectsEnabled;
    musicVolumeSlider.value = musicVolume;
    soundEffectsVolumeSlider.value = soundEffectsVolume;
    
    // Initial draw
    initGame();
    gameRunning = false;
    gamePaused = false;
    if (timerInterval) clearInterval(timerInterval);
    backgroundMusic.pause();
    draw();
});