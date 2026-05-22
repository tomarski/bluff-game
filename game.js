// --- OYUN DEĞİŞKENLERİ ---
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const suits = [
    { name: 'Kupa', symbol: '♥', color: 'red' },
    { name: 'Karo', symbol: '♦', color: 'red' },
    { name: 'Maça', symbol: '♠', color: 'black' },
    { name: 'Sinek', symbol: '♣', color: 'black' }
];

let deck = [];
let playerHand = [];
let cpuHand = [];
let pot = []; 
let lastClaimedRank = null; 
let lastActualCards = [];   
let lastClaimedCount = 0;   
let selectedCards = [];     
let isPlayerTurn = true;    
let isFirstTurn = true; 
let isMuted = false;
let gameDifficulty = 'medium'; 
let isAnimationRunning = false; 
let playerNickname = "Oyuncu"; // Dinamik takma ad değişkeni

let trackedCardCounts = {}; 

const cpuQuotes = {
    gameStart: ["Masa hazır, kurallar katı. Hadi tarzını görelim!", "Poker suratıma güveniyorum, bol şans."],
    cpuPlaysHonest: ["İçim dışım bir, ne diyorsam o.", "Gözlerimin içine bak, tamamen dürüst kartlar."],
    cpuPlaysBluff: ["Hadi bakalım, yüreğin yetiyorsa 'Blöf' de buna.", "Bence hiç bulaşma, elim çok fena..."],
    playerCaughtCpuBluff: ["Ah be! Nasıl anladın? Yüz ifadem mi ele verdi?", "İyi yakaladın, tebrikler."],
    playerWrongCall: ["Dedim sana dürüst oynuyorum diye! Çek bakalım masayı!", "Ava giderken avlandın."],
    cpuCaughtPlayerBluff: ["Gözlerinden anladım, o kartlar kesinlikle BLÖF!", "Yakalandın dostum, al bakalım desteyi."],
    cpuWrongCall: ["Nasıl yani? Kartların doğru muymuş? İnanamıyorum...", "Büyük risk aldım ve patladım, helal olsun."],
    cpuWinning: ["Elimde neredeyse kart kalmadı, bitiriyorum oyunu!", "Yapay zekanın zaferini izliyorsun."],
    cpuLosing: ["Lütfen biraz insaf et, elim kart mezarlığına döndü.", "Bu nasıl bir şans? Hep ben çekiyorum."]
};

// DOM Elemanları
const mainMenu = document.getElementById('main-menu');
const gameBoard = document.getElementById('game-board');
const startGameButton = document.getElementById('start-game-button');
const aboutButton = document.getElementById('about-button');
const playerNicknameInput = document.getElementById('player-nickname'); // Yeni eklenen input seçici

// Yenilenen Ayarlar Menüsü ve Buton Seçicileri Güncellendi
const settingsToggleBtn = document.getElementById('settings-toggle-btn');
const settingsDropdown = document.getElementById('settings-dropdown');
const restartButton = document.getElementById('restart-button');
const backMenuButton = document.getElementById('back-menu-button');

const difficultySelect = document.getElementById('difficulty-select');
const cpuDifficultyBadge = document.getElementById('cpu-difficulty-badge');
const cpuChatBubble = document.getElementById('cpu-chat-bubble');
const muteToggleMenu = document.getElementById('mute-toggle-menu');
const muteToggleGame = document.getElementById('mute-toggle-game');

const playerCardsDiv = document.getElementById('player-cards');
const cpuCardCountSpan = document.getElementById('cpu-card-count');
const potCountSpan = document.getElementById('pot-count');
const lastRankSpan = document.getElementById('last-rank');
const bsButton = document.getElementById('bs-button');
const playTurnButton = document.getElementById('play-turn-button');
const claimSelect = document.getElementById('claim-select');

const revealedCardsContainer = document.getElementById('revealed-cards-container');
const toastNotification = document.getElementById('toast-notification');
const tableCenter = document.getElementById('table-center');

const customModal = document.getElementById('custom-modal');
const modalMessage = document.getElementById('modal-message');
const modalCloseButton = document.getElementById('modal-close-button');
const modalGameoverButtons = document.getElementById('modal-gameover-buttons');
const modalRestartBtn = document.getElementById('modal-restart-btn');
const modalMenuBtn = document.getElementById('modal-menu-btn');

// Sesler
const soundShuffle = document.getElementById('sound-shuffle');
const soundPlay = document.getElementById('sound-play');
const soundWin = document.getElementById('sound-win');
const soundOver = document.getElementById('sound-over');
const soundBullshit = document.getElementById('sound-bullshit');
const soundOhshit = document.getElementById('sound-ohshit');
const soundLaugh = document.getElementById('sound-laugh');
const soundBluff = document.getElementById('sound-bluff');
const soundFunnyLaugh = document.getElementById('sound-funnylaugh');

let chatTimeoutId = null; 

// --- DIŞLI AYARLAR MENÜSÜ AKIŞI ---
settingsToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    settingsDropdown.classList.toggle('hidden');
});

// Menü dışındaki boş bir yere tıklandığında menünün kapanması
document.addEventListener('click', (e) => {
    if (settingsDropdown && !settingsDropdown.classList.contains('hidden')) {
        settingsDropdown.classList.add('hidden');
    }
});

// --- AKICI BANNER BİLDİRİM SİSTEMİ (TOAST COUT) ---
function showToast(message, duration = 3000) {
    toastNotification.innerHTML = message;
    toastNotification.classList.remove('hidden');
    setTimeout(() => toastNotification.classList.add('visible'), 50);

    setTimeout(() => {
        toastNotification.classList.remove('visible');
        setTimeout(() => toastNotification.classList.add('hidden'), 400);
    }, duration);
}

function playAudio(audioElement) {
    if (isMuted) return;
    if (audioElement) {
        audioElement.currentTime = 0; 
        audioElement.play().catch(e => console.log("Ses engellendi:", e));
    }
}

function cpuSpeak(category) {
    const list = cpuQuotes[category];
    if (list && list.length > 0) {
        if (chatTimeoutId) clearTimeout(chatTimeoutId); 
        const randomIndex = Math.floor(Math.random() * list.length);
        cpuChatBubble.innerHTML = list[randomIndex];
        cpuChatBubble.classList.remove('hidden');
        chatTimeoutId = setTimeout(() => cpuChatBubble.classList.add('hidden'), 8000);
    }
}

function toggleMute() {
    isMuted = !isMuted;
    const txt = isMuted ? "🔇 Ses: Kapalı" : "🔊 Ses: Açık";
    muteToggleMenu.innerText = txt;
    muteToggleGame.innerText = isMuted ? "🔇" : "🔊";
}

muteToggleGame.addEventListener('click', (e) => {
    e.stopPropagation(); 
    toggleMute();
});
muteToggleMenu.addEventListener('click', toggleMute);

function showGameOverModal(message) {
    modalMessage.innerHTML = message;
    customModal.classList.add('active');
    modalCloseButton.classList.add('hidden');
    modalGameoverButtons.classList.remove('hidden');
}

modalCloseButton.addEventListener('click', () => customModal.classList.remove('active'));
modalRestartBtn.addEventListener('click', () => { customModal.classList.remove('active'); initGame(); });
modalMenuBtn.addEventListener('click', () => { customModal.classList.remove('active'); gameBoard.classList.add('hidden'); mainMenu.classList.remove('hidden'); });

startGameButton.addEventListener('click', () => {
    gameDifficulty = difficultySelect.value;
    // Input alanından girilen ismi çekiyoruz, boşsa varsayılan "Oyuncu" kalıyor
    playerNickname = playerNicknameInput.value.trim() || "Oyuncu"; 
    mainMenu.classList.add('hidden');
    gameBoard.classList.remove('hidden');
    initGame();
});

aboutButton.addEventListener('click', () => {
    modalMessage.innerHTML = `<strong>BLÖF KURALLARI</strong><br><br>• 52 kart dağıtılır. <strong>Sinek 2'li (2♣)</strong> olan oyuna başlar.<br>• Herkes son iddia edilen kartın altını, üstünü veya aynısını iddia ederek kart atmalıdır.<br>• Blöf kontrolü sonucu eğer yalan beyanda bulunulduysa yerdeki tüm kartlar, yalan iddiada bulunan tarafından alınır.<br>• Elindeki tüm kartları ilk bitiren oyunu kazanır.`;
    customModal.classList.add('active');
    modalCloseButton.classList.remove('hidden');
    modalGameoverButtons.classList.add('hidden');
});

restartButton.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsDropdown.classList.add('hidden');
    initGame();
});

backMenuButton.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsDropdown.classList.add('hidden');
    gameBoard.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

// --- OYUNU BAŞLAT ---
function initGame() {
    playAudio(soundShuffle);
    isAnimationRunning = false;
    revealedCardsContainer.classList.add('hidden');
    revealedCardsContainer.className = ''; 
    revealedCardsContainer.innerHTML = '';
    tableCenter.classList.remove('shaking');
    
    ranks.forEach(r => trackedCardCounts[r] = 0);
    const diffTexts = { easy: "Kolay 🟢", medium: "Orta 🟡", hard: "Zor 🔴" };
    cpuDifficultyBadge.innerText = diffTexts[gameDifficulty];

    deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ rank: rank, suit: suit.name, symbol: suit.symbol, color: suit.color });
        }
    }
    deck.sort(() => Math.random() - 0.5);

    playerHand = deck.splice(0, 13).sort((a, b) => ranks.indexOf(a.rank) - ranks.indexOf(b.rank));
    cpuHand = deck.splice(0, 13);
    cpuHand.forEach(c => trackedCardCounts[c.rank]++);

    pot = [];
    lastClaimedRank = null;
    lastActualCards = [];
    lastClaimedCount = 0;
    selectedCards = [];
    isFirstTurn = true; 

    let playerHasClubTwo = playerHand.some(c => c.rank === '2' && c.suit === 'Sinek');

    if (!playerHasClubTwo) {
        isPlayerTurn = false;
        showToast("🤖 Sinek 2'li bilgisayarda! Oyun başlıyor...", 2500);
        cpuSpeak('gameStart');
        setTimeout(cpuFirstTurn, 2000); 
    } else {
        isPlayerTurn = true;
        showToast("🃏 Sinek 2'li sende! Oyunu senin başlatman gerekiyor.", 3000);
        cpuSpeak('gameStart');
    }
    updateUI();
}

function getValidOptions(currentRank) {
    if (isFirstTurn) return ['2'];
    if (!currentRank) return [...ranks];
    let idx = ranks.indexOf(currentRank);
    let options = [currentRank];
    let lower = idx === 0 ? ranks[ranks.length - 1] : ranks[idx - 1];
    let upper = idx === ranks.length - 1 ? ranks[0] : ranks[idx + 1];
    if(!options.includes(lower)) options.push(lower);
    if(!options.includes(upper)) options.push(upper);
    return options;
}

function updateUI() {
    if (isAnimationRunning) return; 

    let previousSelectedClaim = claimSelect.value;
    playerCardsDiv.innerHTML = '';
    
    playerHand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card', card.color); 
        cardElement.innerText = `${card.rank}${card.symbol}`; 
        if (selectedCards.includes(index)) cardElement.classList.add('selected');
        cardElement.addEventListener('click', () => toggleSelectCard(index));
        playerCardsDiv.appendChild(cardElement);
    });

    cpuCardCountSpan.innerText = cpuHand.length;
    potCountSpan.innerText = pot.length;
    
    if (lastClaimedRank) {
        lastRankSpan.innerText = `${lastClaimedCount} Tane [ ${lastClaimedRank} ]`;
    } else {
        lastRankSpan.innerText = isFirstTurn ? "Yok (Sinek 2 ile Başla)" : "Yok (İstediğin Kartla Başla)";
    }

    let validOptions = getValidOptions(lastClaimedRank);
    claimSelect.innerHTML = '';
    validOptions.forEach(opt => {
        let el = document.createElement('option');
        el.value = opt; el.innerText = opt;
        claimSelect.appendChild(el);
    });

    if (validOptions.includes(previousSelectedClaim)) claimSelect.value = previousSelectedClaim;

    playTurnButton.disabled = !isPlayerTurn || selectedCards.length === 0;
    bsButton.disabled = !isPlayerTurn || pot.length === 0 || isFirstTurn; 
    
    bsButton.classList.remove('loading-bs');
    bsButton.innerText = "BLÖF (BS)!";
}

function toggleSelectCard(index) {
    if (!isPlayerTurn || isAnimationRunning) return;
    const pos = selectedCards.indexOf(index);
    if (pos > -1) selectedCards.splice(pos, 1);
    else selectedCards.push(index);
    updateUI();
}

// --- OYUNCU HAMLESİ ---
playTurnButton.addEventListener('click', () => {
    if (selectedCards.length === 0 || isAnimationRunning) return;

    if (isFirstTurn) {
        let cardsObjects = selectedCards.map(idx => playerHand[idx]);
        let hasClubTwo = cardsObjects.some(c => c.rank === '2' && c.suit === 'Sinek');
        if (!hasClubTwo) {
            showToast("⚠️ HATA: İlk hamlede mutlaka Sinek 2'liyi atmalısın!", 2500);
            return;
        }
    }

    playAudio(soundPlay);
    let playedCount = selectedCards.length;
    let actualCardsPlayed = [];

    selectedCards.sort((a, b) => b - a).forEach(index => {
        let card = playerHand.splice(index, 1)[0];
        actualCardsPlayed.push(card);
        pot.push(card);
    });

    let claimedCard = claimSelect.value;
    lastActualCards = actualCardsPlayed;
    lastClaimedCount = playedCount;
    lastClaimedRank = claimedCard;

    selectedCards = [];
    isFirstTurn = false; 
    isPlayerTurn = false;
    updateUI();

    showToast(`Ortaya ${playedCount} kart fırlattın ve "${playedCount} tane ${claimedCard}" dedin!`, 2500);

    setTimeout(() => {
        let cpuWantsToCallBS = false;
        let knownCountOfThisRank = trackedCardCounts[claimedCard]; 
        let totalSuspected = knownCountOfThisRank + playedCount;

        if (gameDifficulty === 'hard') {
            if (totalSuspected > 4) cpuWantsToCallBS = true; 
            else {
                let bluffProbability = 0.05 + (playedCount * 0.20);
                if (totalSuspected >= 3) bluffProbability += 0.35; 
                if (Math.random() < bluffProbability) cpuWantsToCallBS = true;
            }
        } else if (gameDifficulty === 'medium') {
            if (totalSuspected > 4 && Math.random() > 0.25) cpuWantsToCallBS = true;
            else {
                let bluffProbability = 0.10 + (playedCount * 0.15);
                if (Math.random() < bluffProbability) cpuWantsToCallBS = true;
            }
        } else {
            if (Math.random() < 0.22) cpuWantsToCallBS = true;
        }

        if (pot.length <= 2 && playedCount === 1) cpuWantsToCallBS = false;

        if (cpuWantsToCallBS) {
            bsButton.disabled = true;
            playTurnButton.disabled = true;
            tableCenter.classList.add('shaking');
            playAudio(soundBullshit);
            
            setTimeout(() => {
                tableCenter.classList.remove('shaking');
                checkBS("CPU");
            }, 2000);
        } else {
            trackedCardCounts[claimedCard] += playedCount;
            if (checkGameOver()) return;
            cpuTurn();
        }
    }, 2000);
});

// --- BİLGİSAYAR HAMLELERİ ---
function cpuFirstTurn() {
    let idx = cpuHand.findIndex(c => c.rank === '2' && c.suit === 'Sinek');
    if (idx === -1) idx = 0;

    playAudio(soundPlay);
    let actualCardsPlayed = [cpuHand.splice(idx, 1)[0]];
    pot.push(...actualCardsPlayed);
    
    lastActualCards = actualCardsPlayed;
    lastClaimedCount = 1;
    lastClaimedRank = '2';
    isFirstTurn = false; 

    trackedCardCounts['2']++;
    cpuSpeak('cpuPlaysHonest');

    showToast(`Bilgisayar Sinek 2'lisini masaya bıraktı ve "1 tane 2" dedi!`, 2500);

    setTimeout(() => {
        if (checkGameOver()) return;
        isPlayerTurn = true; 
        updateUI(); 
    }, 1500);
}

// --- BİLGİSAYAR SIRASI ---
function cpuTurn() {
    if (cpuHand.length <= 4 && Math.random() < 0.4) cpuSpeak('cpuWinning');
    else if (cpuHand.length >= 16 && Math.random() < 0.4) cpuSpeak('cpuLosing');

    let validOptions = getValidOptions(lastClaimedRank);
    let chosenClaim = validOptions[Math.floor(Math.random() * validOptions.length)];
    
    let cardsToPlayCount = Math.floor(Math.random() * 2) + 1; 
    if (cardsToPlayCount > cpuHand.length) cardsToPlayCount = cpuHand.length;

    playAudio(soundPlay);
    let actualCardsPlayed = [];
    let realMatchingCards = cpuHand.filter(c => c.rank === chosenClaim);

    if (realMatchingCards.length >= cardsToPlayCount && Math.random() > 0.3) {
        for(let i = 0; i < cardsToPlayCount; i++) {
            let idx = cpuHand.findIndex(c => c.rank === chosenClaim);
            actualCardsPlayed.push(cpuHand.splice(idx, 1)[0]);
        }
        setTimeout(() => cpuSpeak('cpuPlaysHonest'), 300);
    } else {
        for(let i = 0; i < cardsToPlayCount; i++) {
            let randomIdx = Math.floor(Math.random() * cpuHand.length);
            actualCardsPlayed.push(cpuHand.splice(randomIdx, 1)[0]);
        }
        setTimeout(() => cpuSpeak('cpuPlaysBluff'), 300);
    }

    pot.push(...actualCardsPlayed);
    lastActualCards = actualCardsPlayed;
    lastClaimedCount = cardsToPlayCount;
    lastClaimedRank = chosenClaim;
    trackedCardCounts[chosenClaim] += cardsToPlayCount;

    showToast(`Bilgisayar ortaya ${cardsToPlayCount} kart attı ve "${cardsToPlayCount} tane ${chosenClaim}" dedi!`, 3000);

    setTimeout(() => {
        if (checkGameOver()) return;
        isPlayerTurn = true; 
        updateUI(); 
    }, 1500);
}

// --- OYUNCU BLÖF BUTONUNA BASTIĞINDA ---
bsButton.addEventListener('click', () => {
    if (isAnimationRunning) return;
    isAnimationRunning = true;

    bsButton.disabled = true;
    playTurnButton.disabled = true;
    bsButton.classList.add('loading-bs');
    bsButton.innerText = "⏳ Kontrol Ediliyor...";
    tableCenter.classList.add('shaking');

    playAudio(soundBullshit);
    
    setTimeout(() => {
        tableCenter.classList.remove('shaking'); 
        checkBS("PLAYER"); 
    }, 2000);
});

// --- KART AÇMA VE UÇMA ALGORİTMASI ---
function checkBS(caller) {
    isAnimationRunning = true;
    let wasBluffing = lastActualCards.some(c => c.rank !== lastClaimedRank);
    let toastMsg = "";
    let loserOfHand = ""; 

    revealedCardsContainer.innerHTML = '';
    revealedCardsContainer.className = ''; 
    revealedCardsContainer.classList.remove('hidden');

    lastActualCards.forEach(card => {
        const miniCard = document.createElement('div');
        miniCard.classList.add('mini-card', card.color);
        miniCard.innerText = `${card.rank}${card.symbol}`; 
        revealedCardsContainer.appendChild(miniCard);
    });

    setTimeout(() => {
        const cards = revealedCardsContainer.querySelectorAll('.mini-card');
        cards.forEach(c => c.classList.add('reveal'));
    }, 100);

    if (caller === "PLAYER") {
        if (wasBluffing) {
            playAudio(soundLaugh);
            toastMsg = `🎯 YAKALADIN! Bilgisayar blöf yapıyordu!`;
            cpuHand.push(...pot);
            loserOfHand = "CPU";
            setTimeout(() => cpuSpeak('playerCaughtCpuBluff'), 400);
        } else {
            playAudio(soundOhshit);
            toastMsg = `❌ HATA! Bilgisayar dürüsttü!`;
            playerHand.push(...pot);
            loserOfHand = "PLAYER";
            setTimeout(() => cpuSpeak('playerWrongCall'), 400);
        }
    } else if (caller === "CPU") {
        if (wasBluffing) {
            playAudio(soundBluff);
            toastMsg = `🤖 Bilgisayar BLÖFÜNÜ yakaladı!`;
            playerHand.push(...pot);
            loserOfHand = "PLAYER";
            setTimeout(() => cpuSpeak('cpuCaughtPlayerBluff'), 400);
        } else {
            playAudio(soundFunnyLaugh);
            toastMsg = `🔥 Bilgisayar haksız yere blöf dedi!`;
            cpuHand.push(...pot);
            loserOfHand = "CPU";
            setTimeout(() => cpuSpeak('cpuWrongCall'), 400);
        }
    }

    showToast(toastMsg, 3000);

    setTimeout(() => {
        if (loserOfHand === "PLAYER") {
            revealedCardsContainer.classList.add('fly-to-player');
        } else {
            revealedCardsContainer.classList.add('fly-to-cpu');
        }

        setTimeout(() => {
            pot = [];
            lastClaimedRank = null;
            lastActualCards = [];
            lastClaimedCount = 0;
            
            ranks.forEach(r => trackedCardCounts[r] = 0);
            cpuHand.forEach(c => trackedCardCounts[c.rank]++);
            playerHand.sort((a, b) => ranks.indexOf(a.rank) - ranks.indexOf(b.rank));
            
            revealedCardsContainer.classList.add('hidden');
            revealedCardsContainer.innerHTML = '';
            revealedCardsContainer.className = ''; 
            isAnimationRunning = false;

            if (checkGameOver()) return;

            if (caller === "PLAYER") {
                isPlayerTurn = true;
                updateUI();
            } else {
                isPlayerTurn = false;
                updateUI();
                setTimeout(cpuTurn, 1000);
            }
        }, 500); 

    }, 2500); 
}

// --- OYUN BİTTİ KONTROLÜ ---
function checkGameOver() {
    if (playerHand.length === 0) {
        playAudio(soundWin);
        if (chatTimeoutId) clearTimeout(chatTimeoutId);
        cpuChatBubble.classList.add('hidden');
        // Dinamik takma ad mesaj alanına eklendi
        showGameOverModal(`👑 TEBRİKLER ${playerNickname}! <br><br>Elindeki tüm kartları bitirdin ve bu akıl oyununu kazandın! 🎉`);
        return true;
    } else if (cpuHand.length === 0) {
        playAudio(soundOver);
        if (chatTimeoutId) clearTimeout(chatTimeoutId);
        cpuChatBubble.classList.add('hidden');
        showGameOverModal("🤖 KAYBETTİN! <br><br>Bilgisayar elindeki tüm kartları bitirmeyi başardı.");
        return true;
    }
    return false;
}