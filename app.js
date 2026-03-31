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

// Переменные
let allSkins = [];
let userBalance = 0;
const CASE_PRICE = 100; // Цена открытия

const roulette = document.getElementById('roulette');
const openBtn = document.getElementById('open-btn');
const balanceDisplay = document.getElementById('balance');

// 1. Загружаем ВСЕ скины из API
async function loadSkins() {
    try {
        const response = await fetch('https://bumbeishvili.github.io/csgo-api/api/skins.json');
        const data = await response.json();
        // Фильтруем только те, где есть картинка и название
        allSkins = data.filter(skin => skin.image && skin.name);
        console.log("Загружено скинов:", allSkins.length);
        setupRoulette();
    } catch (e) {
        console.error("Ошибка загрузки скинов", e);
    }
}

// 2. Работа с балансом
async function initBalance() {
    const balanceRef = ref(db, 'user/balance');
    const snapshot = await get(balanceRef);
    if (snapshot.exists()) {
        userBalance = snapshot.val();
    } else {
        userBalance = 10000; // Стартовый капитал
        await set(balanceRef, userBalance);
    }
    updateBalanceUI();
}

function updateBalanceUI() {
    balanceDisplay.innerText = `Баланс: ${userBalance.toFixed(0)}$`;
}

// 3. Рулетка
function setupRoulette() {
    roulette.innerHTML = "";
    roulette.style.transition = "none";
    roulette.style.transform = "translateX(0)";
    
    for (let i = 0; i < 60; i++) {
        const skin = allSkins[Math.floor(Math.random() * allSkins.length)];
        const div = document.createElement('div');
        div.className = "item";
        div.innerHTML = `<img src="${skin.image}" style="width:70px"><p>${skin.name.split('|')[1] || skin.name}</p>`;
        div.style.borderBottom = `4px solid ${skin.rarity_color || '#fff'}`;
        roulette.appendChild(div);
    }
}

openBtn.onclick = async () => {
    if (userBalance < CASE_PRICE) return alert("Недостаточно средств!");
    
    openBtn.disabled = true;
    userBalance -= CASE_PRICE;
    updateBalanceUI();
    await set(ref(db, 'user/balance'), userBalance);

    setupRoulette();
    
    const winIndex = 50; 
    const winSkin = allSkins[Math.floor(Math.random() * allSkins.length)];
    const winCard = roulette.children[winIndex];
    winCard.innerHTML = `<img src="${winSkin.image}" style="width:70px"><p>${winSkin.name.split('|')[1] || winSkin.name}</p>`;
    winCard.style.borderBottom = `4px solid ${winSkin.rarity_color}`;

    setTimeout(() => {
        roulette.style.transition = "transform 5s cubic-bezier(0.15, 0, 0.15, 1)";
        const itemWidth = 110; 
        const offset = (winIndex * itemWidth) - (300 - 55); 
        roulette.style.transform = `translateX(-${offset}px)`;
    }, 100);

    setTimeout(() => {
        push(ref(db, 'history'), { name: winSkin.name, img: winSkin.image, color: winSkin.rarity_color });
        openBtn.disabled = false;
    }, 5500);
};

// Подгружаем историю
onValue(query(ref(db, 'history'), limitToLast(8)), (snapshot) => {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = "";
    snapshot.forEach(child => {
        const data = child.val();
        const div = document.createElement('div');
        div.className = "history-item";
        div.style.borderBottom = `2px solid ${data.color}`;
        div.innerHTML = `<img src="${data.img}" width="30">`;
        historyDiv.prepend(div);
    });
});

loadSkins();
initBalance();
