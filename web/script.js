registerServiceWorker();

class Display {
    canvas = document.getElementById('canvas');
    context = canvas.getContext("2d");

    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    adjustCanvasDimensions() {
        const root = document.getElementsByTagName('html')[0];
        this.width = root.clientWidth;
        this.height = root.clientHeight - 5;

        console.log(`changing canvas dimensions from ${this.canvas.width}x${this.canvas.height} to ${this.width}x${this.height}`);
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
}

const display = new Display(0, 0);
display.adjustCanvasDimensions();

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Egg {
    constructor(coords, layedTime, hatchingDuration) {
        this.coords = coords;
        this.layedTime = layedTime;
        this.hatchingDuration = hatchingDuration;
    }
}

const ChickenConfig = {
    stateMoving: 0,
    stateLayingEgg: 1,

    speed: 200,
    eggLayingTime: 2000,
};
class Chicken {
    constructor(coords) {
        this.coords = coords;
        this.dest = new Point(Math.random() * display.width, Math.random() * display.height);
        this.v = ChickenConfig.speed;
        this.state = ChickenConfig.stateMoving;
        this.lastEggTimestamp = 0;
    }
}

const GameConfig = {
    phaseLoading: 0,
    phaseWelcomeScreen: 1,
    phaseMainGame: 2,
    phaseGameOver: 3,

    maxChickenQuantity: 25,
}
class GameState {
    constructor() {
        this.phase = GameConfig.phaseWelcomeScreen;
        this.reset();
    }

    reset() {
        this.gameInitialisedTimestamp = 0;

        // attributes for phase: welcome screen
        this.welcomeScreenTransitionStart = 0;
        this.welcomeScreenJumpDone = false;

        // attributes for phase: main game
        this.chickens = [];
        this.eggs = [];

        this.gameLoopPreviousTimestamp = 0;
    }
}

const gameState = new GameState();

gameState.chickens.push(new Chicken(new Point(display.width / 2, display.height / 2)));

//TODO: pre-load images before drawing (use window.onload?)
const images = {};
images.huhnImage = new Image();
images.eiImage = new Image();
let imagesLoaded = 0;
images.huhnImage.onload = function() {
    checkLoadedImages();
}
images.eiImage.onload = function() {
    checkLoadedImages();
}
images.huhnImage.src = 'huhn.png';
images.eiImage.src = 'ei.png';

function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("serviceworker.js")
    }
}

function checkLoadedImages() {
    if (++imagesLoaded >= Object.keys(images).length) {
        imagesLoaded = 0;// reset somehow
        init();
    }
}

function init() {
    // seems like touch events always also generate a mousedown event, so we
    // don't need the touch event
    canvas.addEventListener(
        "click",
        (e) => {
            handleTapEvent(e.clientX, e.clientY);
        }, false
    );

    // adjust canvas size in case of window resizes
    window.addEventListener("resize", (_e) => {
        display.adjustCanvasDimensions();
    }, false);

    gameState.gameInitialisedTimestamp = Date.now();
    // kick off the game loop
    window.requestAnimationFrame(gameLoop);
}


function handleTapEvent(eventX, eventY) {
    console.log(`handling event with coords: ${eventX}|${eventY}`);

    switch (gameState.phase) {
        case GameConfig.phaseLoading: {
            console.log('ignoring tap event in current phase');
            break;
        }
        case GameConfig.phaseWelcomeScreen: {
            // tapping on welcome screen leads to the main game
            console.log('entering main game');
            gameState.welcomeScreenTransitionStart = Date.now();
            break;
        }
        case GameConfig.phaseGameOver: {
            console.log('ignoring tap event in current phase');
            break;
        }

        case GameConfig.phaseMainGame: {
            // check if chicken was tapped
            const halfWidth = images.huhnImage.naturalWidth / 2;
            const halfHeight = images.huhnImage.naturalHeight / 2;
            for (let i = 0; i < gameState.chickens.length; i += 1) {
                const chicken = gameState.chickens[i];
                if (eventX >= chicken.coords.x - halfWidth && eventX <= chicken.coords.x + halfWidth
                    && eventY >= chicken.coords.y - halfHeight && eventY <= chicken.coords.y + halfHeight) {
                    // very simple collision detection
                    //TODO: improve collision detection
                    handleChickenTap(chicken);
                    break;
                }
            }
            break;
        }

        default:
            console.log(`unknown game phase: ${gameState.phase}`);
            break;
    }

}

function handleChickenTap(chicken) {
    if (chicken.state !== ChickenConfig.stateMoving) {
        // only moving chicken are tap-able
        return;
    }
    chicken.state = ChickenConfig.stateLayingEgg;
    chicken.lastEggTimestamp = Date.now();
    //TODO: laying egg animation
}

function addChicken(x, y) {
    gameState.chickens.push(new Chicken(new Point(x, y)));
    if (gameState.chickens.length > GameConfig.maxChickenQuantity) {
        //TODO: introduce game over
        gameState.chickens.shift();
    }
}

function setRandomDestination(chicken) {
    chicken.dest.x = Math.random() * display.width;
    chicken.dest.y = Math.random() * display.height;
}

function gameLoop(timestamp) {
    const elapsed = (timestamp - gameState.gameLoopPreviousTimestamp) / 1000;
    gameState.gameLoopPreviousTimestamp = timestamp;
    switch (gameState.phase) {
        case GameConfig.phaseLoading: {
            break;
        }
        case GameConfig.phaseWelcomeScreen: {
            drawWelcomeScreen();
            break;
        }
        case GameConfig.phaseGameOver: {
            break;
        }

        case GameConfig.phaseMainGame: {
            gameLoopMainGame(elapsed);
            break;
        }
        default:
            console.log(`unknown game phase: ${gameState.phase}`);
    }
    window.requestAnimationFrame(gameLoop);
}

function gameLoopMainGame(elapsed) {
    const now = Date.now();

    // calculate chicken movement
    for (let i = 0; i < gameState.chickens.length; i += 1) {
        const chicken = gameState.chickens[i];

        switch (chicken.state) {
            case ChickenConfig.stateMoving: {
                const dx = chicken.dest.x - chicken.coords.x;
                const dy = chicken.dest.y - chicken.coords.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                chicken.coords.x += dx / length * chicken.v * elapsed;
                chicken.coords.y += dy / length * chicken.v * elapsed;

                // check if chicken has reached destination
                if (Math.abs(dx) + Math.abs(dy) < 20) {
                    setRandomDestination(chicken);
                }
                break;
            }

            case ChickenConfig.stateLayingEgg: {
                const layingTime = now - chicken.lastEggTimestamp;
                if (layingTime > ChickenConfig.eggLayingTime) {
                    setRandomDestination(chicken);
                    gameState.eggs.push(new Egg(new Point(chicken.coords.x, chicken.coords.y), Date.now(), 3000));
                    chicken.state = ChickenConfig.stateMoving;
                }
                break;
            }
            default:
                console.log(`illegal chicken state => ${chicken.state}`);
        }
    }

    // update eggs
    const eggsToRemove = [];
    for (let i = 0; i < gameState.eggs.length; i += 1) {
        const egg = gameState.eggs[i];
        if (egg.layedTime + egg.hatchingDuration < now) {
            // remove egg
            //TODO: hatching animation
            eggsToRemove.push(i);
            // spawn chick0rn
            addChicken(egg.coords.x, egg.coords.y);
        }

    }
    // actually remove the eggs
    for (let i = eggsToRemove.length - 1; i >= 0; i -= 1) {
        const index = eggsToRemove[i];
        gameState.eggs.splice(index, 1);
    }

    drawMainGame();

}

function drawMainGame() {
    // clear screen
    display.context.fillStyle = "#FAFAFA";
    display.context.fillRect(0, 0, display.width, display.height);

    // instructions and info
    display.context.font = '2em sans-serif';
    display.context.fillStyle = 'black';
    const scoreText = gameState.chickens.length + ' / ' + GameConfig.maxChickenQuantity;
    display.context.fillText(scoreText, display.width - 40 - display.context.measureText(scoreText).width, 50);

    // draw eggs
    for (let i = 0; i < gameState.eggs.length; i += 1) {
        const egg = gameState.eggs[i];
        display.context.drawImage(images.eiImage, egg.coords.x - images.eiImage.naturalWidth / 2, egg.coords.y - images.eiImage.naturalHeight / 2);
    }

    // draw chickens
    for (let i = 0; i < gameState.chickens.length; i += 1) {
        const chicken = gameState.chickens[i];
        display.context.drawImage(images.huhnImage, chicken.coords.x - images.huhnImage.naturalWidth / 2, chicken.coords.y - images.huhnImage.naturalHeight / 2);
    }

}

function drawWelcomeScreen() {
    // clear screen
    display.context.fillStyle = "#FAFAFA";
    display.context.fillRect(0, 0, display.width, display.height);

    const timestamp = Date.now();
    const elapsedSinceStart = timestamp - gameState.gameInitialisedTimestamp;
    const elapsedSinceTransitionStart = timestamp - gameState.welcomeScreenTransitionStart;

    const transitionDurationInMillis = 500;
    const slowingFactor = 10;
    const scale = 2;


    // jumping chicken animation as welcome screen
    let jumpY = -Math.cos(elapsedSinceStart / slowingFactor / 180 * Math.PI) * images.huhnImage.naturalHeight / 2;
    if (jumpY < 0 && !gameState.welcomeScreenJumpDone) {
        jumpY = 0;
    }

    // finish the jumping animation before starting the transition animation
    if (gameState.welcomeScreenTransitionStart > 0
        && !gameState.welcomeScreenJumpDone
        && jumpY === 0) {
        gameState.welcomeScreenJumpDone = true;
        gameState.welcomeScreenTransitionStart = timestamp;
        return;
    }

    // main game about to start, begin transition animation
    if (gameState.welcomeScreenJumpDone) {
        if (elapsedSinceTransitionStart > transitionDurationInMillis) {
            gameState.phase = GameConfig.phaseMainGame;
            return;
        }
        // linearly scale down the chicken
        const transitionProgressInPercent = elapsedSinceTransitionStart / transitionDurationInMillis;
        const transitionScale = scale - transitionProgressInPercent;

        const startX = display.width / 2 - images.huhnImage.naturalWidth / 2 * transitionScale;
        const startY = display.height / 2 - images.huhnImage.naturalHeight / 2 * transitionScale;

        display.context.translate(startX, startY);
        display.context.scale(transitionScale, transitionScale);
        display.context.drawImage(images.huhnImage, 0, 0);
        display.context.resetTransform();
        return;
    }

    // default welcome screen: big jumping chicken
    const startX = display.width / 2 - images.huhnImage.naturalWidth / 2 * scale;
    const startY = display.height / 2 - images.huhnImage.naturalHeight / 2 * scale;

    display.context.translate(startX, startY);
    display.context.scale(scale, scale);
    display.context.drawImage(images.huhnImage, 0, -jumpY);
    display.context.resetTransform();
}

