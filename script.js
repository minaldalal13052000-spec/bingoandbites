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
let myColor = "#FF2E63";
const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';

if (isAdmin) document.getElementById('admin-controls').style.display = 'block';

window.startGame = function() {
    myName = document.getElementById('username').value.trim();
    myColor = document.querySelector('input[name="pColor"]:checked').value;
    if(!myName) return;
    
    // Save name and color to Firebase
    set(ref(db, 'players/' + myName), { name: myName, totalScore: 0, color: myColor });
    
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
            cell.textContent = "FREE"; 
            cell.classList.add('stamped');
            cell.style.backgroundColor = myColor; // Set personalized color
        } else {
            cell.textContent = item;
            cell.onclick = () => { 
                cell.classList.toggle('stamped'); 
                cell.style.backgroundColor = cell.classList.contains('stamped') ? myColor : "white";
                if(navigator.vibrate) navigator.vibrate(40); 
            };
        }
        board.appendChild(cell);
    });
}

// Global winner sync
onValue(ref(db, 'gameState/lastWinner'), (snapshot) => {
    const winnerData = snapshot.val();
    if (winnerData) {
        document.getElementById('winner-announcement').innerText = winnerData.name + " GOT BINGO!";
        document.getElementById('winner-announcement').style.color = winnerData.color;
        document.getElementById('winner-overlay').style.display = 'flex';
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: [winnerData.color] });
        if (isAdmin) document.getElementById('admin-next-round').style.display = 'block';
    }
});

window.claimBingo = function() {
    set(ref(db, 'gameState/lastWinner'), { name: myName, color: myColor });
    update(ref(db, 'players/' + myName), { totalScore: increment(10) });
    document.getElementById('bingo-btn').disabled = true;
};

// Leaderboard with color markers
onValue(ref(db, 'players'), (s) => {
    const list = document.getElementById('score-list');
    list.innerHTML = "";
    const players = s.val();
    if(players) {
        Object.values(players).sort((a,b) => b.totalScore - a.totalScore).forEach(p => {
            list.innerHTML += `<li>
                <span style="border-left: 10px solid ${p.color}; padding-left: 8px;">${p.name}</span> 
                <span>${p.totalScore} pts</span>
            </li>`;
        });
    }
});

// ... [Keep other host/admin functions] ...
window.callNextNumber = async function() {
    const historyRef = ref(db, 'gameState/history');
    const snap = await get(historyRef);
    let history = snap.val() || [];
    let nextNum;
    do { nextNum = Math.floor(Math.random() * 75) + 1; } while (history.includes(nextNum));
    history.push(nextNum);
    set(ref(db, 'gameState/currentNumber'), nextNum);
    set(historyRef, history);
};
