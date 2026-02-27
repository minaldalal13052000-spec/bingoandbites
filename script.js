import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, increment, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBEIL7wQrJ3n2rnGr9FsMPH25KnBSihHDg",
    authDomain: "bingo-3fa41.firebaseapp.com",
    databaseURL: "https://bingo-3fa41-default-rtdb.firebaseio.com",
    projectId: "bingo-3fa41",
    storageBucket: "bingo-3fa41.firebasestorage.app",
    messagingSenderId: "1015132936323",
    appId: "1:1015132936323:web:d47520d3e1a1b62f2f23b6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let currentRound = 1;
let myName = "";

// --- HOST LOGIC: NO REPEATS ---
window.callNextNumber = async function() {
    const historyRef = ref(db, 'gameState/history');
    const snapshot = await get(historyRef);
    let history = snapshot.val() || [];

    if (history.length >= 75) {
        alert("All numbers called! Please reset the game.");
        return;
    }

    let nextNum;
    do {
        nextNum = Math.floor(Math.random() * 75) + 1;
    } while (history.includes(nextNum));

    history.push(nextNum);
    set(ref(db, 'gameState/currentNumber'), nextNum);
    set(historyRef, history);
};

// Secret Reset for Host (Run this in console if needed)
window.resetGame = function() {
    set(ref(db, 'gameState'), { currentNumber: "--", history: [] });
    set(ref(db, 'players'), {});
    alert("Game Reset!");
};

// Admin Check
if (new URLSearchParams(window.location.search).get('admin') === 'true') {
    document.getElementById('admin-controls').style.display = 'block';
}

// --- PLAYER LOGIC ---
window.startGame = function() {
    myName = document.getElementById('username').value.trim();
    if(!myName) return alert("Please enter your name!");
    set(ref(db, 'players/' + myName), { name: myName, totalScore: 0 });
    document.getElementById('setup').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    generateBoard();
};

function generateBoard() {
    const board = document.getElementById('bingo-board');
    board.innerHTML = '';
    let shuffled = Array.from({length: 75}, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 25);
    shuffled.forEach((item, index) => {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        if (index === 12) {
            cell.textContent = "FREE"; cell.classList.add('stamped');
        } else {
            cell.textContent = item;
            cell.onclick = () => { cell.classList.toggle('stamped'); };
        }
        board.appendChild(cell);
    });
}

window.claimBingo = function() {
    update(ref(db, 'players/' + myName), { totalScore: increment(10) });
    
    // Anti-Cheating: Board stays visible. We just update the Round counter.
    if (currentRound < 4) {
        alert("Bingo Recorded! Moving to Round " + (currentRound + 1) + ". Keep your current board!");
        currentRound++;
        document.getElementById('round-title').innerText = "ROUND " + currentRound;
        // Optional: Only call generateBoard() if you want a fresh board per round. 
        // If you want them to keep the same board for all 4 rounds, comment out the line below:
        generateBoard(); 
    } else {
        alert("Final Round Won! Check the Leaderboard.");
    }
};

onValue(ref(db, 'gameState/currentNumber'), (snapshot) => {
    const num = snapshot.val();
    if (num) document.getElementById('current-number').innerText = num;
});

onValue(ref(db, 'players'), (snapshot) => {
    const list = document.getElementById('score-list');
    list.innerHTML = "";
    const players = snapshot.val();
    if(players) {
        Object.values(players).sort((a,b) => b.totalScore - a.totalScore).forEach(p => {
            list.innerHTML += `<li><span>${p.name}</span> <span>${p.totalScore} pts</span></li>`;
        });
    }
});
