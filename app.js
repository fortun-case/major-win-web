// Твой конфиг Major Win
const firebaseConfig = {
  apiKey: "AIzaSyAZxG500x9pmjg1sy6iJXMKrUMhZ2TFFCk",
  authDomain: "major-win.firebaseapp.com",
  projectId: "major-win",
  storageBucket: "major-win.firebasestorage.app",
  messagingSenderId: "253408264315",
  appId: "1:253408264315:web:1246e65a3c2ed70c4362de"
};

// Инициализация
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const items = [
  { name: "P250 | Песчаные дюны", chance: 70, color: "#b0c3d9", rarity: "Ширпотреб" },
  { name: "AK-47 | Сланцы", chance: 20, color: "#4b69ff", rarity: "Засекреченное" },
  { name: "M4A4 | Вой", chance: 9, color: "#eb4b4b", rarity: "Тайное" },
  { name: "★ Керамбит | Золото", chance: 1, color: "#ffca2d", rarity: "Чрезвычайно редкое" }
];

let currentBalance = 1000;

// Логика кнопки открытия
document.getElementById('open-btn').onclick = () => {
    if (currentBalance < 50) {
        alert("Пополни баланс!");
        return;
    }

    currentBalance -= 50;
    updateUIBalance();

    // Рандом
    let rand = Math.random() * 100;
    let cumulative = 0;
    let dropped = items[0];

    for (let item of items) {
        cumulative += item.chance;
        if (rand < cumulative) {
            dropped = item;
            break;
        }
    }

    // Показываем результат
    document.getElementById('item-name').innerText = dropped.name;
    document.getElementById('item-name').style.color = dropped.color;
    document.getElementById('item-rarity-text').innerText = dropped.rarity;
    document.getElementById('item-rarity-light').style.background = dropped.color;
};

// Вход через Google
document.getElementById('login-btn').onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then((result) => {
        const user = result.user;
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('balance-display').style.display = 'block';
        // Здесь можно подтянуть баланс из базы данных
    });
};

function updateUIBalance() {
    document.getElementById('balance-amount').innerText = currentBalance;
}

updateUIBalance();
