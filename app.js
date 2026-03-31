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

// Список стабильных скинов со ссылками Akamai (Steam CDN)
const allSkins = [
    { name: "AWP | Dragon Lore", image: "https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf1f_BYi59_8yJmY60mvLwOq7c2G1XvJBy2L-S8ImmigLsr0ZkYm71LdSSdgU_ZAnR-1O7wue905-5vJ_AnGwj5HfVp_iXGg/256fx256f", color: "#eb4b4b" },
    { name: "AK-47 | Redline", image: "https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV092lnYmGmOH8DLbUkmne5bp9i_vG8In9u1as_UM9YGr7LdKRIQ49N1nU_lXtlO_v08S07p_Pyic27nN24v_D30vg_vS6_w/256fx256f", color: "#d32ce6" },
    { name: "M4A4 | Howl", image: "https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpopL-zJAt21uH3cih9_92hkY6OlvL4NrXMm1Rd6dd2j6fG8In33gSyr0pvam_7d9XDIQY9YVvS_VDrw-u50MK-uJ_Bznpgu3Zz7H_cnBW0hAYMMLLY6_9s_A/256fx256f", color: "#eb4b4b" },
    { name: "★ Butterfly | Doppler", image: "https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf2PLacDBA5ciJlY20kPb5PrrukmRB-Ml0mP7V-Inng2f_qxU9OTWhIYPBdwA6aV3S-1C3yOfm1pS06Z_AnXU363V37X_cnBW0hAYMMLL0GFrWjA/256fx256f", color: "#eb4b4b" },
    { name: "AK-47 | Vulcan", image: "https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJegJB99KjkZKKm_LwDLbUkmne5bp9i_vG8In9u1as_UM9YGrwLdKRIQ5oNFzW8gS4lbzng8S-6ZzByXcx6XIk-z-DyOWS5i4z/256fx256f", color: "#4b69ff" }
];

let userBalance = 0;
const roulette = document.getElementById('roulette');
const openBtn = document.getElementById('open-btn');
const balanceDisplay = document.getElementById('balance');

function updateBalanceUI() {
    balanceDisplay.innerHTML = `Баланс: <span style="color: #4caf50;">${userBalance.toFixed(0)}$</span>`;
}

function renderSkins() {
    roulette.innerHTML = "";
    roulette.style.transition = "none";
    roulette.style.transform = "translateX(0)";
    for (let i = 0; i < 80; i++) {
        const skin = allSkins[Math.floor(Math.random() * allSkins.length)];
        const div = document.createElement('div');
        div.className = "item";
        div.style.borderBottom = `4px solid ${skin.color}`;
        div.innerHTML = `<img src="${skin.image}"><p>${skin.name.split('|')[1] || skin.name}</p>`;
        roulette.appendChild(div);
    }
}

async function init() {
    const snap = await get(ref(db, 'user/balance'));
    userBalance = snap.exists() ? snap.val() : 10000;
    updateBalanceUI();
    renderSkins();
}

openBtn.onclick = async () => {
    if (userBalance < 100) return alert("Недостаточно баланса!");
    
    openBtn.disabled = true;
    userBalance -= 100;
    updateBalanceUI();
    await set(ref(db, 'user/balance'), userBalance);

    const winIndex = 60;
    const winSkin = allSkins[Math.floor(Math.random() * allSkins.length)];
    const cards = roulette.children;
    
    cards[winIndex].innerHTML = `<img src="${winSkin.image}"><p>${winSkin.name}</p>`;
    cards[winIndex].style.borderBottom = `5px solid ${winSkin.color}`;

    const cardWidth = 170; // 150px + 20px margin
    const containerWidth = roulette.parentElement.offsetWidth;
    const targetTranslate = (winIndex * cardWidth) + (cardWidth / 2) - (containerWidth / 2);

    roulette.style.transition = "transform 5s cubic-bezier(0.1, 0, 0.1, 1)";
    roulette.style.transform = `translateX(-${targetTranslate}px)`;

    setTimeout(async () => {
        await push(ref(db, 'history'), { name: winSkin.name, img: winSkin.image, color: winSkin.color });
        openBtn.disabled = false;
        alert(`Вы выбили: ${winSkin.name}!`);
    }, 5500);
};

onValue(query(ref(db, 'history'), limitToLast(8)), (snap) => {
    const histDiv = document.getElementById('history');
    histDiv.innerHTML = "";
    snap.forEach(child => {
        const data = child.val();
        histDiv.insertAdjacentHTML('afterbegin', `
            <div class="history-item" style="border-bottom: 2px solid ${data.color}">
                <img src="${data.img}" title="${data.name}">
            </div>
        `);
    });
});

init();
