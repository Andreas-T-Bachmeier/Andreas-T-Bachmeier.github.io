document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startButton');
  let astronaut = document.createElement('div');
  const scoreDisplay = document.getElementById('score');
  const gameArea = document.getElementById('gameArea');
  let gameInterval, moveObstaclesInterval;
  let score = 0;
  let gameTime = 0; // in seconds
  let nextObstacleTime = 0; // in milliseconds
  let lastBackgroundChangeScore = 0; // Keeps track of the score at the last background change
  
  
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
if (isMobileDevice()) {
  // Update the instruction text for touch controls
  document.getElementById('instructionText').textContent = 'Tap on the left or right side of the screen to move.';
} else {
  // For non-mobile devices, set or retain keyboard control instructions
  document.getElementById('instructionText').textContent = 'Avoid obstacles by using the left and right arrow keys.';
}

  astronaut.id = 'astronaut';
  gameArea.appendChild(astronaut); // Add astronaut to the game area

  function resetGame() {
    // Clear intervals and game area
    clearInterval(gameInterval);
    clearInterval(moveObstaclesInterval);
    gameArea.innerHTML = '';

    // Create astronaut image
    astronaut = document.createElement('img');
    astronaut.src = 'Icons/astronaut.png'; // Update this path to your astronaut image
    astronaut.id = 'astronaut';
    gameArea.appendChild(astronaut);

    // Reset score and other game variables
    score = 0;
    gameTime = 0;
    scoreDisplay.textContent = '0';
}

function moveAstronaut(dx) {
  let currentPosition = parseInt(window.getComputedStyle(astronaut).left, 10);
  const gameAreaWidth = gameArea.offsetWidth;
  const astronautWidth = astronaut.offsetWidth;

  // Calculate the new position with the movement delta applied
  let newPosition = currentPosition + dx;

  // Ensure the new position does not go beyond the left or right boundaries of the game area
  newPosition = Math.max(0, Math.min(newPosition, gameAreaWidth - astronautWidth));

  // Apply the calculated position
  astronaut.style.left = `${newPosition}px`;
}

function handleTouchStart(e) {
  e.preventDefault(); // Prevents scrolling or zooming

  const touchLocation = e.touches[0].clientX;
  if (touchLocation < window.innerWidth / 2) {
      moveAstronaut(-20); // Move left
  } else {
      moveAstronaut(20); // Move right
  }
}

function addTouchControls() {
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
}

function removeTouchControls() {
  document.removeEventListener('touchstart', handleTouchStart, { passive: false });
}



  document.addEventListener('keydown', (e) => {
    if (e.key === "ArrowLeft") moveAstronaut(-30);
    else if (e.key === "ArrowRight") moveAstronaut(30);
  });

  function generateObstacle() {
    const gameTimeInSeconds = gameTime; // Assuming 'gameTime' tracks elapsed game time in seconds
    let obstacleTypes = ['planet', 'asteroid'];

    // Include supernovas and blackholes based on gameTime
    if (gameTimeInSeconds >= 60) obstacleTypes.push('supernova');
    if (gameTimeInSeconds >= 120) obstacleTypes.push('blackhole');

    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const obstacle = document.createElement('img');
    obstacle.className = `obstacle ${type}`;
    obstacle.style.left = `${Math.random() * (gameArea.offsetWidth - 30)}px`;
    obstacle.style.top = '0px';

    // Set sources and base sizes
    switch (type) {
        case 'planet':
            obstacle.src = 'Icons/planet.png';
            obstacle.style.width = isMobileDevice() ? '30px' : '60px'; // 50% size for mobile
            break;
        case 'asteroid':
            obstacle.src = 'Icons/asteroid.png';
            obstacle.style.width = isMobileDevice() ? '20px' : '25px'; // 50% size for mobile
            break;
        case 'supernova':
            obstacle.src = 'Icons/supernova.png';
            obstacle.style.width = isMobileDevice() ? '40px' : '80px'; // 50% size for mobile
            break;
        case 'blackhole':
            obstacle.src = 'Icons/blackhole.png';
            obstacle.style.width = isMobileDevice() ? '10px' : '20px'; // 50% size for mobile
            break;
    }
    obstacle.style.height = 'auto'; // Maintain aspect ratio

    gameArea.appendChild(obstacle);
}


function moveObstacles() {
  const currentTime = Date.now(); // Current time for oscillation and growth calculations

  document.querySelectorAll('.obstacle').forEach(obstacle => {
      let currentTop = parseInt(obstacle.style.top, 10) + 2;
      obstacle.style.top = `${currentTop}px`;

      if (currentTop > gameArea.offsetHeight) obstacle.remove();
      
      if (checkCollision(obstacle)) gameOver();

      // Growth for black holes
      if (obstacle.classList.contains('blackhole')) {
          let growthAccumulator = obstacle.dataset.growthAccumulator ? parseFloat(obstacle.dataset.growthAccumulator) : 0;
          let growthFactor = 1.0055;
          let currentWidth = parseFloat(obstacle.offsetWidth);

          // Calculate the desired new width without applying it yet
          let desiredWidth = currentWidth * growthFactor;
          
          // Accumulate the difference until it's large enough to apply
          growthAccumulator += (desiredWidth - currentWidth);

          // Check if the accumulated growth is large enough to apply
          if (growthAccumulator >= 1) { // Using 1px as an example threshold
              obstacle.style.width = `${currentWidth + growthAccumulator}px`;
              obstacle.style.height = `${currentWidth + growthAccumulator}px`; // Adjust as needed for aspect ratio
              obstacle.dataset.growthAccumulator = '0'; // Reset accumulator after applying growth
          } else {
              // Save the accumulated growth back to the dataset for the next update
              obstacle.dataset.growthAccumulator = growthAccumulator.toString();
          }
      }

      // Oscillation for supernovas
      if (obstacle.classList.contains('supernova')) {
          if (!obstacle.dataset.startTime) obstacle.dataset.startTime = currentTime.toString();
          const elapsedTime = currentTime - parseInt(obstacle.dataset.startTime, 10);
          const amplitude = 50; // Oscillation amplitude in pixels
          const period = 2000; // Oscillation period in milliseconds
          let originalLeft = obstacle.dataset.originalLeft ? parseInt(obstacle.dataset.originalLeft, 10) : parseInt(obstacle.style.left, 10);
          if (!obstacle.dataset.originalLeft) obstacle.dataset.originalLeft = originalLeft.toString();
          obstacle.style.left = `${originalLeft + amplitude * Math.sin(elapsedTime * 2 * Math.PI / period)}px`;
      }
  });
}



  function checkCollision(obstacle) {
    const astronautRect = astronaut.getBoundingClientRect();
    const obstacleRect = obstacle.getBoundingClientRect();
    return !(astronautRect.right < obstacleRect.left ||
             astronautRect.left > obstacleRect.right ||
             astronautRect.bottom < obstacleRect.top ||
             astronautRect.top > obstacleRect.bottom);
  }

  function gameOver() {
    removeTouchControls(); // Disable touch controls
    clearInterval(gameInterval);
    clearInterval(moveObstaclesInterval);

    const finalScore = document.getElementById('finalScore');
    finalScore.textContent = `Game Over`;

    const gameOverScreen = document.getElementById('gameOverScreen');
    gameOverScreen.classList.remove('hidden');
    gameOverScreen.classList.add('visible');

    const restartButton = document.getElementById('restartButton');
    restartButton.onclick = () => {
        gameOverScreen.classList.add('hidden');
        gameOverScreen.classList.remove('visible');
        resetGame();
        startGame(); // Depending on your game flow, you might want to call startGame() directly or not.
    };
}

function changeBackgroundColor() {
  const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
  document.body.style.backgroundColor = randomColor;
  document.documentElement.style.backgroundColor = randomColor; // Also set on <html>
}


function startGame() {
  resetGame();

  if (isMobileDevice()) {
    addTouchControls(); // Enable touch controls for the astronaut
}
  const gameOverScreen = document.getElementById('gameOverScreen');
  gameOverScreen.classList.remove('visible');
  gameOverScreen.classList.add('hidden');

  
  gameTime = 0;
  score = 0;
  lastBackgroundChangeScore = 0; // Reset this variable at the start of each game
  scoreDisplay.textContent = '0 km';

      // Hide the instruction text
      document.getElementById('instructionText').style.display = 'none';

  // Reset nextObstacleTime to immediately generate the first obstacle
  nextObstacleTime = Date.now();


  gameInterval = setInterval(() => {
      gameTime++;
      score += 10; // Increment score every second
      scoreDisplay.textContent = `${score.toFixed(1)} km`;

      // Calculate current threshold based on the score
      const currentThreshold = Math.floor(score / 200) * 200;

      // Change the background only when crossing to a new threshold
      if (currentThreshold > lastBackgroundChangeScore) {
          changeBackgroundColor();
          // Update lastBackgroundChangeScore to the next threshold
          lastBackgroundChangeScore = currentThreshold;
      }

      // Randomly decide how many obstacles to generate this tick (from 0 to 3)
      const numberOfObstacles = Math.floor(Math.random() * 5);

      for (let i = 0; i < numberOfObstacles; i++) {
          generateObstacle(); // Call your existing function
      }

  }, 1000);

  moveObstaclesInterval = setInterval(moveObstacles, 20);
}


startButton.addEventListener('click', startGame);


});






