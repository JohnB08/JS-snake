const gameScreen = document.querySelector(".gameScreen");
const scoreContainer = document.querySelector(".scoreContainer");
const snakeHead = makeElement("div", { class: "snakeHead" });
const scoreCount = makeElement("h2", { class: "score" });
scoreCount.textContent = "score:";
const gridSize = 50;
function makeElement(type, properties) {
  const element = document.createElement(type);
  //tar alle keys og values og gjør de om til key/value arrays.
  const elementProperties = Object.entries(properties);
  elementProperties.forEach((property) => {
    //dekonstrukter hvert key/value array til to variabler:
    const [propertyName, propertyValue] = property;
    //setter hver property til elementet:
    //prøver å bruke .setAttribute for å unngå kluss med reserved words.
    element.setAttribute(propertyName, propertyValue);
  });
  return element;
}
scoreContainer.appendChild(scoreCount);
gameScreen.appendChild(snakeHead);
const gameElements = {
  tailElements: [],
  appleElements: {},
  gridCoordinates: [],
  startBtn: null,
};
let gameReset = false;
let moveUpInterval = null;
let moveDownInterval = null;
let moveLeftInterval = null;
let moveRightInterval = null;
let startingPositionX = 1;
let startingPositionY = 1;
let score = 0;
startGame();
function updateGridCoordinates() {
  let gridStyle = `grid-column: ${startingPositionX}/span 1; grid-row: ${startingPositionY}/span 1`;
  gameElements.gridCoordinates.unshift(gridStyle);
  if (
    gameElements.gridCoordinates.length >
    gameElements.tailElements.length + 2
  )
    gameElements.gridCoordinates.pop();
  snakeHead.style = gridStyle;
  updateTailCoordinates();
}
function updateTailCoordinates() {
  if (gameElements.tailElements.length === 0) return;
  else {
    let coordinatesArray = gameElements.gridCoordinates;
    let tailArray = gameElements.tailElements;
    for (i = 0; i < tailArray.length; i++) {
      tailArray[i].apple.element.style = coordinatesArray[i + 1];
      tailArray[i].apple.appleX = parseInt(
        tailArray[i].apple.element.style.gridColumnStart
      );
      tailArray[i].apple.appleY = parseInt(
        tailArray[i].apple.element.style.gridRowStart
      );
    }
    GameOver();
  }
}
function GameOver() {
  let tailArray = gameElements.tailElements;
  tailArray.forEach((tail) => {
    if (tail.apple.appleX !== startingPositionX) return;
    else if (tail.apple.appleY !== startingPositionY) return;
    else {
      clearIntervals();
      document.removeEventListener("keydown", gameControl);
      gameReset = true;
      resetGameScreen();
      startGame();
    }
  });
}
function resetGameScreen() {
  let tailArray = document.querySelectorAll(".snakeTail");
  tailArray.forEach((tail) => tail.remove());
  gameElements.tailElements = [];
  startingPositionX = 1;
  startingPositionY = 1;
  updateGridCoordinates();
}
function moveRight() {
  eatApple();

  startingPositionX++;
  if (
    startingPositionX > gridSize &&
    startingPositionY < gridSize &&
    startingPositionY >= 1
  ) {
    startingPositionY++;
    startingPositionX = 1;
  } else if (startingPositionX > gridSize && startingPositionY === gridSize) {
    startingPositionX = 1;
    startingPositionY = 1;
  }
  updateGridCoordinates();
}

function moveLeft() {
  eatApple();
  startingPositionX--;
  if (
    startingPositionX < 1 &&
    startingPositionY <= gridSize &&
    startingPositionY > 1
  ) {
    startingPositionY--;
    startingPositionX = gridSize;
  } else if (startingPositionX <= 1 && startingPositionY === 1) {
    startingPositionX = gridSize;
    startingPositionY = gridSize;
  }
  updateGridCoordinates();
}
function moveDown() {
  eatApple();
  startingPositionY++;
  if (
    startingPositionY > gridSize &&
    startingPositionX < gridSize &&
    startingPositionX >= 1
  ) {
    startingPositionX++;
    startingPositionY = 1;
  } else if (startingPositionY > gridSize && startingPositionX === gridSize) {
    startingPositionX = 1;
    startingPositionY = 1;
  }
  updateGridCoordinates();
}
function moveUp() {
  eatApple();
  startingPositionY--;
  if (
    startingPositionY < 1 &&
    startingPositionX <= gridSize &&
    startingPositionX > 1
  ) {
    startingPositionX--;
    startingPositionY = gridSize;
  } else if (startingPositionY <= 1 && startingPositionX === 1) {
    startingPositionX = gridSize;
    startingPositionY = gridSize;
  }
  updateGridCoordinates();
}

function clearIntervals() {
  clearInterval(moveUpInterval);
  clearInterval(moveDownInterval);
  clearInterval(moveLeftInterval);
  clearInterval(moveRightInterval);
}
function randomGridPosition() {
  return Math.ceil(Math.random() * gridSize);
}
function spawnApple() {
  let apple = makeElement("div", { class: "apple" });
  let appleX = randomGridPosition();
  let appleY = randomGridPosition();
  gameElements.appleElements.apple = { element: apple, x: appleX, y: appleY };
  console.log(gameElements.appleElements.apple);
  apple.style = `grid-column: ${appleX}/span 1; grid-row: ${appleY}/span 1`;
  gameScreen.appendChild(apple);
}
spawnApple();

function gameControl(event) {
  if (event.key === "ArrowRight") {
    clearIntervals();
    moveRightInterval = setInterval(moveRight, 100);
  } else if (event.key === "ArrowLeft") {
    clearIntervals();
    moveLeftInterval = setInterval(moveLeft, 100);
  } else if (event.key === "ArrowDown") {
    clearIntervals();
    moveDownInterval = setInterval(moveDown, 100);
  } else if (event.key === "ArrowUp") {
    clearIntervals();
    moveUpInterval = setInterval(moveUp, 100);
  }
}

function eatApple() {
  let appleArray = Object.keys(gameElements.appleElements);
  appleArray.forEach((apple) => {
    let currentApple = gameElements.appleElements[apple].element;
    let appleY = gameElements.appleElements[apple].y;
    let appleX = gameElements.appleElements[apple].x;
    if (startingPositionX !== appleX) return;
    else if (startingPositionY !== appleY) return;
    else if (startingPositionY === appleY && startingPositionX === appleX) {
      spawnApple();
      convertApple(currentApple, appleY, appleX);
      score++;
      scoreCount.textContent = `score: ${score}`;
    }
  });
}
function convertApple(apple, y, x) {
  apple.classList.remove("apple");
  apple.classList.add("snakeTail");
  gameElements.tailElements.push({
    apple: { element: apple, appleX: x, appleY: y },
  });
}
function startGame() {
  let startBtn = makeElement("button", {
    class: "btn",
    style: `grid-row: ${Math.floor(gridSize / 6) * 2}/ span ${
      Math.floor(gridSize / 6) * 2
    }; grid-column: ${Math.floor(gridSize / 4)}/ span ${
      Math.floor(gridSize / 16) * 9
    }`,
  });
  gameElements.startBtn = startBtn;
  startBtn.textContent = "Start Game!";
  console.log(startBtn);
  if (gameReset === true) startBtn.textContent = "Reset Game!";
  gameScreen.appendChild(startBtn);
  startBtn.addEventListener("click", () => {
    btnRemoval();
  });
}
function btnRemoval() {
  gameElements.startBtn.remove();
  gameElements.startBtn = null;
  document.addEventListener("keydown", gameControl);
}
document.addEventListener("keydown", (event) => {
  if (!gameElements.startBtn) return;
  if (event.code !== "Enter") return;
  btnRemoval();
  document.addEventListener("keydown", gameControl);
});
