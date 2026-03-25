const firebaseConfig = {
    apiKey: "AIzaSyAZxG500x9pmjg1sy6iJXMKrUMhZ2TFFCk",
    authDomain: "major-win.firebaseapp.com",
    projectId: "major-win",
    databaseURL: "https://major-win-default-rtdb.europe-west1.firebasedatabase.app", 
    storageBucket: "major-win.firebasestorage.app",
    messagingSenderId: "253408264315",
    appId: "1:253408264315:web:1246e65a3c2ed70c4362de"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const items = [
    { name: "P250 | Sand", chance: 70, color: "#b0c3d9", rarity: "Common", price: 2 },
    { name: "AK-47 | Slate", chance: 20, color: "#4b69ff", rarity: "Restricted", price: 150 },
    { name: "M4A4 | Howl", chance: 9, color: "#eb4b4b", rarity: "Ancient", price: 800 },
    { name: "★ Karambit", chance: 1, color: "#ffca2d", rarity: "Knife!", price: 2500 }
];

let balance = 0, inventory = [], nickname = "Игрок", xp = 0, currentUser = null;
let selectedForContract = [];

// Авторизация
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('user-controls').style.display = 'block';
        db.ref('users/' + user.uid).on('value', (snapshot) => {
            const data = snapshot.val() || {};
            balance = data.balance ?? 1000;
            inventory = data.inventory || [];
            nickname = data.nickname || "Игрок";
            xp = data.xp || 0;
            updateUI();
        });
    }
});

function saveToDB() {
    if (currentUser) {
        db.ref('users/' + currentUser.uid).update({ balance, inventory, nickname, xp });
    }
}

// РУЛЕТКА
document.getElementById('open-btn').onclick = () => {
    if (balance < 50) return alert("Недостаточно средств!");
    const btn = document.getElementById('open-btn');
    btn.disabled = true;
    balance -= 50;
    xp += 10;

    const line = document.getElementById('roulette-line');
    line.style.transition = "none";
    line.style.transform = "translateX(0)";
    line.innerHTML = "";

    let temp = [];
    for(let i=0; i<60; i++) {
        let rand = Math.random()*100, cum = 0, drop = items[0];
        for(let it of items) { cum += it.chance; if(rand < cum) { drop = it; break; } }
        temp.push(drop);
        const d = document.createElement('div');
        d.className = 'case-item';
        d.style.borderBottomColor = drop.color;
        d.innerText = drop.name;
        line.appendChild(d);
    }

    const win = temp[55];
    setTimeout(() => {
        line.style.transition = "transform 6s cubic-bezier(0.1, 0, 0, 1)";
        const move = (140 * 55) - 300 + 70;
        line.style.transform = `translateX(-${move}px)`;
    }, 50);

    setTimeout(() => {
        inventory.unshift(win);
        btn.disabled = false;
        addToLiveDrop(win);
        saveToDB();
    }, 6100);
};

// LIVE DROP
function addToLiveDrop(item) {
    const line = document.getElementById('live-drop-line');
    const d = document.createElement('div');
    d.className = 'live-drop-item';
    d.style.borderBottomColor = item.color;
    d.innerText = item.name;
    line.prepend(d);
    if(line.children.length > 10) line.lastChild.remove();
}

// ИНВЕНТАРЬ И ПРОДАЖА
function renderInventory() {
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';
    inventory.forEach((item, i) => {
        const d = document.createElement('div');
        d.className = 'inv-card';
        d.style.borderBottomColor = item.color;
        d.innerHTML = `<b>${item.name}</b><br>${item.price}$
            <button class="btn-action sell" onclick="sellItem(${i})">ПРОДАТЬ</button>
            <button class="btn-action contract" onclick="addToContract(${i})">В КОНТРАКТ</button>`;
        list.appendChild(d);
    });
}

window.sellItem = (i) => {
    balance += inventory[i].price;
    inventory.splice(i, 1);
    saveToDB();
};

window.addToContract = (i) => {
    if(selectedForContract.length >= 3) return alert("Максимум 3!");
    selectedForContract.push(inventory[i]);
    inventory.splice(i, 1);
    renderContractSlots();
    renderInventory();
};

function renderContractSlots() {
    const s = document.getElementById('contract-slots');
    s.innerHTML = '';
    selectedForContract.forEach(it => {
        const d = document.createElement('div');
        d.className = 'inv-card';
        d.style.borderBottomColor = it.color;
        d.innerText = it.name;
        s.appendChild(d);
    });
}

document.getElementById('exchange-btn').onclick = () => {
    if(selectedForContract.length < 3) return alert("Нужно 3 скина!");
    const drop = items[Math.floor(Math.random() * (items.length - 1)) + 1];
    inventory.unshift(drop);
    selectedForContract = [];
    renderContractSlots();
    saveToDB();
    alert("Контракт выполнен!");
};

// НАВИГАЦИЯ
window.showSection = (name) => {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById(name + '-section').style.display = 'block';
};

// НИКИ И ПРОМО
document.getElementById('save-nickname-btn').onclick = () => {
    const val = document.getElementById('nickname-input').value.trim();
    if(!val) return alert("Ник пустой!");
    nickname = val;
    saveToDB();
};

document.getElementById('apply-promo-btn').onclick = () => {
    if(document.getElementById('promo-input').value.toUpperCase() === "START") {
        balance += 500;
        saveToDB();
        alert("+500$");
    }
};

function updateUI() {
    document.getElementById('balance-amount').innerText = Math.floor(balance);
    document.getElementById('display-nickname').innerText = nickname;
    let lvl = Math.floor(xp/100) + 1;
    document.getElementById('user-level').innerText = lvl;
    document.getElementById('xp-bar-fill').style.width = (xp % 100) + "%";
    renderInventory();
}

window.closeProfile = () => document.getElementById('profile-modal').style.display = 'none';
document.getElementById('profile-open-btn').onclick = () => document.getElementById('profile-modal').style.display = 'block';
document.getElementById('login-btn').onclick = () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
