import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, query, limitToLast, set, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA-8Htang_pmMugvnekBa2s4akqHD7fGYU",
    authDomain: "major-win-b2255.firebaseapp.com",
    projectId: "major-win-b2255",
    storageBucket: "major-win-b2255.firebasestorage.app",
    messagingSenderId: "1088188197034",
    appId: "1:1088188197034:web:57e71de855ec78b32c88d3",
    databaseURL: "https://major-win-b2255-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Резервный список, если API не ответит
let allSkins = [
    {name: "Dragon Lore", image: "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_awp_cu_awp_asimov_light_large.png", color: "#eb4b4b"},
    {name: "Howl", image: "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/econ/default_generated/weapon_m4a1_cu_m4a1_howling_light_large.png", color: "#eb4b4b"}
];

let userBalance = 0;
const CASE_PRICE = 100;

const roulette = document.getElementById('roulette');
const openBtn = document.getElementById('open-btn');
const balanceDisplay = document.getElementById('balance');

// 1. Загрузка данных через RAW ссылку GitHub (обход CORS)
async function loadSkins() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/ru/skins.json');
        const data = await response.json();
        if (data.length > 0) {
            allSkins = data.map(s => ({
                name: s.name,
                image: s.image,
                color: s.rarity.color || "#fff"
            }));
            console.log("Скины из API загружены!");
        }
        renderInitialList();
    } catch (e) {
        console.log("Используем резервный список скинов");
        renderInitialList();
    }
}

// 2. Баланс
async function initBalance() {
    const balanceRef = ref(db, 'user/balance');
    const snapshot = await get(balanceRef);
    if (snapshot.exists()) {
        userBalance = snapshot.val();
    } else {
        userBalance = 10000;
        await set(balanceRef, userBalance);
    }
    updateBalanceUI();
}

function updateBalanceUI() {
    balanceDisplay.innerHTML = `Баланс: <span style="color: #4caf50;">${userBalance.toFixed(0)}$</span>`;
}

// 3. Создание карточки
function createCard(skin) {
    const div = document.createElement('div');
    div.className = "item";
    div.style.borderBottom = `4px solid ${skin.color}`;
    div.innerHTML = `<img src="${skin.image}"><p>${skin.name.split(' | ')[1] || skin.name}</p>`;
    return div;
}

// 4. Лента
function renderInitialList() {
    roulette.innerHTML = "";
    roulette.style.transition = "none";
    roulette.style.transform = "translateX(0)";
    for (let i = 0; i < 60; i++) {
        const randomSkin = allSkins[Math.floor(Math.random() * allSkins.length)];
        roulette.appendChild(createCard(randomSkin));
    }
}

// 5. Кнопка
openBtn.onclick = async () => {
    if (userBalance < CASE_PRICE) return alert("Недостаточно денег!");

    openBtn.disabled = true;
    userBalance -= CASE_PRICE;
    updateBalanceUI();
    await set(ref(db, 'user/balance'), userBalance);

    renderInitialList();
    
    const winIndex = 45; 
    const winSkin = allSkins[Math.floor(Math.random() * allSkins.length)];
    const winCard = roulette.children[winIndex];
    winCard.style.borderBottom = `5px solid ${winSkin.color}`;
    winCard.innerHTML = `<img src="${winSkin.image}"><p>${winSkin.name}</p>`;

    setTimeout(() => {
        roulette.style.transition = "transform 5s cubic-bezier(0.1, 0, 0.1, 1)";
        const itemWidth = 140; 
        const containerWidth = roulette.parentElement.offsetWidth;
        const targetPos = (winIndex * itemWidth) + (itemWidth / 2) - (containerWidth / 2);
        roulette.style.transform = `translateX(-${targetPos}px)`;
    }, 100);

    setTimeout(async () => {
        await push(ref(db, 'history'), { name: winSkin.name, img: winSkin.image, color: winSkin.color });
        openBtn.disabled = false;
    }, 5500);
};

// 6. История
onValue(query(ref(db, 'history'), limitToLast(12)), (snapshot) => {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = "";
    snapshot.forEach(child => {
        const data = child.val();
        const div = document.createElement('div');
        div.className = "history-item";
        div.style.borderBottom = `3px solid ${data.color}`;
        div.innerHTML = `<img src="${data.img}" title="${data.name}">`;
        historyDiv.prepend(div);
    });
});

loadSkins();
initBalance();
