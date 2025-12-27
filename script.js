/* =========================================
   BIO-ACCOUNTANT: FULL GAME LOGIC
   ========================================= */

/* --- 1. GAME STATE & DATABASES --- */

const GameState = {
  day: 1,
  time: 0, // 0: Morning, 1: Noon, 2: Evening
  maxDays: 30,
  gameOver: false,
  wallet: 500.00,
  calories: 1200,
  protein: 20,
  sodium: 0, // Hidden stat
  sanity: 100,
  organs: {
    muscles: { mass: 100 },
    fat: { mass: 20 }
  },
  exerciseToday: false
};

const FoodDB = [
  { 
    id: "f1", name: "Spicy Cup Noodles", price: 0.50, 
    cal: 300, carb: 40, prot: 2, fat: 10, sodium: 20, sanity: 5,
    desc: "Sodium Bomb. Cheap but hurts kidneys." 
  },
  { 
    id: "f2", name: "White Bread (Loaf)", price: 1.50, 
    cal: 100, carb: 20, prot: 2, fat: 1, sodium: 5, sanity: 2,
    desc: "Sugar Spike. Cheap energy." 
  },
  { 
    id: "f3", name: "Greasy Burger", price: 6.00, 
    cal: 600, carb: 40, prot: 25, fat: 30, sodium: 15, sanity: 20,
    desc: "Sluggish debuff. Tasty but heavy." 
  },
  { 
    id: "f4", name: "Fried Chicken (2pc)", price: 8.00, 
    cal: 700, carb: 10, prot: 35, fat: 40, sodium: 12, sanity: 25,
    desc: "Skin tax. High protein, bad oil." 
  },
  { 
    id: "f5", name: "Grilled Chicken Salad", price: 12.00, 
    cal: 400, carb: 10, prot: 40, fat: 5, sodium: 2, sanity: -5,
    desc: "Clean burn. Expensive. Boring." 
  },
  { 
    id: "f6", name: "Boiled Eggs (2pcs)", price: 2.00, 
    cal: 140, carb: 1, prot: 12, fat: 10, sodium: 1, sanity: -10,
    desc: "Budget Superfood. Low Morale." 
  }
];

const ExerciseDB = [
  {
    id: "e1", name: "Push-Ups", cost: 80, 
    effect: "Upper Body Str", req: "Prot > 10g",
    desc: "Builds vanity muscles."
  },
  {
    id: "e2", name: "Burpees (Hell)", cost: 250, 
    effect: "Endurance", req: "Cal > 250",
    desc: "High risk. Sanity -10."
  },
  {
    id: "e3", name: "Walk to Work", cost: 50,
    effect: "Wallet Save", req: "None",
    desc: "Saves $2.00 in bus fare."
  }
];

const RandomEvents = [
  {
    name: "Stomach Flu",
    text: "You wake up nauseous. You vomit.",
    effect: function() {
      GameState.calories -= 300;
      GameState.sanity -= 10;
    }
  },
  {
    name: "Grandma Visits",
    text: "She gives you cash but forces you to eat.",
    effect: function() {
      GameState.wallet += 50.00;
      GameState.calories += 800;
      GameState.organs.fat.mass += 0.5;
    }
  },
  {
    name: "Midnight Binge",
    text: "Willpower failure. You auto-buy a snack.",
    effect: function() {
      if (GameState.wallet >= 4.00) {
        GameState.wallet -= 4.00;
        GameState.calories += 1000;
      }
    }
  }
];

/* --- 2. INITIALIZATION & UI --- */

window.onload = function() {
  log("SYSTEM ONLINE. DAY 1.");
  updateUI();
};

function log(msg, type="normal") {
  const consoleDiv = document.getElementById('game-log');
  if(!consoleDiv) return;
  const p = document.createElement('p');
  p.innerText = "> " + msg;
  p.className = "log-entry " + (type === 'alert' ? 'alert-msg' : '');
  consoleDiv.appendChild(p);
  consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function updateUI() {
  document.getElementById('day-val').innerText = GameState.day;
  const times = ["MORNING", "NOON", "EVENING"];
  document.getElementById('time-val').innerText = times[GameState.time];
  
  document.getElementById('wallet-val').innerText = GameState.wallet.toFixed(2);
  document.getElementById('cal-val').innerText = Math.floor(GameState.calories);
  document.getElementById('prot-val').innerText = Math.floor(GameState.protein);
  document.getElementById('sanity-val').innerText = Math.floor(GameState.sanity);
  
  document.getElementById('fat-val').innerText = GameState.organs.fat.mass.toFixed(1);
  document.getElementById('muscle-status').innerText = GameState.organs.muscles.mass + "lbs";
}

/* --- 3. INTERACTION LOGIC --- */

function renderMenu(type) {
  const controls = document.getElementById('controls');
  controls.innerHTML = ""; 
  
  if (type === 'food') {
    FoodDB.forEach(item => {
      const btn = document.createElement('button');
      btn.innerHTML = `${item.name}<br><small>$${item.price.toFixed(2)} | +${item.cal}cal</small>`;
      btn.onclick = () => buyFood(item.id);
      if(GameState.wallet < item.price) btn.disabled = true;
      controls.appendChild(btn);
    });
  } else if (type === 'exercise') {
    ExerciseDB.forEach(item => {
      const btn = document.createElement('button');
      btn.innerHTML = `${item.name}<br><small>-${item.cost} cal</small>`;
      btn.onclick = () => doExercise(item.id);
      if(GameState.calories < item.cost) btn.disabled = true;
      controls.appendChild(btn);
    });
  }
  
  const backBtn = document.createElement('button');
  backBtn.innerText = "[ BACK ]";
  backBtn.onclick = resetControls;
  controls.appendChild(backBtn);
}

function resetControls() {
  const controls = document.getElementById('controls');
  controls.innerHTML = `
    <button onclick="renderMenu('food')">[F] MARKET</button>
    <button onclick="renderMenu('exercise')">[E] BURN PIT</button>
    <button onclick="nextPhase()">[N] SLEEP/WAIT</button>
  `;
}

function buyFood(id) {
  const item = FoodDB.find(f => f.id === id);
  
  GameState.wallet -= item.price;
  GameState.calories += item.cal;
  GameState.protein += item.prot;
  GameState.sodium += item.sodium;
  GameState.sanity += item.sanity;
  
  if(GameState.sanity > 100) GameState.sanity = 100;
  
  log(`ATE: ${item.name}. Wallet -$${item.price.toFixed(2)}.`);
  nextPhase();
}

function doExercise(id) {
  const item = ExerciseDB.find(e => e.id === id);
  
  GameState.calories -= item.cost;
  GameState.exerciseToday = true;
  
  if (item.req.includes("Prot") && GameState.protein < 10) {
    log("WARNING: Exercised with no protein. Muscle breakdown!", "alert");
    GameState.organs.muscles.mass -= 1;
  } else {
    log(`DID: ${item.name}. Burned ${item.cost} cal.`);
  }
  
  updateUI();
  resetControls(); 
}

/* --- 4. TIME & EVENT LOGIC --- */

function nextPhase() {
  GameState.time++;
  
  if (GameState.time > 2) {
    endDay();
  } else {
    log("TIME ADVANCED.");
    updateUI();
    resetControls();
  }
}

function endDay() {
  log("--- END OF DAY " + GameState.day + " ---");
  
  // Passive Burn
  const bmr = 800; 
  GameState.calories -= bmr;
  
  // Fat/Muscle Logic
  if (GameState.calories < 0) {
    log("DEFICIT: Burning Fat.", "alert");
    GameState.organs.fat.mass -= 0.5; 
    GameState.calories += 500; 
  } else {
    if (GameState.calories > 200) {
        log("SURPLUS: Storing Fat.");
        GameState.organs.fat.mass += 0.5;
        GameState.calories = 200; 
    }
  }

  // Reset Daily Trackers
  GameState.sodium = 0; 
  GameState.day++;
  GameState.time = 0;
  GameState.exerciseToday = false;

  // Check Game Over
  if (checkCriticalStatus()) return; 
  
  // Check Win
  if (GameState.day > GameState.maxDays) {
    runFinalAudit();
    return;
  }
  
  // Start New Day
  updateUI();
  resetControls();
  triggerRandomEvent(); 
}

function triggerRandomEvent() {
  if (Math.random() < 0.3) {
    const evt = RandomEvents[Math.floor(Math.random() * RandomEvents.length)];
    alert(`📅 DAY ${GameState.day} EVENT: ${evt.name}\n\n${evt.text}`);
    evt.effect();
    updateUI();
  }
}

/* --- 5. GAME OVER & AUDIT SCREENS --- */

function checkCriticalStatus() {
  // Bankruptcy
  if (GameState.wallet < 0) {
    triggerGameOver("INSOLVENCY", "You cannot afford to exist. You moved back in with parents.");
    return true;
  }
  // Starvation
  if (GameState.calories <= 0 && GameState.organs.fat.mass <= 0) {
    triggerGameOver("SYSTEM SHUTDOWN", "Battery at 0%. No fat reserves found.");
    return true;
  }
  // Heart Attack (Random chance if high sodium)
  if (GameState.sodium > 100 && Math.random() < 0.1) {
    triggerGameOver("CARDIAC FAILURE", "You treated your veins like a grease trap.");
    return true;
  }
  return false;
}

function triggerGameOver(title, reason) {
  GameState.gameOver = true;
  const consoleDiv = document.getElementById('game-log');
  consoleDiv.innerHTML = `
    <br><br>
    <div style="color:red; border: 2px solid red; padding: 10px; text-align:center;">
      <h2>💀 ${title} 💀</h2>
      <p>${reason}</p>
      <button onclick="location.reload()">REBOOT SYSTEM</button>
    </div>
  `;
  document.getElementById('controls').style.display = 'none';
}

function runFinalAudit() {
  const consoleDiv = document.getElementById('game-log');
  
  let rank = "C";
  if(GameState.wallet > 600 && GameState.organs.muscles.mass > 110) rank = "S (The Bio-Hacker)";
  else if(GameState.wallet < 50 && GameState.organs.muscles.mass > 120) rank = "B (The Gym Bro)";
  else if(GameState.wallet > 800 && GameState.organs.muscles.mass < 90) rank = "D (The Corporate Slave)";
  
  consoleDiv.innerHTML = `
    <div style="color:#4af626; border: 2px dashed #4af626; padding: 10px;">
      <h2>📄 FINAL AUDIT REPORT</h2>
      <p>STATUS: ALIVE</p>
      <p>CASH: $${GameState.wallet.toFixed(2)}</p>
      <p>BODY: ${GameState.organs.muscles.mass}lbs Muscle / ${GameState.organs.fat.mass.toFixed(1)}lbs Fat</p>
      <h3>RANK: ${rank}</h3>
      <button onclick="location.reload()">NEW SIMULATION</button>
    </div>
  `;
  document.getElementById('controls').style.display = 'none';
}