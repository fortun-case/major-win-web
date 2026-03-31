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

// Используем максимально надежные ссылки Steam
const stableSkins = [
    { name: "AWP | Dragon Lore", image: "https://community.cloudflare.static.deno.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf1f_BYi59_8yJmY60mvLwOq7c2G1XvJBy2L-S8ImmigLsr0ZkYm71LdSSdgU_ZAnR-1O7wue905-5vJ_AnGwj5HfVp_iXGg/200fx200f", color: "#eb4b4b" },
    { name: "M4A4 | Howl", image: "https://community.cloudflare.static.deno.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpopL-zJAt21uH3cih9_92hkY6OlvL4NrXMm1Rd6dd2j6fG8In33gSyr0pvam_7d9XDIQY9YVvS_VDrw-u50MK-uJ_Bznpgu3Zz7H_cnBW0hAYMMLLY6_9s_A/200fx200f", color: "#eb4b4b" },
    { name: "AK-47 | Fire Serpent", image: "https://community.cloudflare.static.deno.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrY6m21Xh-0Rka27yIdXGclA3ZAnV-wK4x7q50MK96J_AnXU363Iq7S7YnBW0hAYMMLLasf_8_A/200fx200f", color: "#eb4b4b" },
    { name: "Karambit | Doppler", image: "https://community.cloudflare.static.deno.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf2PLacDBA5ciJlY20kPb5PrrukmRB-Ml0mP7V-Inng2f_qxU9OTWhIYPBdwA6aV3S-1C3yOfm1pS06Z_AnXU363V37X_cnBW0hAYMMLL0GFrWjA/200fx200f", color: "#eb4b4b" }
];

let allSkins = [...stableSkins];
let userBalance = 0;

const roulette = document.getElementById('roulette');
const openBtn = document.getElementById('open-btn');
const balanceDisplay = document.getElementById('balance');

// Принудительно отрисовываем ленту сразу
function renderInitialList() {
    roulette.innerHTML = "";
    roulette.style.transition = "none";
    roulette.style.transform = "translateX(0)";
    for (let i = 0; i < 60; i++) {
        const skin = allSkins[Math.floor(Math.random() * allSkins.length)];
        const div = document.createElement('div');
        div.className = "item";
        div.style.borderBottom = `4px solid ${skin.color}`;
        div.innerHTML = `<img src="${skin.image}" alt="skin"><p>${skin.name.split('|')[1] || skin.name}</p>`;
        roulette.appendChild(div);
    }
}

// Загрузка баланса
async function init() {
    const bRef = ref(db, 'user/balance');
    const snap = await get(bRef);
    userBalance = snap.exists() ? snap.val() : 10000;
    balanceDisplay.innerHTML = `Баланс: <span style="color: #4caf50;">${userBalance}$</span>`;
    renderInitialList();
}

openBtn.onclick = async () => {
    if (userBalance < 100) return alert("Мало денег!");
    
    openBtn.disabled = true;
    userBalance -= 100;
    balanceDisplay.innerHTML = `Баланс: <span style="color: #4caf50;">${userBalance}$</span>`;
    await set(ref(db, 'user/balance'), userBalance);

    const winIndex = 45;
    const winSkin = allSkins[Math.floor(Math.random() * allSkins.length)];
    const cards = roulette.children;
    cards[winIndex].innerHTML = `<img src="${winSkin.image}"><p>${winSkin.name}</p>`;
    cards[winIndex].style.borderBottom = `5px solid ${winSkin.color}`;

    roulette.style.transition = "transform 5s cubic-bezier(0.1, 0, 0.1, 1)";
    const shift = (winIndex * 140) + 70 - (roulette.parentElement.offsetWidth / 2);
    roulette.style.transform = `translateX(-${shift}px)`;

    setTimeout(async () => {
        await push(ref(db, 'history'), { name: winSkin.name, img: winSkin.image, color: winSkin.color });
        openBtn.disabled = false;
    }, 5500);
};

onValue(query(ref(db, 'history'), limitToLast(10)), (snap) => {
    const hist = document.getElementById('history');
    hist.innerHTML = "";
    snap.forEach(c => {
        const d = c.val();
        hist.insertAdjacentHTML('afterbegin', `<div class="history-item" style="border-bottom: 2px solid ${d.color}"><img src="${d.img}" width="50"></div>`);
    });
});

init();
