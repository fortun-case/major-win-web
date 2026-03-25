// НАСТРОЙКИ FIREBASE (Вставь свои данные, если они изменились)
const firebaseConfig = {
    apiKey: "AIzaSyAZxG500x9pmjg1sy6iJXMKrUMhZ2TFFCk",
    authDomain: "major-win.firebaseapp.com",
    projectId: "major-win",
    databaseURL: "https://major-win-default-rtdb.europe-west1.firebasedatabase.app",
    storageBucket: "major-win.firebasestorage.app"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.database();

// БАЗА СКИНОВ
const itemsDB = [
    { name: "P250 | Sand Dune", chance: 60, color: "#b0c3d9", price: 5 },
    { name: "Glock-18 | Fade", chance: 25, color: "#eb4b4b", price: 150 },
    { name: "AK-47 | Redline", chance: 12, color: "#d32ce6", price: 800 },
    { name: "★ Karambit | Lore", chance: 3, color: "#ffca2d", price: 5000 }
];

let userData = { balance: 0, inventory: [], nickname: "Игрок" };
let currentUser = null;

// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК (ГАРАНТИРОВАНО РАБОТАЕТ)
window.switchTab = (tabId) => {
    // Убираем активные классы везде
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-tab'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    // Включаем нужные
    document.getElementById(tabId + '-section').classList.add('active-tab');
    event.target.classList.add('active');

    // Сбрасываем выделения при переходе
    contractSelection = [];
    upgradeSelection = null;
    renderInventories();
};

// АВТОРИЗАЦИЯ
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById('auth-btn').style.display = 'none';
        document.getElementById('user-panel').style.display = 'flex';
        
        db.ref('users/' + user.uid).on('value', (snap) => {
            if (snap.exists()) {
                userData = snap.val();
                if (!userData.inventory) userData.inventory = [];
            } else {
                userData = { balance: 1000, inventory: [], nickname: "Новичок" };
                db.ref('users/' + user.uid).set(userData);
            }
            updateUI();
        });
    }
});

document.getElementById('auth-btn').onclick = () => {
    auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
};

function saveDB() {
    if (currentUser) db.ref('users/' + currentUser.uid).set(userData);
}

// ---------------- КЕЙСЫ И РУЛЕТКА ----------------
window.openCaseModal = () => {
    document.getElementById('case-modal').style.display = 'flex';
    document.getElementById('roulette-line').innerHTML = '';
    document.getElementById('roulette-line').style.transform = 'translateX(0)';
};

document.getElementById('btn-spin').onclick = () => {
    if (userData.balance < 50) return alert("Недостаточно средств (Нужно 50 ₽)");
    
    const btn = document.getElementById('btn-spin');
    btn.disabled = true;
    userData.balance -= 50;
    saveDB();

    const line = document.getElementById('roulette-line');
    line.style.transition = 'none';
    line.style.transform = 'translateX(0)';
    line.innerHTML = '';

    let items = [];
    for(let i=0; i<60; i++) {
        let r = Math.random() * 100, sum = 0, drop = itemsDB[0];
        for(let it of itemsDB) { sum += it.chance; if(r <= sum) { drop = it; break; } }
        items.push(drop);
        
        const div = document.createElement('div');
        div.className = 'roulette-item';
        div.style.borderBottomColor = drop.color;
        div.innerHTML = `<b>${drop.name}</b><br><span style="color:#8b8e9d">${drop.price} ₽</span>`;
        line.appendChild(div);
    }

    const winItem = items[50]; // Победный предмет

    setTimeout(() => {
        line.style.transition = 'transform 5s cubic-bezier(0.1, 0, 0, 1)';
        // Ширина элемента 150px (140 + margin 5*2)
        const offset = (150 * 50) - (line.parentElement.offsetWidth / 2) + 75;
        line.style.transform = `translateX(-${offset}px)`;
    }, 50);

    setTimeout(() => {
        userData.inventory.unshift(winItem);
        saveDB();
        addLiveDrop(winItem);
        btn.disabled = false;
        alert(`Вы выбили: ${winItem.name}`);
    }, 5100);
};

// ---------------- ЛЕНТА (СЛЕВА) ----------------
function addLiveDrop(item) {
    const feed = document.getElementById('live-feed');
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.innerHTML = `
        <div style="font-size:30px">🔫</div>
        <div class="name">${item.name}</div>
        <div class="price">${item.price} ₽</div>
    `;
    feed.prepend(div);
    if(feed.children.length > 8) feed.lastChild.remove();
}

// ---------------- АПГРЕЙДЫ ----------------
let upgradeSelection = null;

window.selectForUpgrade = (index) => {
    upgradeSelection = index;
    renderInventories();
};

document.getElementById('btn-do-upgrade').onclick = () => {
    if (upgradeSelection === null) return;
    const chance = 50; // Шанс 50%
    const item = userData.inventory[upgradeSelection];
    
    // Ищем предмет в 2 раза дороже
    const targets = itemsDB.filter(i => i.price >= item.price * 2);
    const target = targets.length > 0 ? targets[0] : itemsDB[itemsDB.length-1];

    userData.inventory.splice(upgradeSelection, 1); // Удаляем старый предмет

    if (Math.random() * 100 <= chance) {
        userData.inventory.unshift(target); // Выдаем новый
        addLiveDrop(target);
        alert(`АПГРЕЙД УСПЕШЕН! Получено: ${target.name}`);
    } else {
        alert("АПГРЕЙД СГОРЕЛ!");
    }
    
    upgradeSelection = null;
    saveDB();
};

// ---------------- КОНТРАКТЫ ----------------
let contractSelection = [];

window.toggleContractItem = (index) => {
    const pos = contractSelection.indexOf(index);
    if (pos > -1) {
        contractSelection.splice(pos, 1); // Убрать, если уже выбран
    } else {
        if (contractSelection.length < 3) contractSelection.push(index); // Добавить
    }
    renderInventories();
};

document.getElementById('btn-do-contract').onclick = () => {
    if (contractSelection.length < 3) return;
    
    // Удаляем с конца, чтобы не сбить индексы
    contractSelection.sort((a,b) => b-a).forEach(idx => userData.inventory.splice(idx, 1));
    
    const reward = itemsDB[Math.floor(Math.random() * (itemsDB.length - 1)) + 1]; // Любой кроме ширпотреба
    userData.inventory.unshift(reward);
    
    contractSelection = [];
    addLiveDrop(reward);
    saveDB();
    alert(`Контракт выполнен! Вы получили ${reward.name}`);
};

// ---------------- ПРОДАЖА И РЕНДЕР ----------------
window.sellItem = (index) => {
    userData.balance += userData.inventory[index].price;
    userData.inventory.splice(index, 1);
    saveDB();
};

function updateUI() {
    document.getElementById('balance-amount').innerText = userData.balance;
    document.getElementById('profile-nick').innerText = userData.nickname;
    renderInventories();
}

function renderInventories() {
    const inv = userData.inventory || [];
    
    // 1. Профиль (Главный инвентарь)
    document.getElementById('main-inv').innerHTML = inv.map((it, i) => `
        <div class="inv-item" style="border-bottom-color: ${it.color}">
            <b>${it.name}</b><br><span style="color:var(--text-muted)">${it.price} ₽</span>
            <button class="sell-btn" onclick="sellItem(${i})">ПРОДАТЬ</button>
        </div>
    `).join('');

    // 2. Инвентарь Апгрейдов
    document.getElementById('upgrade-inv').innerHTML = inv.map((it, i) => `
        <div class="inv-item ${upgradeSelection === i ? 'selected' : ''}" style="border-bottom-color: ${it.color}" onclick="selectForUpgrade(${i})">
            <b>${it.name}</b><br><span style="color:var(--text-muted)">${it.price} ₽</span>
        </div>
    `).join('');

    // Отрисовка выбранного слота апгрейда
    const upgFrom = document.getElementById('upg-from');
    const upgTo = document.getElementById('upg-to');
    if (upgradeSelection !== null) {
        const item = inv[upgradeSelection];
        upgFrom.innerHTML = `<b>${item.name}</b><br>${item.price} ₽`;
        upgFrom.style.borderColor = item.color;
        
        const targets = itemsDB.filter(i => i.price >= item.price * 2);
        const target = targets.length > 0 ? targets[0] : itemsDB[itemsDB.length-1];
        
        upgTo.innerHTML = `<b>${target.name}</b><br>${target.price} ₽`;
        upgTo.style.borderColor = target.color;
    } else {
        upgFrom.innerHTML = 'ВЫБЕРИТЕ СКИН'; upgFrom.style.borderColor = '';
        upgTo.innerHTML = 'ЦЕЛЬ'; upgTo.style.borderColor = '';
    }

    // 3. Инвентарь Контрактов
    document.getElementById('contract-inv').innerHTML = inv.map((it, i) => `
        <div class="inv-item ${contractSelection.includes(i) ? 'selected' : ''}" style="border-bottom-color: ${it.color}" onclick="toggleContractItem(${i})">
            <b>${it.name}</b><br><span style="color:var(--text-muted)">${it.price} ₽</span>
        </div>
    `).join('');

    // Отрисовка слотов контракта
    const cSlots = document.getElementById('contract-slots');
    cSlots.innerHTML = '';
    for(let i=0; i<3; i++) {
        if (contractSelection[i] !== undefined) {
            const item = inv[contractSelection[i]];
            cSlots.innerHTML += `<div class="c-slot" style="border-color:${item.color}; color:#fff"><b>${item.name}</b></div>`;
        } else {
            cSlots.innerHTML += `<div class="c-slot">ПУСТО</div>`;
        }
    }
    document.getElementById('btn-do-contract').disabled = contractSelection.length !== 3;
}
