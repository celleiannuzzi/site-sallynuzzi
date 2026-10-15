// ==========================================================================
// Sally Nuzzi Web Haven - Interatividades & Bugigangas
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  initHeaderVisitorCounter();
  initGlobalHeaderAudio();
  
  if (document.getElementById('arcadeCanvas')) {
    initRetroSnake();
  }
  if (document.getElementById('petDetailCard')) {
    initPetGalleryPage();
  }
});

/* --------------------------------------------------------------------------
   1. Cursor Personalizado com Efeito Magnético e Brilho
   -------------------------------------------------------------------------- */
function initCustomCursor() {
  const cursor = document.getElementById('customCursor');
  const dot = document.getElementById('cursorDot');
  if (!cursor || !dot) return;

  if (window.matchMedia('(pointer: coarse)').matches) {
    cursor.style.display = 'none';
    dot.style.display = 'none';
    return;
  }

  window.addEventListener('mousemove', (e) => {
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;

    setTimeout(() => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    }, 40);
  });

  const interactiveElements = document.querySelectorAll('a, button, input, .pet-link-card, .post-card, .cartridge');
  interactiveElements.forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
  });

  // Evitar que o cursor customizado trave ao passar por cima do vídeo (iframe do YouTube)
  const videoFrames = document.querySelectorAll('.crt-frame, iframe');
  videoFrames.forEach((frame) => {
    frame.addEventListener('mouseenter', () => {
      cursor.style.opacity = '0';
      dot.style.opacity = '0';
    });
    frame.addEventListener('mouseleave', () => {
      cursor.style.opacity = '1';
      dot.style.opacity = '1';
    });
  });
}

/* --------------------------------------------------------------------------
   2. Contador de Visitas no Cabeçalho
   -------------------------------------------------------------------------- */
function initHeaderVisitorCounter() {
  const counterEl = document.getElementById('headerVisitCount');
  if (!counterEl) return;

  let visits = parseInt(localStorage.getItem('sally_visitor_count') || '1337', 10);
  visits += 1;
  localStorage.setItem('sally_visitor_count', visits);
  counterEl.textContent = String(visits).padStart(6, '0');
}

/* --------------------------------------------------------------------------
   3. Player de Áudio Global no Cabeçalho
   - Playlist de músicas com Avançar / Voltar
   - Letreiro Marquee infinito com o nome da faixa
   - Botão Mute / Unmute inteligente com restauração de volume anterior
   - Fallback para sintetizador caso não encontre arquivo local
   -------------------------------------------------------------------------- */
const PLAYLIST = [
  {
    title: '✦ Bring Me The Horizon — Throne ✦',
    src: 'assets/audio/Bring_Me_The_Horizon_-_03._Throne_(mp3.pm).mp3'
  },
  {
    title: '✦ Bring Me The Horizon — Drown (Acoustic) ✦',
    src: 'assets/audio/Bring_me_the_horizon_-_Drow_Acoustic_(mp3.pm).mp3'
  },
  {
    title: '✦ Bring Me The Horizon — Sleepwalking ✦',
    src: 'assets/audio/Bring_Me_The_Horizon_-_Sleepwalkig_(mp3.pm).mp3'
  },
  {
    title: '✦ Riot Games — Get Jinxed ✦',
    src: 'assets/audio/Riot_Games_-_Get_Jinxed_(mp3.pm).mp3'
  },
  {
    title: '✦ BMTH — In The Dark (Renzyx & KONAR Remix) ✦',
    src: 'assets/audio/Trap_Nation_-_Bring_Me_The_Horizon_-_In_The_Dark_Renzyx_KONAR_Remix_(mp3.pm).mp3'
  }
];

function initGlobalHeaderAudio() {
  const toggleBtn = document.getElementById('globalAudioBtn');
  const prevBtn = document.getElementById('prevTrackBtn');
  const nextBtn = document.getElementById('nextTrackBtn');
  const muteBtn = document.getElementById('muteToggleBtn');
  const volumeSlider = document.getElementById('globalVolumeSlider');
  const marqueeText = document.getElementById('trackMarqueeText');
  const visualizer = document.getElementById('headerVisualizer');
  const audioElement = document.getElementById('ambientAudio');
  if (!toggleBtn) return;

  let currentTrackIndex = 0;
  let isPlaying = false;
  let isMuted = false;
  let previousVolume = 40; // Guarda o volume anterior ao mutar

  let audioCtx = null;
  let oscillator = null;
  let gainNode = null;

  function updateTrackDisplay() {
    const track = PLAYLIST[currentTrackIndex];
    if (marqueeText) {
      marqueeText.innerHTML = `<span>${track.title}</span>`;
    }
  }

  function updateVisualizer(playing) {
    if (playing) {
      visualizer?.classList.add('playing');
      const icon = toggleBtn.querySelector('.btn-icon');
      if (icon) icon.textContent = '⏸';
    } else {
      visualizer?.classList.remove('playing');
      const icon = toggleBtn.querySelector('.btn-icon');
      if (icon) icon.textContent = '▶';
    }
  }

  function startSynthesizer(frequency) {
    stopSynthesizer();
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();

    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency || 196, audioCtx.currentTime);

    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.value = 0.5;
    lfoGain.gain.value = 4;
    lfo.connect(oscillator.frequency);
    lfo.start();

    const currentVol = isMuted ? 0 : (volumeSlider.value / 100) * 0.15;
    gainNode.gain.setValueAtTime(currentVol, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
  }

  function stopSynthesizer() {
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
      oscillator = null;
      gainNode = null;
    }
  }

  function playCurrentTrack() {
    const track = PLAYLIST[currentTrackIndex];
    updateTrackDisplay();

    if (audioElement) {
      audioElement.src = track.src;
      audioElement.volume = isMuted ? 0 : volumeSlider.value / 100;
      audioElement.load();
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            stopSynthesizer();
            isPlaying = true;
            updateVisualizer(true);
          })
          .catch((err) => {
            console.warn('Erro ao tocar áudio real, fallback sintetizador:', err);
            startSynthesizer(196);
            isPlaying = true;
            updateVisualizer(true);
          });
      }
    }
  }

  // Tocar próxima música automaticamente quando a atual acabar
  if (audioElement) {
    audioElement.addEventListener('ended', () => {
      currentTrackIndex = (currentTrackIndex + 1) % PLAYLIST.length;
      playCurrentTrack();
    });
  }

  function pauseTrack() {
    if (audioElement && !audioElement.paused) {
      audioElement.pause();
    }
    stopSynthesizer();
    isPlaying = false;
    updateVisualizer(false);
  }

  // Play / Pause Toggle
  toggleBtn.addEventListener('click', () => {
    if (!isPlaying) {
      playCurrentTrack();
    } else {
      pauseTrack();
    }
  });

  // Próxima Música
  nextBtn?.addEventListener('click', () => {
    currentTrackIndex = (currentTrackIndex + 1) % PLAYLIST.length;
    if (isPlaying) {
      playCurrentTrack();
    } else {
      updateTrackDisplay();
    }
  });

  // Música Anterior
  prevBtn?.addEventListener('click', () => {
    currentTrackIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    if (isPlaying) {
      playCurrentTrack();
    } else {
      updateTrackDisplay();
    }
  });

  // Mutar / Desmutar ao Clicar no Ícone de Som
  muteBtn?.addEventListener('click', () => {
    if (!isMuted) {
      // Salva o volume atual antes de mutar
      previousVolume = parseInt(volumeSlider.value, 10);
      if (previousVolume === 0) previousVolume = 40;
      
      volumeSlider.value = 0;
      isMuted = true;
      muteBtn.textContent = '🔇';
      muteBtn.title = 'Desmutar (restaurar volume)';

      if (audioElement) audioElement.volume = 0;
      if (gainNode && audioCtx) gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    } else {
      // Desmuta e restaura para o volume anterior
      volumeSlider.value = previousVolume;
      isMuted = false;
      muteBtn.textContent = '🔊';
      muteBtn.title = 'Mutar som';

      const vol = previousVolume / 100;
      if (audioElement) audioElement.volume = vol;
      if (gainNode && audioCtx) gainNode.gain.setValueAtTime(vol * 0.15, audioCtx.currentTime);
    }
  });

  // Controle Manual do Slider de Volume
  volumeSlider?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (val === 0) {
      isMuted = true;
      if (muteBtn) muteBtn.textContent = '🔇';
    } else {
      isMuted = false;
      previousVolume = val;
      if (muteBtn) muteBtn.textContent = '🔊';
    }

    const vol = val / 100;
    if (audioElement) audioElement.volume = vol;
    if (gainNode && audioCtx) gainNode.gain.setValueAtTime(vol * 0.15, audioCtx.currentTime);
  });

  updateTrackDisplay();
}

/* --------------------------------------------------------------------------
   4. Página de Galeria dos Pets (Floki, Tom, Cabide)
   -------------------------------------------------------------------------- */
const PETS_DATA = {
  floki: {
    name: 'Floki 🐾',
    title: 'Guardião das Madrugadas e Caçador de Carinho',
    bio: 'Floki é a energia protetora e companheira da casa. Sempre por perto nos momentos de foco, pronto para aprovar cada linha de código com uma cabeçadinha de amor.',
    mainImg: 'assets/images/floki.png',
    folder: 'floki',
    photos: [
      { src: 'assets/images/floki.png', caption: '✦ Momento posudo oficial' }
    ]
  },
  tom: {
    name: 'Tom 🐱',
    title: 'Mestre do Sono Profundo e Ronrom Terapêutico',
    bio: 'Tom é a calmaria em pessoa. Apreciador dos melhores raios de sol, mestre em encontrar cantinhos confortáveis e terapeuta oficial através de ronrons.',
    mainImg: 'assets/images/tom.png',
    folder: 'tom',
    photos: [
      { src: 'assets/images/tom.png', caption: '✦ Olhar sereno do Tom' }
    ]
  },
  cabide: {
    name: 'Cabide 🖤',
    title: 'A Presença Icônica e Misteriosa',
    bio: 'Cabide guarda os maiores segredos da estética dark e gótica deste site. Onde quer que esteja, entrega puro estilo e presença marcante.',
    mainImg: 'assets/images/cabide.png',
    folder: 'cabide',
    photos: [
      { src: 'assets/images/cabide.png', caption: '✦ Aura lendária do Cabide' }
    ]
  }
};

function initPetGalleryPage() {
  const urlParams = new URLSearchParams(window.location.search);
  let currentPet = urlParams.get('pet') || 'floki';
  if (!PETS_DATA[currentPet]) currentPet = 'floki';

  renderPetData(currentPet);

  const tabs = document.querySelectorAll('.pet-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const petKey = tab.getAttribute('data-pet');
      renderPetData(petKey);
      
      const newUrl = `${window.location.pathname}?pet=${petKey}`;
      window.history.replaceState({}, '', newUrl);
    });
  });
}

function renderPetData(petKey) {
  const data = PETS_DATA[petKey];
  if (!data) return;

  document.querySelectorAll('.pet-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-pet') === petKey);
  });

  document.getElementById('petWindowTitle').textContent = `gallery: ${petKey}.dat`;
  document.getElementById('petMainPhoto').src = data.mainImg;
  document.getElementById('petName').textContent = data.name;
  document.getElementById('petTitle').textContent = data.title;
  document.getElementById('petBio').textContent = data.bio;
  document.getElementById('petFolderTarget').textContent = data.name.split(' ')[0];
  document.getElementById('folderNameSpan').textContent = data.folder;

  const albumEl = document.getElementById('photoAlbum');
  albumEl.innerHTML = '';

  data.photos.forEach(photo => {
    const card = document.createElement('div');
    card.className = 'polaroid-card';
    card.innerHTML = `
      <div class="polaroid-img-box">
        <img src="${photo.src}" alt="${photo.caption}">
      </div>
      <p class="polaroid-caption">${photo.caption}</p>
    `;
    albumEl.appendChild(card);
  });

  const uploadHint = document.createElement('div');
  uploadHint.className = 'polaroid-card';
  uploadHint.innerHTML = `
    <div class="polaroid-img-box" style="display:flex;align-items:center;justify-content:center;background:#1a0e30;border:2px dashed var(--purple-main);">
      <span style="font-size:2.5rem;">📸 ➕</span>
    </div>
    <p class="polaroid-caption">Coloque mais fotos em:<br><code>assets/images/pets/${data.folder}/</code></p>
  `;
  albumEl.appendChild(uploadHint);
}

/* --------------------------------------------------------------------------
   5. Mini-Arcade: Jogo da Cobrinha (Snake 99 Neon)
   -------------------------------------------------------------------------- */
function initRetroSnake() {
  const canvas = document.getElementById('arcadeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const startBtn = document.getElementById('startBtn');
  const scoreEl = document.getElementById('gameScore');
  const highScoreEl = document.getElementById('gameHighScore');

  const gridSize = 17;
  const tileCount = canvas.width / gridSize;

  let snake = [{ x: 10, y: 10 }];
  let velocity = { x: 0, y: 0 };
  let food = { x: 15, y: 15 };
  let score = 0;
  let highScore = localStorage.getItem('snakeHighScore') || 0;
  highScoreEl.textContent = highScore;

  let gameInterval = null;
  let isRunning = false;

  function resetGame() {
    snake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 }
    ];
    velocity = { x: 0, y: -1 };
    score = 0;
    scoreEl.textContent = score;
    spawnFood();
  }

  function spawnFood() {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  }

  function gameLoop() {
    const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    if (head.x < 0) head.x = tileCount - 1;
    if (head.x >= tileCount) head.x = 0;
    if (head.y < 0) head.y = tileCount - 1;
    if (head.y >= tileCount) head.y = 0;

    for (let i = 0; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        gameOver();
        return;
      }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = score;
      if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
      }
      spawnFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function draw() {
    ctx.fillStyle = '#0a0514';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(157, 78, 221, 0.08)';
    for (let i = 0; i < canvas.width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height);
      ctx.moveTo(0, i); ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    ctx.fillStyle = '#ff2a85';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff2a85';
    ctx.fillRect(food.x * gridSize + 2, food.y * gridSize + 2, gridSize - 4, gridSize - 4);

    snake.forEach((part, index) => {
      ctx.fillStyle = index === 0 ? '#e0aaff' : '#9d4edd';
      ctx.shadowBlur = index === 0 ? 12 : 5;
      ctx.shadowColor = '#c77dff';
      ctx.fillRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });

    ctx.shadowBlur = 0;
  }

  function gameOver() {
    clearInterval(gameInterval);
    isRunning = false;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff2a85';
    ctx.font = '22px Silkscreen, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    startBtn.textContent = '▶ JOGAR NOVAMENTE';
  }

  function startGame() {
    resetGame();
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 110);
    isRunning = true;
    startBtn.textContent = '⏸ REINICIAR';
  }

  startBtn.addEventListener('click', startGame);

  window.addEventListener('keydown', (e) => {
    if (!isRunning) return;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (velocity.y !== 1) velocity = { x: 0, y: -1 };
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (velocity.y !== -1) velocity = { x: 0, y: 1 };
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (velocity.x !== 1) velocity = { x: -1, y: 0 };
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (velocity.x !== -1) velocity = { x: 1, y: 0 };
        e.preventDefault();
        break;
    }
  });

  document.getElementById('btnUp')?.addEventListener('click', () => { if (velocity.y !== 1) velocity = { x: 0, y: -1 }; });
  document.getElementById('btnDown')?.addEventListener('click', () => { if (velocity.y !== -1) velocity = { x: 0, y: 1 }; });
  document.getElementById('btnLeft')?.addEventListener('click', () => { if (velocity.x !== 1) velocity = { x: -1, y: 0 }; });
  document.getElementById('btnRight')?.addEventListener('click', () => { if (velocity.x !== 1) velocity = { x: 1, y: 0 }; });

  draw();

  // Gerenciador de Troca de Cartuchos (Snake vs Flash Ruffle)
  initCartridgeSwitcher();
}

function initCartridgeSwitcher() {
  const cartridges = document.querySelectorAll('.cartridge');
  const snakeView = document.getElementById('snakeView');
  const flashView = document.getElementById('flashView');
  const ruffleContainer = document.getElementById('ruffleContainer');
  const activeTitle = document.getElementById('activeGameTitle');
  if (!cartridges.length || !snakeView || !flashView) return;

  cartridges.forEach((cart) => {
    cart.addEventListener('click', () => {
      cartridges.forEach((c) => c.classList.remove('active'));
      cart.classList.add('active');

      const gameType = cart.getAttribute('data-game');
      if (gameType === 'snake') {
        flashView.style.display = 'none';
        snakeView.style.display = 'block';
        if (ruffleContainer) ruffleContainer.innerHTML = '';
        if (activeTitle) activeTitle.textContent = 'running: snake_99.bin';
      } else if (gameType === 'flash') {
        const swfPath = cart.getAttribute('data-swf');
        const gameName = cart.getAttribute('data-title');
        snakeView.style.display = 'none';
        flashView.style.display = 'block';
        if (activeTitle) activeTitle.textContent = `running: ${gameName.toLowerCase().replace(/ /g, '_')}.swf`;

        loadFlashGame(swfPath);
      }
    });
  });
}

function loadFlashGame(swfPath) {
  const container = document.getElementById('ruffleContainer');
  if (!container) return;
  container.innerHTML = '';

  // Criar elemento Ruffle player
  if (window.RufflePlayer) {
    const ruffle = window.RufflePlayer.newest();
    const player = ruffle.createPlayer();
    player.style.width = '100%';
    player.style.height = '480px';
    container.appendChild(player);
    player.load(swfPath);
  } else {
    container.innerHTML = `
      <div style="padding: 2rem; color: var(--purple-bright);">
        <p>Carregando emulador Ruffle Flash...</p>
        <p style="font-size: 0.9rem; color: var(--text-dim); margin-top: 0.5rem;">Se demorar, verifique a conexão com a internet para baixar o emulador.</p>
      </div>
    `;
  }
}
