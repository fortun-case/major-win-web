// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyA-8Htang_pmMugvnekBa2s4akqHD7fGYU",
  authDomain: "major-win-b2255.firebaseapp.com",
  databaseURL: "https://major-win-b2255-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "major-win-b2255",
  storageBucket: "major-win-b2255.firebasestorage.app",
  messagingSenderId: "1088188197034",
  appId: "1:1088188197034:web:57e71de855ec78b32c88d3"
};

// Инициализация
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// --- STATE ---
let user = {
    uid: null,
    name: "Новый игрок",
    balance: 100.00,
    inventory: []
};

const RARITIES = {
    MIL_SPEC: { name: 'Армейское', color: '#4b69ff', chance: 79.92 },
    RESTRICTED: { name: 'Запрещенное', color: '#8847ff', chance: 15.98 },
    CLASSIFIED: { name: 'Засекреченное', color: '#d32ce6', chance: 3.2 },
    COVERT: { name: 'Тайное', color: '#eb4b4b', chance: 0.64 },
    GOLD: { name: '★ Нож/Перчатки', color: '#ffd700', chance: 0.26 },
};

const ITEMS_POOL = {
    ak47: { name: "AK-47 | Ледяной уголь", price: 12.5, rarity: "CLASSIFIED" },
    m4a4: { name: "M4A4 | Тени", price: 4.2, rarity: "RESTRICTED" },
    awp: { name: "AWP | Градиент", price: 1200.0, rarity: "COVERT" },
    usp: { name: "USP-S | Сайрекс", price: 2.1, rarity: "MIL_SPEC" },
    knife: { name: "★ Нож-бабочка | Допплер", price: 2500.0, rarity: "GOLD" },
    deagle: { name: "Desert Eagle | Пламя", price: 450.0, rarity: "COVERT" }
};

const CASES = [
    { id: 'starter', name: 'Стартовый', price: 2.5, color: 'from-blue-600', items: ['usp', 'm4a4', 'ak47'] },
    { id: 'elite', name: 'Элитный', price: 25.0, color: 'from-red-600', items: ['ak47', 'deagle', 'awp'] },
    { id: 'major', name: 'MAJOR CASE', price: 150.0, color: 'from-gold-600', items: ['deagle', 'awp', 'knife'] }
];

// --- NAVIGATION ---
function showSection(id) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`sec-${id}`).classList.remove('hidden');
    if(id === 'home') renderHome();
    if(id === 'profile') renderProfile();
    if(id === 'upgrades') renderUpgradeSection();
    if(id === 'contracts') renderContractSection();
}

// --- DATABASE SYNC ---
function syncData() {
    if(!user.uid) return;
    db.ref('users/' + user.uid).set({
        name: user.name,
        balance: user.balance,
        inventory: user.inventory || []
    });
    updateUI();
}

function updateUI() {
    document.getElementById('balance-display').innerText = `$${user.balance.toFixed(2)}`;
    document.getElementById('header-inventory-count').innerText = (user.inventory || []).length;
}

// --- LOGIC: PROFILE ---
function renderProfile() {
    document.getElementById('profile-name-input').value = user.name;
    const grid = document.getElementById('profile-inventory-grid');
    const inv = user.inventory || [];
    document.getElementById('profile-inv-count').innerText = inv.length;
    
    grid.innerHTML = inv.map((item, idx) => `
        <div class="skin-card bg-zinc-900 border border-white/5 p-4 rounded-2xl text-center group">
            <div class="h-20 flex items-center justify-center mb-2"><i class="fa-solid fa-gun text-2xl text-zinc-800"></i></div>
            <div class="text-[10px] font-bold uppercase mb-1" style="color: ${RARITIES[item.rarity].color}">${RARITIES[item.rarity].name}</div>
            <div class="text-xs font-bold mb-4 h-8 line-clamp-2">${item.name}</div>
            <button onclick="sellFromInv(${idx})" class="w-full py-2 bg-red-600/10 text-red-500 rounded-lg text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">Продать за $${item.price}</button>
        </div>
    `).join('');
}

function saveNick() {
    const val = document.getElementById('profile-name-input').value.trim();
    if(val === "") return alert("Ник не может быть пустым!");
    user.name = val;
    syncData();
}

function usePromo() {
    const p = document.getElementById('promo-input').value.toUpperCase();
    if(p === "MAJOR2024") {
        user.balance += 50;
        alert("Промокод активирован! +$50");
        document.getElementById('promo-input').value = "";
        syncData();
    } else {
        alert("Неверный промокод");
    }
}

// --- LOGIC: CASES ---
function renderHome() {
    const grid = document.getElementById('cases-grid');
    grid.innerHTML = CASES.map(c => `
        <div onclick="openCaseDetail('${c.id}')" class="group bg-zinc-900 border border-white/5 rounded-3xl p-8 cursor-pointer hover:border-red-600/50 transition-all text-center relative overflow-hidden">
            <div class="absolute top-0 right-0 p-4 font-mono font-bold text-red-500">$${c.price}</div>
            <div class="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br ${c.color} to-black mb-6 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-box-open text-5xl text-white/20"></i>
            </div>
            <h3 class="text-xl font-black italic uppercase tracking-tighter">${c.name}</h3>
        </div>
    `).join('');
}

let currentCase = null;
let isSpinning = false;

function openCaseDetail(id) {
    currentCase = CASES.find(c => c.id === id);
    document.getElementById('case-title').innerText = currentCase.name;
    document.getElementById('case-price').innerText = `$${currentCase.price}`;
    
    const lootGrid = document.getElementById('case-loot-grid');
    lootGrid.innerHTML = currentCase.items.map(itemId => {
        const item = ITEMS_POOL[itemId];
        return `
            <div class="bg-zinc-900 border-b-2 p-4 rounded-xl text-center" style="border-bottom-color: ${RARITIES[item.rarity].color}">
                <div class="text-[10px] font-bold opacity-50 uppercase">${RARITIES[item.rarity].name}</div>
                <div class="text-xs font-bold">${item.name}</div>
            </div>
        `;
    }).join('');
    
    showSection('case-detail');
}

function startSpin() {
    if(isSpinning || user.balance < currentCase.price) return;
    
    user.balance -= currentCase.price;
    isSpinning = true;
    syncData();

    const track = document.getElementById('roulette-track');
    const winningIndex = 40;
    const items = [];
    
    for(let i=0; i<50; i++) {
        const keys = Object.keys(ITEMS_POOL);
        items.push(ITEMS_POOL[keys[Math.floor(Math.random()*keys.length)]]);
    }
    
    track.innerHTML = items.map(item => `
        <div class="w-[160px] h-32 bg-zinc-900 border-b-4 mx-1 rounded-xl flex flex-col items-center justify-center p-4 shrink-0" style="border-bottom-color: ${RARITIES[item.rarity].color}">
            <i class="fa-solid fa-gun text-zinc-800 text-2xl"></i>
            <p class="text-[10px] text-center font-bold uppercase mt-2">${item.name}</p>
        </div>
    `).join('');

    track.style.transition = 'none';
    track.style.transform = 'translateX(0px)';
    
    setTimeout(() => {
        const offset = (winningIndex * 168) - (track.parentElement.offsetWidth / 2) + 84;
        track.style.transition = 'transform 7s cubic-bezier(0.1, 0.8, 0.1, 1)';
        track.style.transform = `translateX(-${offset}px)`;
    }, 50);

    setTimeout(() => {
        const won = items[winningIndex];
        showWinModal(won);
        user.inventory.push(won);
        isSpinning = false;
        syncData();
    }, 7200);
}

// --- WIN MODAL ---
let lastWon = null;
function showWinModal(item) {
    lastWon = item;
    const modal = document.getElementById('modal-win');
    document.getElementById('modal-glow').style.backgroundColor = RARITIES[item.rarity].color;
    document.getElementById('win-rarity').innerText = RARITIES[item.rarity].name;
    document.getElementById('win-rarity').style.color = RARITIES[item.rarity].color;
    document.getElementById('win-name').innerText = item.name;
    document.getElementById('win-price').innerText = `$${item.price}`;
    
    document.getElementById('btn-win-sell').onclick = () => {
        user.balance += item.price;
        user.inventory.pop();
        syncData();
        closeWinModal();
    };
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeWinModal() {
    document.getElementById('modal-win').classList.add('hidden');
}

function sellFromInv(idx) {
    user.balance += user.inventory[idx].price;
    user.inventory.splice(idx, 1);
    syncData();
    renderProfile();
}

// --- AUTH ---
auth.onAuthStateChanged(firebaseUser => {
    if (firebaseUser) {
        user.uid = firebaseUser.uid;
        db.ref('users/' + user.uid).on('value', snapshot => {
            const data = snapshot.val();
            if(data) {
                user.name = data.name || "Новый игрок";
                user.balance = data.balance ?? 100.00;
                user.inventory = data.inventory || [];
                updateUI();
            } else {
                syncData();
            }
        });
    } else {
        auth.signInAnonymously();
    }
});

// Инициализация
window.onload = () => {
    showSection('home');
};
