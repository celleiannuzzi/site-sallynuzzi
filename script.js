/**
 * ============================================================================
 * Sally Nuzzi Web Haven - Motor Interativo (script.js)
 * ============================================================================
 * 
 * O que este arquivo faz:
 * Este é o cérebro em JavaScript do site. Ele controla todas as interações dinâmicas:
 * 1. Inicializa o cursor animado da gatinha Pusheen Vampira com rastro suave.
 * 2. Registra e incrementa as visitas no navegador via LocalStorage.
 * 3. Gerencia o reprodutor de áudio completo no topo (músicas reais + sintetizador Web Audio).
 * 4. Carrega dinamicamente a biografia e badges do arquivo 'assets/sobre.json'.
 * 5. Controla a galeria interativa de gatinhos (Floki, Tom e Cabide).
 * 6. Executa o jogo clássico Snake (cobrinha) em canvas e troca de cartuchos para Flash (Ruffle).
 */

// Ponto de entrada: aguarda o HTML ser completamente processado pelo navegador antes de rodar os scripts
document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  initHeaderVisitorCounter();
  initGlobalHeaderAudio();
  loadDynamicSobreData();
  
  // Só inicializa o Snake se o canvas de arcade estiver presente na página
  if (document.getElementById('arcadeCanvas')) {
    initRetroSnake();
  }
  // Só inicializa a galeria dos pets se o container estiver presente na página
  if (document.getElementById('petDetailCard')) {
    initPetGalleryPage();
  }
});

/* --------------------------------------------------------------------------
   0. Carregamento Dinâmico do Sobre Mim
   -------------------------------------------------------------------------- */
/**
 * loadDynamicSobreData
 * 
 * Finalidade:
 * Lê o arquivo 'assets/sobre.json' via requisição Fetch e atualiza o texto
 * do container 'Sobre Mim', as tags/badges e o status de Marcelle sem precisar
 * alterar o código HTML diretamente.
 * 
 * Entradas: Nenhuma (busca o arquivo diretamente pelo caminho relativo).
 * Saídas: Nenhuma (manipula o DOM diretamente nos elementos id="dynamic*").
 */
function loadDynamicSobreData() {
  const bioEl = document.getElementById('dynamicBio');
  const statusEl = document.getElementById('dynamicStatusTag');
  const taglineEl = document.getElementById('dynamicTagline');
  const badgesEl = document.getElementById('dynamicBadges');
  
  // Se os elementos não existirem na página atual (ex: tela de contato ou jogos), encerra
  if (!bioEl) return;

  fetch('assets/sobre.json')
    .then(res => res.json())
    .then(data => {
      // Injeta o status atual (ex: "[status: em desenvolvimento]")
      if (data.statusTag && statusEl) statusEl.textContent = data.statusTag;
      // Injeta a frase de efeito abaixo do nome
      if (data.tagline && taglineEl) taglineEl.textContent = data.tagline;
      // Injeta a descrição da biografia
      if (data.bio && bioEl) bioEl.textContent = data.bio;
      // Renderiza as badges e tags dinâmicas como botõezinhos estilizados
      if (data.badges && badgesEl && Array.isArray(data.badges)) {
        badgesEl.innerHTML = '';
        data.badges.forEach(b => {
          const span = document.createElement('span');
          span.className = 'tag-badge';
          span.textContent = b;
          badgesEl.appendChild(span);
        });
      }
    })
    .catch(err => {
      // Caso ocorra algum erro na leitura do JSON, o site mantém os textos padrão do HTML
      console.warn('Usando valores padrão do HTML para o Sobre Mim:', err);
    });
}

/* --------------------------------------------------------------------------
   1. Cursor Personalizado com Efeito Magnético e Brilho
   -------------------------------------------------------------------------- */
/**
 * initCustomCursor
 * 
 * Finalidade:
 * Configura o rastro de cursor personalizado com a gatinha Pusheen Vampira
 * e um pontinho de luz neon que segue as coordenadas do ponteiro do mouse na tela.
 * Em dispositivos touch (celulares), o cursor customizado é desativado para não atrapalhar o toque.
 * 
 * Entradas: Nenhuma.
 * Saídas: Nenhuma.
 */
function initCustomCursor() {
  const cursor = document.getElementById('customCursor');
  const dot = document.getElementById('cursorDot');
  if (!cursor || !dot) return;

  // Desativa em celulares e telas touch
  if (window.matchMedia('(pointer: coarse)').matches) {
    cursor.style.display = 'none';
    dot.style.display = 'none';
    return;
  }

  // Atualiza as posições X e Y do cursor com pequeno atraso para dar efeito de suavidade e rastro
  window.addEventListener('mousemove', (e) => {
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;

    setTimeout(() => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    }, 40);
  });

  // Aumenta o brilho do cursor ao passar o mouse sobre botões, links e cartuchos
  const interactiveElements = document.querySelectorAll('a, button, input, .pet-link-card, .post-card, .cartridge');
  interactiveElements.forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
  });

  // Evita que o cursor customizado trave ou bloqueie a interação ao passar por cima do player de vídeo (YouTube)
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
/**
 * initHeaderVisitorCounter
 * 
 * Finalidade:
 * Simula um contador nostálgico dos anos 2000 no cabeçalho do site.
 * Salva a contagem no armazenamento local (LocalStorage) do navegador
 * para que cada visita seja somada e formatada com 6 dígitos (ex: 001338).
 * 
 * Entradas: Nenhuma.
 * Saídas: Nenhuma.
 */
function initHeaderVisitorCounter() {
  const counterEl = document.getElementById('headerVisitCount');
  if (!counterEl) return;

  // Lê a contagem atual salva no navegador ou começa na clássica 1337
  let visits = parseInt(localStorage.getItem('sally_visitor_count') || '1337', 10);
  visits += 1;
  localStorage.setItem('sally_visitor_count', visits);
  // Formata o número com zeros à esquerda (ex: 001338)
  counterEl.textContent = String(visits).padStart(6, '0');
}

/* --------------------------------------------------------------------------
   3. Player de Áudio Global no Cabeçalho
   - Playlist de músicas com Avançar / Voltar
   - Letreiro Marquee com o nome da faixa
   - Botão Mute / Unmute com memória de volume
   - Fallback de sintetizador caso o arquivo mp3 não carregue
   -------------------------------------------------------------------------- */
// Lista de faixas musicais disponíveis no reprodutor
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

/**
 * initGlobalHeaderAudio
 * 
 * Finalidade:
 * Gerencia todos os botões do player de música (Play, Pause, Próxima, Anterior,
 * Mute e controle deslizante de volume).
 * Inclui sintetizador Web Audio API de reserva caso o navegador bloqueie os MP3.
 * 
 * Entradas: Nenhuma.
 * Saídas: Nenhuma.
 */
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
  let previousVolume = 40; // Guarda o volume anterior para restaurar ao desmutar

  let audioCtx = null;
  let oscillator = null;
  let gainNode = null;

  // Atualiza o texto do letreiro com o título da música atual
  function updateTrackDisplay() {
    const track = PLAYLIST[currentTrackIndex];
    if (marqueeText) {
      marqueeText.innerHTML = `<span>${track.title}</span>`;
    }
  }

  // Anima as barrinhas do equalizador quando a música estiver tocando
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

  // Gera som ambiente sintético via Web Audio API caso o arquivo de áudio falhe
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

  // Interrompe o sintetizador de áudio Web Audio
  function stopSynthesizer() {
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
      oscillator = null;
      gainNode = null;
    }
  }

  // Inicia a reprodução da faixa atual selecionada na lista
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
            // Se o navegador barrar o carregamento do MP3, toca o sintetizador relaxante
            console.warn('Erro ao tocar áudio real, fallback sintetizador:', err);
            startSynthesizer(196);
            isPlaying = true;
            updateVisualizer(true);
          });
      }
    }
  }

  // Avança para a próxima música da lista automaticamente ao terminar a música atual
  if (audioElement) {
    audioElement.addEventListener('ended', () => {
      currentTrackIndex = (currentTrackIndex + 1) % PLAYLIST.length;
      playCurrentTrack();
    });
  }

  // Pausa a música ou sintetizador em execução
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

/**
 * initPetGalleryPage
 * 
 * Finalidade:
 * Inicializa a navegação da galeria de fotos dos gatos na página pets.html.
 * Lê o parâmetro '?pet=nome' na URL para abrir diretamente o pet escolhido
 * e adiciona o evento de clique nas abas para alternar sem recarregar a tela.
 * 
 * Entradas: Nenhuma (lê a query string window.location.search).
 * Saídas: Nenhuma.
 */
function initPetGalleryPage() {
  const urlParams = new URLSearchParams(window.location.search);
  let currentPet = urlParams.get('pet') || 'floki';
  if (!PETS_DATA[currentPet]) currentPet = 'floki';

  renderPetData(currentPet);

  // Alterna o gatinho exibido ao clicar em uma das abas
  const tabs = document.querySelectorAll('.pet-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const petKey = tab.getAttribute('data-pet');
      renderPetData(petKey);
      
      // Atualiza a URL no navegador sem recarregar a página
      const newUrl = `${window.location.pathname}?pet=${petKey}`;
      window.history.replaceState({}, '', newUrl);
    });
  });
}

/**
 * renderPetData
 * 
 * Finalidade:
 * Atualiza os elementos visuais da tela de pets (título, foto de destaque,
 * nome, biografia e lista de fotos Polaroid) com os dados do pet selecionado.
 * 
 * Argumentos de Entrada:
 * @param {string} petKey - Chave identificadora do pet ('floki', 'tom' ou 'cabide').
 * 
 * Saídas: Nenhuma (manipula o DOM diretamente).
 */
function renderPetData(petKey) {
  const data = PETS_DATA[petKey];
  if (!data) return;

  // Marca o botão da aba como ativo
  document.querySelectorAll('.pet-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-pet') === petKey);
  });

  // Atualiza os dados de texto e imagem principal
  document.getElementById('petWindowTitle').textContent = `gallery: ${petKey}.dat`;
  document.getElementById('petMainPhoto').src = data.mainImg;
  document.getElementById('petName').textContent = data.name;
  document.getElementById('petTitle').textContent = data.title;
  document.getElementById('petBio').textContent = data.bio;
  document.getElementById('petFolderTarget').textContent = data.name.split(' ')[0];
  document.getElementById('folderNameSpan').textContent = data.folder;

  // Monta as fotos estilo Polaroid no álbum
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

  // Card com instruções de como adicionar mais fotos na pasta do projeto
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
/**
 * initRetroSnake
 * 
 * Finalidade:
 * Executa o jogo clássico da Cobrinha (Snake) renderizado em um elemento HTML5 Canvas.
 * Controla a movimentação, colisão da cobra com seu próprio corpo, surgimento
 * de comidas neon, pontuação, recorde no LocalStorage e atalhos de teclado (WASD/Setas).
 * 
 * Entradas: Nenhuma.
 * Saídas: Nenhuma.
 */
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

  // Reinicia o estado inicial da cobra e pontuação
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

  // Gera uma comida em coordenadas aleatórias na grade
  function spawnFood() {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  }

  // Loop de atualização da física e movimentação do jogo
  function gameLoop() {
    const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    // Efeito de atravessar a borda da tela e aparecer do outro lado
    if (head.x < 0) head.x = tileCount - 1;
    if (head.x >= tileCount) head.x = 0;
    if (head.y < 0) head.y = tileCount - 1;
    if (head.y >= tileCount) head.y = 0;

    // Detecta colisão da cabeça com o próprio corpo
    for (let i = 0; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        gameOver();
        return;
      }
    }

    snake.unshift(head);

    // Quando come a comida
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

  // Desenha os elementos na tela (grade retrô, comida rosa neon e corpo da cobra)
  function draw() {
    ctx.fillStyle = '#0a0514';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha as linhas da grade sutil
    ctx.strokeStyle = 'rgba(157, 78, 221, 0.08)';
    for (let i = 0; i < canvas.width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height);
      ctx.moveTo(0, i); ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Desenha a comida com brilho neon
    ctx.fillStyle = '#ff2a85';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff2a85';
    ctx.fillRect(food.x * gridSize + 2, food.y * gridSize + 2, gridSize - 4, gridSize - 4);

    // Desenha cada segmento da cobrinha
    snake.forEach((part, index) => {
      ctx.fillStyle = index === 0 ? '#e0aaff' : '#9d4edd';
      ctx.shadowBlur = index === 0 ? 12 : 5;
      ctx.shadowColor = '#c77dff';
      ctx.fillRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });

    ctx.shadowBlur = 0;
  }

  // Trata o encerramento da partida e exibe letreiro GAME OVER
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

  // Inicia ou reinicia o loop do jogo
  function startGame() {
    resetGame();
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 110);
    isRunning = true;
    startBtn.textContent = '⏸ REINICIAR';
  }

  startBtn.addEventListener('click', startGame);

  // Escuta as teclas direcionais do teclado (WASD ou setas)
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

  // Botões táteis na tela para quem joga pelo celular
  document.getElementById('btnUp')?.addEventListener('click', () => { if (velocity.y !== 1) velocity = { x: 0, y: -1 }; });
  document.getElementById('btnDown')?.addEventListener('click', () => { if (velocity.y !== -1) velocity = { x: 0, y: 1 }; });
  document.getElementById('btnLeft')?.addEventListener('click', () => { if (velocity.x !== 1) velocity = { x: -1, y: 0 }; });
  document.getElementById('btnRight')?.addEventListener('click', () => { if (velocity.x !== -1) velocity = { x: 1, y: 0 }; });

  draw();

  // Inicializa a troca de cartuchos entre o Snake e os jogos em Flash
  initCartridgeSwitcher();
}

/**
 * initCartridgeSwitcher
 * 
 * Finalidade:
 * Permite ao usuário clicar nos cartuchos físicos de jogos da prateleira retrô
 * e alternar a tela entre o Snake local e os jogos Flash (.swf).
 * 
 * Entradas: Nenhuma.
 * Saídas: Nenhuma.
 */
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

/**
 * loadFlashGame
 * 
 * Finalidade:
 * Instancia o emulador WebAssembly Ruffle e carrega o arquivo .swf do jogo em Flash
 * selecionado dentro da tela do fliperama.
 * 
 * Argumentos de Entrada:
 * @param {string} swfPath - Caminho relativo para o arquivo .swf do jogo (ex: 'assets/games/sue-sushi/sue_sushi.swf').
 * 
 * Saídas: Nenhuma.
 */
function loadFlashGame(swfPath) {
  const container = document.getElementById('ruffleContainer');
  if (!container) return;
  container.innerHTML = '';

  // Cria e anexa o player Ruffle ao container
  if (window.RufflePlayer) {
    const ruffle = window.RufflePlayer.newest();
    const player = ruffle.createPlayer();
    player.style.width = '100%';
    player.style.height = '480px';
    container.appendChild(player);
    player.load(swfPath);
  } else {
    // Mensagem de aviso caso o script do Ruffle ainda esteja baixando
    container.innerHTML = `
      <div style="padding: 2rem; color: var(--purple-bright);">
        <p>Carregando emulador Ruffle Flash...</p>
        <p style="font-size: 0.9rem; color: var(--text-dim); margin-top: 0.5rem;">Se demorar, verifique a conexão com a internet para baixar o emulador.</p>
      </div>
    `;
  }
}
