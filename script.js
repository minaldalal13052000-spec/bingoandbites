import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Your verified Firebase Config
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

window.startGame = function() {
    myName = document.getElementById('username').value.trim();
    if(!myName) return alert("Please enter your name!");
    
    set(ref(db, 'players/' + myName), {
        name: myName,
        totalScore: 0
    });

    document.getElementById('setup').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    generateBoard();
};

function generateBoard() {
    const board = document.getElementById('bingo-board');
    board.innerHTML = '';
    const items = Array.from({length: 75}, (_, i) => i + 1);
    let shuffled = items.sort(() => Math.random() - 0.5).slice(0, 25);

    shuffled.forEach((item, index) => {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        if (index === 12) {
            cell.textContent = "FREE";
            cell.classList.add('stamped');
        } else {
            cell.textContent = item;
            cell.onclick = () => {
                cell.classList.toggle('stamped');
                // Haptic feedback for mobile
                if (navigator.vibrate) navigator.vibrate(50);
            };
        }
        board.appendChild(cell);
    });
}

window.claimBingo = function() {
    // Adds 10 points to the existing total every time they win a round
    update(ref(db, 'players/' + myName), {
        totalScore: increment(10)
    });

    if (currentRound < 4) {
        currentRound++;
        document.getElementById('round-title').innerText = "ROUND " + currentRound;
        alert("Awesome! Prepare for Round " + currentRound);
        generateBoard();
    } else {
        document.getElementById('game-area').innerHTML = "<h2 style='color:white'>Final Round Complete!</h2>";
    }
};

// Listen for Host Calling Numbers
onValue(ref(db, 'gameState/currentNumber'), (snapshot) => {
    const num = snapshot.val();
    if (num) document.getElementById('current-number').innerText = num;
});

// Real-time Leaderboard Update
onValue(ref(db, 'players'), (snapshot) => {
    const list = document.getElementById('score-list');
    list.innerHTML = "";
    const players = snapshot.val();
    if(players) {
        const sorted = Object.values(players).sort((a,b) => b.totalScore - a.totalScore);
        sorted.forEach(p => {
            list.innerHTML += `<li><span>${p.name}</span> <span>${p.totalScore} pts</span></li>`;
        });
    }
});