// Конфигурация (Убедись, что твои ключи верны)
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
    { name: "P250 | Sand Dune", chance: 70, color: "#b0c3d9", price: 5 },
    { name: "AK-47 | Slate", chance: 20, color: "#4b69ff", price: 150 },
    { name: "M4A1-S | Printstream", chance: 9, color: "#eb4b4b", price: 900 },
    { name: "★ Butterfly Knife", chance: 1, color: "#ffca2d", price: 3500 }
];

let userData = { balance: 0, inventory: [], nickname: "Игрок", xp: 0 };
let currentUID = null;

// Инициализация при входе
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUID = user.uid;
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('user-controls').style.display = 'flex';

        db.ref('users/' + user.uid).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                userData = data;
                if (!userData.inventory) userData.inventory = [];
            } else {
                // Новый пользователь
                userData = { balance: 1000, inventory: [], nickname: "Новичок", xp: 0 };
                saveData();
            }
            updateUI();
        });
    }
});

function saveData() {
    if (currentUID) db.ref('users/' + currentUID).set(userData);
}

// РУЛЕТКА
document.getElementById('open-btn').onclick = () => {
    if (userData.balance < 50) return alert("Недостаточно баланса!");
    
    const btn = document.getElementById('open-btn');
    btn.disabled = true;
    userData.balance -= 50;
    saveData();

    const track = document.getElementById('roulette-line');
    track.style.transition = "none";
    track.style.transform = "translateX(0)";
    track.innerHTML = "";

    let pool = [];
    for (let i = 0; i < 70; i++) {
        let rand = Math.random() * 100, cum = 0, drop = items[0];
        for (let it of items) { cum += it.chance; if (rand < cum) { drop = it; break; } }
        pool.push(drop);
        
        const card = document.createElement('div');
        card.className = 'track-card';
        card.style.borderBottomColor = drop.color;
        card.innerText = drop.name;
        track.appendChild(card);
    }

    const winningItem = pool[60];

    setTimeout(() => {
        track.style.transition = "transform 6s cubic-bezier(0.1, 0, 0, 1)";
        const cardWidth = 150; // 140px + 10px margin
        const offset = (cardWidth * 60) - (800 / 2) + (cardWidth / 2);
        track.style.transform = `translateX(-${offset}px)`;
    }, 50);

    setTimeout(() => {
        userData.inventory.unshift(winningItem);
        userData.xp += 15;
        btn.disabled = false;
        addToLiveFeed(winningItem);
        saveData();
        document.getElementById('item-name').innerText = winningItem.name;
        document.getElementById('item-name').style.color = winningItem.color;
    }, 6100);
};

// LIVE FEED
function addToLiveFeed(item) {
    const feed = document.getElementById('live-drop-line');
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.style.borderBottomColor = item.color;
    div.innerHTML = `<b>${item.name}</b><span>${item.price}$</span>`;
    feed.prepend(div);
    if (feed.children.length > 12) feed.lastChild.remove();
}

// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
function updateUI() {
    document.getElementById('balance-amount').innerText = Math.floor(userData.balance);
    document.getElementById('display-nickname').innerText = userData.nickname;
    
    // XP & Level
    let level = Math.floor(userData.xp / 100) + 1;
    document.getElementById('user-level').innerText = level;
    document.getElementById('xp-bar-fill').style.width = (userData.xp % 100) + "%";

    // Inventory
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';
    userData.inventory.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'inv-item';
        div.style.borderBottomColor = item.color;
        div.innerHTML = `
            <b>${item.name}</b><br>${item.price}$
            <button class="sell-btn" onclick="sellItem(${index})">ПРОДАТЬ</button>
        `;
        list.appendChild(div);
    });
}

// ГЛОБАЛЬНЫЕ ФУНКЦИИ (для onclick в HTML)
window.sellItem = (index) => {
    userData.balance += userData.inventory[index].price;
    userData.inventory.splice(index, 1);
    saveData();
};

window.showSection = (section) => {
    document.querySelectorAll('.tab-content').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(section + '-section').style.display = 'block';
    event.target.classList.add('active');
};

// МОДАЛКА
document.getElementById('profile-open-btn').onclick = () => document.getElementById('profile-modal').style.display = 'block';
document.getElementById('close-profile').onclick = () => document.getElementById('profile-modal').style.display = 'none';

// НИК И ПРОМО
document.getElementById('save-nickname-btn').onclick = () => {
    const nick = document.getElementById('nickname-input').value.trim();
    if (nick) { userData.nickname = nick; saveData(); alert("Ник сохранен"); }
};

document.getElementById('login-btn').onclick = () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
