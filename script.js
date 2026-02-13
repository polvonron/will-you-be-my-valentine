/* --- CONFIG & STATE --- */
const CONFIG = {
    levelCap: 10,
    xpPerLevel: 100
};

let gameState = {
    coins: 0,
    clickPower: 1,
    cps: 0,
    xp: 0,
    level: 1,
    prestigeCount: 0,
    isSleeping: false,
    sleepTime: null,
    isSick: false,
    sickCureCount: 0,
    inventory: {},
    dishStartRef: null 
};

// Added Exchange Currency to the end
const ITEMS = [
    { id: 'think', name: 'Thinking Out Loud', cost: 15, cps: 1, desc: 'Thinking of you.' },
    { id: 'gym', name: 'Gym Membership', cost: 50, clickMod: 2, desc: '+2 coins/tap.' },
    { id: 'text', name: 'Auto-Texter', cost: 100, cps: 5, desc: 'Sends "I miss you".' },
    { id: 'paper', name: 'Paper Heart', cost: 500, cps: 20, desc: 'Folds hearts.' },
    { id: 'magic', name: 'Magic Fingers', cost: 500, clickMod: 5, desc: '+5 coins/tap.' },
    { id: 'bot', name: 'Love Bot', cost: 2000, cps: 50, desc: 'AI writes poems.' },
    { id: 'power', name: 'Power of Love', cost: 5000, clickMod: 50, desc: '+50 coins/tap.' },
    { id: 'cupid', name: 'Cupid\'s Intern', cost: 10000, cps: 200, desc: 'Shoots arrows.' },
    { id: 'exchange', name: 'Exchange Currency 💱', cost: 100000, instantXP: 50, desc: 'A bit cheap?' }
];

/* --- INITIALIZATION --- */
window.onload = function() {
    loadGame();
    initIntro();
    
    // Loops
    setInterval(() => {
        addCoins(gameState.cps);
        updateClock();
        checkSleepState();
        updateSchedule();
    }, 1000);

    setInterval(saveGame, 30000);

    // Initial Visuals
    determineSpriteState();
    renderShop();
    updateUI();
};

function initIntro() {
    const hour = new Date().getHours();
    let greet = "Good Morning";
    if (hour >= 12 && hour < 18) greet = "Good Afternoon";
    else if (hour >= 18) greet = "Good Evening";
    else if (hour < 5) greet = "Good Night";
    
    document.getElementById('greeting-text').innerText = greet;
}

function teleportButton() {
    const btn = document.getElementById('btn-no');
    const x = Math.random() * (window.innerWidth - 100);
    const y = Math.random() * (window.innerHeight - 100);
    btn.style.position = 'fixed';
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
}

function acceptValentine() {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    
    const audio = document.getElementById('bg-music');
    audio.play().catch(e => console.log("Audio play failed"));

    document.getElementById('intro-screen').classList.add('hidden');
    
    if (!gameState.dishStartRef) {
        document.getElementById('setup-screen').classList.remove('hidden');
    } else {
        document.getElementById('game-screen').classList.remove('hidden');
        checkDishStatus();
    }
}

/* --- DISH SETUP & LOGIC --- */
function finishSetup(isDishDayToday) {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let refDate = new Date(today);
    // If NOT dish day today, set ref to yesterday so today becomes day 1 (free)
    if (!isDishDayToday) {
        refDate.setDate(refDate.getDate() - 1);
    }
    
    gameState.dishStartRef = refDate.getTime();
    saveGame();
    
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    checkDishStatus();
}

function checkDishStatus() {
    if (!gameState.dishStartRef) {
        document.getElementById('dish-text').innerText = "Setup needed...";
        return;
    }
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const ref = new Date(gameState.dishStartRef);
    
    const diffTime = Math.abs(today - ref);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    
    const isTurn = diffDays % 2 === 0;
    
    document.getElementById('dish-text').innerText = isTurn 
        ? "🧼 It's your turn to wash dishes!" 
        : "🎉 You are free today!";
}

/* --- CORE GAMEPLAY --- */
function handleSpriteClick(e) {
    if (gameState.isSleeping) return; 
    
    if (gameState.isSick) {
        gameState.sickCureCount++;
        showFloatingText(e.clientX, e.clientY, "💊");
        if (gameState.sickCureCount >= 10) {
            gameState.isSick = false;
            gameState.sickCureCount = 0;
            saveGame();
            determineSpriteState();
            confetti({ particleCount: 50 });
        }
        return;
    }

    addCoins(gameState.clickPower);
    showFloatingText(e.clientX, e.clientY, `+${gameState.clickPower}`);
    
    const sprite = document.getElementById('main-sprite');
    sprite.style.transform = "scale(0.9)";
    setTimeout(() => sprite.style.transform = "scale(1)", 100);
}

function addCoins(amount) {
    gameState.coins += amount;
    updateUI();
}

function giveLove(type) {
    if (gameState.isSleeping) return;
    if (navigator.vibrate) navigator.vibrate(50);

    const rect = document.querySelector('.love-buttons').getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    showFloatingText(x, y - 100, type === 'heart' ? '❤️' : '💋');

    addXP(1);
    
    if (document.getElementById('main-sprite').classList.contains('sprite-sad')) {
        setSprite('happy');
        setTimeout(determineSpriteState, 3000); 
    } else {
        setSprite('happy');
        setTimeout(determineSpriteState, 1000);
    }
}

function showFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

/* --- LEVELING --- */
function addXP(amount) {
    if (gameState.level >= CONFIG.levelCap) return;
    
    gameState.xp += amount;
    if (gameState.xp >= CONFIG.xpPerLevel) {
        gameState.level++;
        gameState.xp = 0;
        confetti({ particleCount: 100, spread: 360 });
        showFloatingText(window.innerWidth/2, window.innerHeight/2, "LEVEL UP!");
        
        if (gameState.level === CONFIG.levelCap) {
            document.getElementById('btn-prestige').disabled = false;
        }
    }
    updateUI();
}

function doPrestige() {
    if (confirm("Reset progress for a Medal? You keep medals.")) {
        gameState.prestigeCount++;
        gameState.level = 1;
        gameState.xp = 0;
        gameState.coins = 0;
        gameState.clickPower = 1;
        gameState.cps = 0;
        gameState.inventory = {};
        gameState.isSick = false;
        gameState.isSleeping = false;
        
        saveGame();
        renderShop();
        updateUI();
        alert("Prestige Successful! Coupon Earned 🎟️");
    }
}

/* --- SHOP --- */
function getCost(item) {
    const owned = gameState.inventory[item.id] || 0;
    return Math.floor(item.cost * Math.pow(1.15, owned));
}

function buyItem(itemId) {
    const item = ITEMS.find(i => i.id === itemId);
    const cost = getCost(item);
    
    if (gameState.coins >= cost) {
        gameState.coins -= cost;
        gameState.inventory[itemId] = (gameState.inventory[itemId] || 0) + 1;
        
        // Handle Persistent Upgrades
        if (item.cps) gameState.cps += item.cps;
        if (item.clickMod) gameState.clickPower += item.clickMod;

        // Handle Instant Consumables (Exchange Currency)
        if (item.instantXP) {
            addXP(item.instantXP);
            showFloatingText(window.innerWidth/2, window.innerHeight/2, `+${item.instantXP} XP`);
        }

        renderShop();
        updateUI();
        saveGame();
    }
}

function renderShop() {
    const container = document.getElementById('shop-list');
    container.innerHTML = '';
    
    ITEMS.forEach(item => {
        const currentCost = getCost(item);
        const owned = gameState.inventory[item.id] || 0;
        
        let desc = "";
        if (item.cps) desc = `+${item.cps} CPS`;
        if (item.clickMod) desc = `+${item.clickMod} Tap`;
        if (item.instantXP) desc = `+${item.instantXP} XP (Instant)`;

        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <div class="shop-info">
                <h4>${item.name} (${owned})</h4>
                <p>${item.desc} | ${desc}</p>
            </div>
            <button class="buy-btn" onclick="buyItem('${item.id}')" 
                ${gameState.coins < currentCost ? 'disabled' : ''}>
                ${currentCost.toLocaleString()} 💰
            </button>
        `;
        container.appendChild(div);
    });
}

/* --- SPRITE / SLEEP --- */
function determineSpriteState() {
    const sprite = document.getElementById('main-sprite');
    const hour = new Date().getHours();
    
    if (gameState.isSick) {
        setSprite('sick');
        document.getElementById('sick-overlay').classList.remove('hidden');
        document.getElementById('cure-counter').innerText = `${gameState.sickCureCount}/10`;
        return; 
    } else {
        document.getElementById('sick-overlay').classList.add('hidden');
    }

    if (gameState.isSleeping) {
        setSprite('normal'); 
        document.body.classList.add('sleeping-mode');
        return;
    } else {
        document.body.classList.remove('sleeping-mode');
    }

    if (hour >= 21 || hour < 5) {
        setSprite('tired');
        document.getElementById('btn-tuck-in').classList.remove('hidden');
        return;
    } else {
        document.getElementById('btn-tuck-in').classList.add('hidden');
    }

    if (!sprite.className) setSprite('normal');
}

function setSprite(state) {
    const sprite = document.getElementById('main-sprite');
    sprite.className = ''; 
    sprite.classList.add(`sprite-${state}`);
}

function rollSpriteChance() {
    const r = Math.random();
    if (r < 0.05) { gameState.isSick = true; } 
    else if (r < 0.40) { setSprite('bored'); } 
    else if (r < 0.50) { setSprite('sad'); } 
    else { setSprite('normal'); } 
}

function tuckIn() {
    gameState.isSleeping = true;
    gameState.sleepTime = Date.now();
    gameState.coins += 10;
    saveGame();
    document.body.classList.add('sleeping-mode');
    setSprite('normal');
}

function checkSleepState() {
    if (!gameState.isSleeping) return;
    
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 21) {
        gameState.isSleeping = false;
        saveGame();
        determineSpriteState();
        alert("Good Morning! ☀️");
    }
}

/* --- SCHEDULE --- */
const SCHEDULE = {
    1: [ {n: "Prof Sales", s: 800, e: 930, c: "#ffadad"}, {n: "Strat Manage", s: 930, e: 1100, c: "#a0c4ff"}, {n: "Oblicon", s: 1530, e: 1700, c: "#caffbf"} ],
    2: [ {n: "Popcorn", s: 800, e: 930, c: "#ffd6a5"}, {n: "Utak ng Entrep", s: 930, e: 1100, c: "#fdffb6"}, {n: "Art App", s: 1100, e: 1230, c: "#bdb2ff"} ],
    3: [ {n: "Prof Sales", s: 800, e: 930, c: "#ffadad"}, {n: "Strat Manage", s: 930, e: 1100, c: "#a0c4ff"}, {n: "Pathfit", s: 1300, e: 1500, c: "#9bf6ff"}, {n: "Oblicon", s: 1530, e: 1700, c: "#caffbf"} ],
    4: [ {n: "Popcorn", s: 800, e: 900, c: "#ffd6a5"}, {n: "Utak ng Entrep", s: 930, e: 1100, c: "#fdffb6"}, {n: "Art App", s: 1100, e: 1230, c: "#bdb2ff"} ],
    6: [ {n: "NSTP", s: 800, e: 1100, c: "#ffc6ff"} ]
};

function updateSchedule() {
    const now = new Date();
    const day = now.getDay(); 
    const currentTime = (now.getHours() * 100) + now.getMinutes();
    const list = document.getElementById('class-list');
    list.innerHTML = '';
    const classes = SCHEDULE[day] || [];
    
    if (classes.length === 0) {
        list.innerHTML = '<div style="padding:10px; color:#999;">No classes today!</div>';
        return;
    }

    classes.forEach(c => {
        const div = document.createElement('div');
        div.className = 'class-item';
        if (currentTime >= c.s && currentTime < c.e) {
            div.classList.add('active');
            div.style.backgroundColor = c.c;
            div.innerHTML = `<span>${c.n}</span> <span>NOW</span>`;
        } else {
            div.innerHTML = `<span>${c.n}</span> <span>${formatTime(c.s)}</span>`;
        }
        list.appendChild(div);
    });
}

function formatTime(num) {
    let str = num.toString();
    if (str.length === 3) str = "0" + str;
    return `${str.slice(0,2)}:${str.slice(2)}`;
}

function updateClock() {
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    document.getElementById('clock-display').innerText = `${h}:${m} ${ampm}`;
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    document.getElementById('calendar-display').innerText = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

/* --- UTILS --- */
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    const btnMap = {'tab-status':0, 'tab-shop':1, 'tab-settings':2};
    document.querySelectorAll('.tab-btn')[btnMap[tabId]].classList.add('active');
}

function updateUI() {
    document.getElementById('coin-val').innerText = Math.floor(gameState.coins).toLocaleString();
    document.getElementById('cps-val').innerText = `${gameState.cps}/sec`;
    document.getElementById('level-val').innerText = gameState.level;
    document.getElementById('xp-bar').style.width = `${(gameState.xp / CONFIG.xpPerLevel) * 100}%`;
    
    let medalStr = "";
    for(let i=0; i<gameState.prestigeCount; i++) medalStr += "🏅";
    document.getElementById('medal-container').innerText = medalStr;
    
    renderShop();
}

function adjustVolume(val) {
    document.getElementById('bg-music').volume = val;
}

function saveGame() {
    localStorage.setItem('hanah_valentine_save', JSON.stringify(gameState));
}

function loadGame() {
    const save = JSON.parse(localStorage.getItem('hanah_valentine_save'));
    if (save) {
        gameState = { ...gameState, ...save };
    } else {
        rollSpriteChance();
    }
}