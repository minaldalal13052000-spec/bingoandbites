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
const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';

if (isAdmin) document.getElementById('admin-controls').style.display = 'block';

window.callNextNumber = async function() {
    const historyRef = ref(db, 'gameState/history');
    const snap = await get(historyRef);
    let history = snap.val() || [];
    if (history.length >= 75) return alert("All numbers called!");
    let nextNum;
    do { nextNum = Math.floor(Math.random() * 75) + 1; } while (history.includes(nextNum));
    history.push(nextNum);
    set(ref(db, 'gameState/currentNumber'), nextNum);
    set(historyRef, history);
};

window.startGame = function() {
    myName = document.getElementById('username').value.trim();
    if(!myName) return;
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
        if (index === 12) { cell.textContent = "FREE"; cell.classList.add('stamped'); } 
        else {
            cell.textContent = item;
            cell.onclick = () => { cell.classList.toggle('stamped'); if(navigator.vibrate) navigator.vibrate(40); };
        }
        board.appendChild(cell);
    });
}

window.claimBingo = function() {
    set(ref(db, 'gameState/lastWinner'), myName);
    update(ref(db, 'players/' + myName), { totalScore: increment(10) });
    document.getElementById('bingo-btn').disabled = true;
};

onValue(ref(db, 'gameState/lastWinner'), (snapshot) => {
    const winner = snapshot.val();
    if (winner) {
        document.getElementById('winner-announcement').innerText = winner + " GOT BINGO!";
        document.getElementById('winner-overlay').style.display = 'flex';
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        if (isAdmin) document.getElementById('admin-next-round').style.display = 'block';
    }
});

window.startNextRound = function() {
    set(ref(db, 'gameState/lastWinner'), null);
    set(ref(db, 'gameState/history'), []);
    set(ref(db, 'gameState/currentNumber'), "--");
    set(ref(db, 'gameState/roundSignal'), Date.now()); 
};

onValue(ref(db, 'gameState/roundSignal'), () => {
    if (myName) {
        document.getElementById('winner-overlay').style.display = 'none';
        document.getElementById('bingo-btn').disabled = false;
        document.getElementById('admin-next-round').style.display = 'none';
        currentRound++;
        if(currentRound <= 4) {
            document.getElementById('round-title').innerText = "ROUND " + currentRound;
            generateBoard();
        }
    }
});

onValue(ref(db, 'gameState/currentNumber'), (s) => { if(s.val()) document.getElementById('current-number').innerText = s.val(); });

onValue(ref(db, 'players'), (s) => {
    const list = document.getElementById('score-list');
    list.innerHTML = "";
    const players = s.val();
    if(players) {
        Object.values(players).sort((a,b) => b.totalScore - a.totalScore).forEach(p => {
            list.innerHTML += `<li><span>${p.name}</span> <span>${p.totalScore} pts</span></li>`;
        });
    }
});

window.resetGame = () => { set(ref(db, 'gameState'), {currentNumber:"--", history:[], lastWinner:null}); set(ref(db,'players'), {}); location.reload(); };
