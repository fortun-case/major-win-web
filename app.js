import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

const items = [
    { name: "Нож", color: "#eb4b4b" },
    { name: "Перчатки", color: "#d32ce6" },
    { name: "AK-47", color: "#8847ff" },
    { name: "Glock", color: "#4b69ff" },
    { name: "Кейс", color: "#5e98d9" }
];

const roulette = document.getElementById('roulette');
const openBtn = document.getElementById('open-btn');

// Создаем много карточек для эффекта прокрутки
function setupRoulette() {
    roulette.innerHTML = "";
    roulette.style.transition = "none";
    roulette.style.transform = "translateX(0)";
    
    for (let i = 0; i < 50; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const div = document.createElement('div');
        div.className = "item";
        div.style.borderBottom = `5px solid ${randomItem.color}`;
        div.innerText = randomItem.name;
        roulette.appendChild(div);
    }
}

openBtn.onclick = () => {
    openBtn.disabled = true;
    setupRoulette();
    
    // Результат будет на 45-й карточке
    const winningIndex = 44; 
    const winningItem = items[Math.floor(Math.random() * items.length)];
    roulette.children[winningIndex].innerText = winningItem.name;
    roulette.children[winningIndex].style.borderBottom = `5px solid ${winningItem.color}`;

    setTimeout(() => {
        roulette.style.transition = "transform 5s cubic-bezier(0.15, 0, 0.15, 1)";
        // Смещаем ленту так, чтобы 45-й элемент был по центру
        const shift = (winningIndex * 110) - (300 - 55); 
        roulette.style.transform = `translateX(-${shift}px)`;
    }, 100);

    // После анимации сохраняем в базу
    setTimeout(() => {
        push(ref(db, 'history'), { name: winningItem.name, time: Date.now() });
        openBtn.disabled = false;
    }, 5500);
};

// Отображение истории
onValue(query(ref(db, 'history'), limitToLast(5)), (snapshot) => {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = "";
    snapshot.forEach(child => {
        const div = document.createElement('div');
        div.className = "history-item";
        div.innerText = child.val().name;
        historyDiv.prepend(div);
    });
});

setupRoulette(); // Инициализация при загрузке
