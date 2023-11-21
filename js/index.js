//henter inn det som trengs fra HTML
const gameScreen = document.querySelector(".gameScreen");
const scoreContainer = document.querySelector(".scoreContainer");

//lager nye elementer.
const snakeHead = makeElement("div", { className: "snakeHead" });
const snakeEye = makeElement("div", { className: "secondEye" });
const scoreCount = makeElement("h2", { className: "score" });
const highScoreCount = makeElement("h2", { className: "highScore" });
snakeHead.appendChild(snakeEye);
scoreContainer.appendChild(scoreCount);
scoreContainer.appendChild(highScoreCount);
gameScreen.appendChild(snakeHead);
const gameElements = {
  tailElements: [],
  appleElements: {},
  gridCoordinates: [],
  startBtn: null,
  gameScreen: gameScreen,
  mobileScreenStyleArray: [],
};
const inputObject = {
  w: "UP!",
  a: "LEFT!",
  s: "DOWN!",
  d: "RIGHT!",
};

let gridSize = 0;
let mobileGridSize = 0;

//gimmicken her var å prøve å lese stylesheetet direkte å finne størrelsen der.
//finner css rules for gameScreen
//bruker array from i tilfelle jeg plutselig ødelegger CSS stylesheet
let gameScreenStyleArray = Array.from(document.styleSheets[0].cssRules);
//bruker parseInt + regex /\D/g for å fjerne alle bokstaver fra css rule etter repeat for å finne gridsize
/* Det var ganske tricky å gjøre denne agnostic for hvor css classen stod i CSS sheet.
Men nå kan nye ting bli adda i CSS uten å være redd for rekkefølgen. className må ikke endres på, da må det endres her. */
gameScreenStyleArray.forEach((style) => {
  if (style.selectorText === ".gameScreen")
    gridSize = parseInt(
      style.style.gridTemplateColumns
        .replace(/\D/g, "")
        .split("")
        .splice(0, 2, "")
        .join("")
    );
});
//bruker samme for å finne gridsize på tlf.
gameScreenStyleArray.forEach((style) => {
  if (style.conditionText === "only screen and (max-width: 600px)") {
    let mediaRules = Object.keys(style.cssRules);
    let ruleObject = style.cssRules;
    mediaRules.forEach((rule) => {
      if (ruleObject[rule].selectorText === ".gameScreen") {
        mobileGridSize = parseInt(
          ruleObject[rule].style.gridTemplateColumns
            .replace(/\D/g, "")
            .split("")
            .splice(0, 2, "")
            .join("")
        );
      }
    });
  }
});
let gameReset = false;
let currentMovement = 0;
let currentInterval = null;
let currentPositionX = 1;
let currentPositionY = 1;
let activeClass = "rotateRight";
let score = 0;
let gameActive = false;
let mobileMode = false;
scoreCount.textContent = `score: ${score}`;
let highScore = JSON.parse(localStorage.getItem("highScoreSnake")) || 0;
highScoreCount.textContent = `high score: ${highScore}`;
let moved = true;

//skjekker om vi er på mobilskjerm
mobileSetup();

//viser knapp
showBtn();

//spawner et eple i starten av spillet.
spawnApple();

//funksjon som lager HTML elementer.
function makeElement(type, properties) {
  const element = document.createElement(type);
  //tar alle keys og values og gjør de om til key/value arrays.
  const elementProperties = Object.entries(properties);
  elementProperties.forEach((property) => {
    //dekonstrukter hvert key/value array til to variabler:
    const [propertyName, propertyValue] = property;
    //setter hver property til elementet:
    element[propertyName] = propertyValue;
  });
  return element;
}

//Funksjon som oppdaterer grid koordinatene til "snake" og "tail" etterhvert som den flytter seg.
//skjekker også om det er et eple på current coordinates.
function updateGridCoordinates() {
  eatApple();
  let gridStyle = `grid-column: ${currentPositionX}/span 1; grid-row: ${currentPositionY}/span 1`;
  gameElements.gridCoordinates.unshift(gridStyle);
  if (
    gameElements.gridCoordinates.length >
    gameElements.tailElements.length + 1
  )
    gameElements.gridCoordinates.pop();
  snakeHead.style = gridStyle;
  updateTailCoordinates();
  moved = true;
}

//funksjonen som opptarerer tail coordinates. Skjekker også om "snakeHead" er borti "snakeTail" via gameOver.
function updateTailCoordinates() {
  if (gameElements.tailElements.length === 0) return;
  else saveTailCoordinates();
  GameOver();
}

//funksjon som lagrer X og Y koordinatene til hver "tail" i grid.
function saveTailCoordinates() {
  let coordinatesArray = gameElements.gridCoordinates;
  let tailArray = gameElements.tailElements;
  //setter koordinatene for hver "tail"
  //bruker parseInt global funksjon, siden de fleste style values er strings.
  //parseInt() gjør det om til et nummer hvis det kan.
  for (i = 0; i < tailArray.length; i++) {
    tailArray[i].apple.element.style = coordinatesArray[i + 1];
    tailArray[i].apple.appleX = parseInt(
      tailArray[i].apple.element.style.gridColumnStart
    );
    tailArray[i].apple.appleY = parseInt(
      tailArray[i].apple.element.style.gridRowStart
    );
  }
}

//funksjon som skjekker om "snakeHead" og "snakeTail" har samme posisjon i grid.
//hvis det stemmer, reset spillet.
function GameOver() {
  let tailArray = gameElements.tailElements;
  tailArray.forEach((tail) => {
    if (tail.apple.appleX !== currentPositionX) return;
    else if (tail.apple.appleY !== currentPositionY) return;
    clearIntervals(currentInterval);
    gameReset = true;
    gameActive = false;
    resetGameScreen();
  });
}

//funksjon som lager et promise to resolve etter en gitt duration
function setTimeOutPromise(duration) {
  const myPromise = new Promise((resolve) => setTimeout(resolve, duration));
  return myPromise;
}
//funksjon som resetter gameScreen.
//plaserer "snakeHead" tilbake til start i toppen. fjerner alle haler.
//skjekker highscore, resetter score.
async function resetGameScreen() {
  //for at denne skal loope rett, må den loope baklengs gjennom arrayet. siden det er en async bruker en normal for loop.
  let tailArray = gameElements.tailElements;
  for (let i = tailArray.length - 1; i >= 0; i--) {
    tailArray[i].apple.element.classList.add("snakeTailDeath");
    await setTimeOutPromise(200);
    tailArray[i].apple.element.remove();
    tailArray.pop();
  }
  setActiveClass();
  resetStartPosition();
  setHighScore();
  setCurrentMovement();
  updateGridCoordinates();
  showBtn();
}

function resetStartPosition() {
  currentPositionX = 1;
  currentPositionY = 1;
}
//Funksjon som øker / flytter på grid posisjon mot høyre.
function moveRight() {
  currentPositionX++;
  if (
    currentPositionX > gridSize &&
    currentPositionY <= gridSize &&
    currentPositionY >= 1
  ) {
    currentPositionX = 1;
  }
  updateGridCoordinates();
}

//Funksjon som øker / flytter på grid posisjon mot venstre.
function moveLeft() {
  currentPositionX--;
  if (currentPositionX < 1 && currentPositionY <= gridSize) {
    currentPositionX = gridSize;
  }
  updateGridCoordinates();
}

//Funksjon som øker / flytter på grid posisjon nedover.
function moveDown() {
  currentPositionY++;
  if (
    currentPositionY > gridSize &&
    currentPositionX <= gridSize &&
    currentPositionX >= 1
  ) {
    currentPositionY = 1;
  }
  updateGridCoordinates();
}

//Funksjon som øker / flytter på grid posisjon oppover.
function moveUp() {
  currentPositionY--;
  if (
    currentPositionY < 1 &&
    currentPositionX <= gridSize &&
    currentPositionX >= 1
  ) {
    currentPositionY = gridSize;
  }
  updateGridCoordinates();
}

//funksjon som clearer alle intervals, sånn at de kan resettes.
function clearIntervals(currentInterval) {
  clearInterval(currentInterval);
  currentInterval = 0;
  //denne passer på at du ikke kan skifte retning før du har bevegd deg MINST en rute.
  moved = false;
}

//funksjon som lager en random grid posisjon.
function randomGridPosition() {
  return Math.ceil(Math.random() * gridSize);
}

//funksjon som spawner et eple, og gir den en random grid posisjon.
function spawnApple() {
  let appleX = randomGridPosition();
  let appleY = randomGridPosition();
  let appleGridCoordinates = `grid-column: ${appleX}/span 1; grid-row: ${appleY}/span 1`;
  if (gameElements.gridCoordinates.includes(appleGridCoordinates)) {
    spawnApple();
    return;
  }
  let apple = makeElement("div", { className: "apple" });
  gameElements.appleElements.apple = { element: apple, x: appleX, y: appleY };
  apple.style = appleGridCoordinates;
  gameScreen.appendChild(apple);
}

//funksjon som handler controls. skjekker hvilke taster som er trykket.
function gameControl(event) {
  if (event === "arrowright" || event === "d") {
    if (currentMovement === "horizontal") return;
    setActiveClass();
    setCurrentMovement("horizontal");
    clearIntervals(currentInterval);
    currentInterval = setInterval(moveRight, 100);
  } else if (event === "arrowleft" || event === "a") {
    if (currentMovement === "horizontal") return;
    setActiveClass("rotateLeft");
    setCurrentMovement("horizontal");
    clearIntervals(currentInterval);
    currentInterval = setInterval(moveLeft, 100);
  } else if (event === "arrowdown" || event === "s") {
    if (currentMovement === "vertical") return;
    setActiveClass("rotateDown");
    setCurrentMovement("vertical");
    clearIntervals(currentInterval);
    currentInterval = setInterval(moveDown, 100);
  } else if (event === "arrowup" || event === "w") {
    if (currentMovement === "vertical") return;
    setActiveClass("rotateUp");
    setCurrentMovement("vertical");
    clearIntervals(currentInterval);
    currentInterval = setInterval(moveUp, 100);
  }
}

//funksjon som setter aktiv bevegelses retning, default 0.
function setCurrentMovement(direction = 0) {
  currentMovement = direction;
}

//funksjon som setter hvilken snakeHeadClass som er aktiv, default rotateRight
function setActiveClass(className = "rotateRight") {
  snakeHead.classList.remove(activeClass);
  activeClass = className;
  snakeHead.classList.add(activeClass);
}

//funksjon som skjekker om et "eple" er spist.
function eatApple() {
  let appleArray = Object.keys(gameElements.appleElements);
  appleArray.forEach((apple) => {
    let currentApple = gameElements.appleElements[apple].element;
    let appleY = gameElements.appleElements[apple].y;
    let appleX = gameElements.appleElements[apple].x;
    if (currentPositionX !== appleX) return;
    else if (currentPositionY !== appleY) return;
    else if (currentPositionY === appleY && currentPositionX === appleX) {
      spawnApple();
      convertApple(currentApple, appleY, appleX);
      score++;
      scoreCount.textContent = `score: ${score}`;
    }
  });
}

//funksjon som konverterer eple til et haleelement hvis det er spist i eatApple()
function convertApple(apple, y, x) {
  apple.classList.remove("apple");
  apple.classList.add("snakeTail");
  gameElements.tailElements.push({
    apple: { element: apple, appleX: x, appleY: y },
  });
}

//skjekker om det er en ny highscore. poster highscore i localStorage.
function setHighScore() {
  if (score < highScore) return;
  else {
    localStorage.setItem("highScoreSnake", `${score}`);
    highScore = score;
    highScoreCount.textContent = `high score: ${highScore}`;
  }
  score = 0;
  scoreCount.textContent = `score: ${score}`;
}

//funksjon som lager knappen som starter spillet på gamestart eller hvis spillet resetes.
function showBtn() {
  let startBtn = makeElement("button", {
    className: "btn",
    textContent: "Start Game!",
  });
  gameElements.startBtn = startBtn;
  if (gameReset === true) startBtn.textContent = "Reset Game!";
  gameScreen.appendChild(startBtn);
  startBtn.addEventListener("click", () => {
    btnRemoval();
  });
}

//funksjon som fjerner knappen på gamestart, og lager eventlistener til gameControl.
function btnRemoval() {
  gameElements.startBtn.remove();
  gameElements.startBtn = null;
  gameActive = true;
}

//eventlistener for å starte spillet med "enter" knapp.
document.addEventListener("keydown", (event) => {
  if (!gameElements.startBtn) return;
  if (event.code !== "Enter") return;
  btnRemoval();
});

//funksjon som skjekker om vi er på mobil
function mobileSetup() {
  if (window.innerWidth > 600) return;
  else {
    //finner gridSize på samme måte som i sted.
    gridSize = mobileGridSize;
    mobileMode = true;
    makeMobileButtons();
  }
}
//funksjon som lager knapper hvis vi er på tlf.
function makeMobileButtons() {
  const mobileControlContainer = makeElement("div", {
    className: "mobileControlContainer",
  });
  Object.keys(inputObject).forEach((input) => {
    const inputButton = makeElement("button", {
      className: input,
      textContent: inputObject[input],
    });
    mobileControlContainer.appendChild(inputButton);
    inputButton.addEventListener("click", () => {
      if (!gameActive || !mobileMode || !moved) return;
      gameControl(input);
    });
  });
  document.body.appendChild(mobileControlContainer);
}

//main event listener.
document.addEventListener("keydown", (event) => {
  if (!gameActive || mobileMode || !moved) return;
  gameControl(event.key.toLowerCase());
});

//funksjon som pause hvis bruker alt-tabber ut av vinduet.
window.addEventListener("blur", () => {
  clearIntervals(currentInterval);
  setCurrentMovement();
  moved = true;
});

/* !!UPDATE GITHUB PAGES PLS!! */
