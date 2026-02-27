import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  // PASTE YOUR CONFIG DATA FROM FIREBASE CONSOLE HERE
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentRound = 1;
let playerScores = { 1: 0, 2: 0, 3: 0, 4: 0 };

function nextRound() {
    if (currentRound < 4) {
        // Save current round score (e.g., number of stamped cells)
        const stampedCells = document.querySelectorAll('.cell.stamped').length;
        playerScores[currentRound] = stampedCells;

        currentRound++;
        document.getElementById('round-display').innerText = `Round: ${currentRound} / 4`;
        generateBoard(); // Fresh board for the new round
    } else {
        showFinalLeaderboard();
    }
}

function showFinalLeaderboard() {
    document.getElementById('bingo-board').style.display = 'none';
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.style.display = 'block';
    
    // Logic to pull and display scores from Firebase would go here
    console.log("Final Scores:", playerScores);
}