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

    /**
        * interprets the coordinates of this point as vector and normalises
        * it (setting the length to 1)
    */
    normaliseVector() {
        const length = Math.sqrt(this.x * this.x + this.y * this.y);
        this.x /= length;
        this.y /= length;
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
    stateJumping: 1,
    stateLeaving: 2,

    speed: 200,
    jumpAfterEggDuration: 2000,
    // for durations between 1 and 6 seconds
    moveDurationBase: 1000,
    moveDurationVariance: 5000,
    moveAnimationDurationPerSprite: 500,
};
class Chicken {
    constructor(coords) {
        this.coords = coords;
        this.setRandomDestination();
        this.v = ChickenConfig.speed;
        this.state = ChickenConfig.stateMoving;
        this.jumpAfterEggStartTimestamp = 0;
        this.moveAnimationStartTimestamp = Date.now();
    }

    setDestination(x, y) {
        this.moveVec = new Point(x - this.coords.x, y - this.coords.y);
        this.moveVec.normaliseVector();
        this.moveVecLastChange = Date.now();
        this.moveDuration = ChickenConfig.moveDurationBase + Math.random() * ChickenConfig.moveDurationVariance;
    }

    setRandomDestination() {
        this.setDestination(Math.random() * display.width, Math.random() * display.height);
    }

    isWithinBounds(lowX, lowY, highX, highY) {
        return this.coords.x > lowX && this.coords.y > lowY && this.coords.x < highX && this.coords.y < highY;
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
        this.totalScore = 0;
    }
}

const gameState = new GameState();

gameState.chickens.push(new Chicken(new Point(display.width / 2, display.height / 2)));



const images = {};
images.huhn = loadImage('huhn.svg', 128, 128);
images.huhnMoving1 = loadImage('huhn-moving1.svg', 128, 128);
images.huhnMoving2 = loadImage('huhn-moving2.svg', 128, 128);
images.jump = loadImage('huhn-jump.svg', 128, 128);
images.ei = loadImage('ei.svg', 128, 128);
let imagesLoaded = 0;

function loadImage(filename, width, height) {
    const image = new Image();
    image.onload = checkLoadedImages;
    image.src = `./images/${filename}`;
    return { image: image, width: width, height: height };
}

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
            const halfWidth = images.huhn.width / 2;
            const halfHeight = images.huhn.height / 2;
            for (let i = 0; i < gameState.chickens.length; i += 1) {
                const chicken = gameState.chickens[i];
                if (eventX >= chicken.coords.x - halfWidth && eventX <= chicken.coords.x + halfWidth
                    && eventY >= chicken.coords.y - halfHeight && eventY <= chicken.coords.y + halfHeight) {
                    // very simple collision detection
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
    chicken.state = ChickenConfig.stateJumping;
    chicken.jumpAfterEggStartTimestamp = Date.now();
}

function addChicken(x, y) {
    gameState.chickens.push(new Chicken(new Point(x, y)));
    if (gameState.chickens.length > GameConfig.maxChickenQuantity) {

        // "soft game over", or reset of the game:
        // all chicken (except the newest) run outside of the screen
        //
        // there is a funny bug/feature: when another chicken hatches while there
        // are still chicken leaving, and this logic is invoked again, they
        // will run even faster, and back again through the middle of the screen
        for (let i = 0; i < gameState.chickens.length - 1; i += 1) {
            const chicken = gameState.chickens[i];

            chicken.state = ChickenConfig.stateLeaving;

            // chicken should run through the middle of the screen, with a bit of random
            const variance = images.huhn.width;
            const destX = display.width / 2 - variance / 2 + Math.random() * variance;
            const destY = display.height / 2 - variance / 2 + Math.random() * variance;
            chicken.setDestination(destX, destY);
            // run!
            chicken.v *= 2;
        }

    }

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

    const chickenToRemove = [];
    // calculate chicken movement
    for (let i = 0; i < gameState.chickens.length; i += 1) {
        const chicken = gameState.chickens[i];

        switch (chicken.state) {
            case ChickenConfig.stateMoving: {
                chicken.coords.x += chicken.moveVec.x * chicken.v * elapsed;
                chicken.coords.y += chicken.moveVec.y * chicken.v * elapsed;

                // check if chicken has reached destination or hits a wall
                if (now - chicken.moveVecLastChange > chicken.moveDuration || !chicken.isWithinBounds(0, 0, display.width, display.height)) {
                    chicken.setRandomDestination();
                }

                break;
            }
            case ChickenConfig.stateLeaving: {
                chicken.coords.x += chicken.moveVec.x * chicken.v * elapsed;
                chicken.coords.y += chicken.moveVec.y * chicken.v * elapsed;

                if (!chicken.isWithinBounds(
                    -images.huhn.width, -images.huhn.height,
                    display.width + images.huhn.width, display.height + images.huhn.height)
                ) {
                    // chicken is leaving and moved off screen
                    chickenToRemove.push(i);
                }
                break;
            }

            case ChickenConfig.stateJumping: {
                //TODO: laying egg animation
                const layingTime = now - chicken.jumpAfterEggStartTimestamp;
                if (layingTime > ChickenConfig.jumpAfterEggDuration) {
                    chicken.setRandomDestination();
                    gameState.eggs.push(new Egg(new Point(chicken.coords.x, chicken.coords.y), Date.now(), 3000));
                    chicken.state = ChickenConfig.stateMoving;
                }
                break;
            }
            default:
                console.log(`illegal chicken state => ${chicken.state}`);
        }
    }
    // remove chicken
    for (let i = chickenToRemove.length - 1; i >= 0; i -= 1) {
        const index = chickenToRemove[i];
        gameState.chickens.splice(index, 1);
        gameState.totalScore += 1;
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

    drawMainGame(now);

}

function drawMainGame(now) {
    // clear screen
    display.context.fillStyle = "#FAFAFA";
    display.context.fillRect(0, 0, display.width, display.height);

    // instructions and info
    display.context.font = '2em sans-serif';
    display.context.fillStyle = 'black';
    const chickenCountText = `${gameState.chickens.length} / ${GameConfig.maxChickenQuantity} 🐣`;
    display.context.fillText(chickenCountText, display.width - 40 - display.context.measureText(chickenCountText).width, 50);
    const scoreText = `${gameState.totalScore} 🐓`;
    display.context.fillText(scoreText, display.width - 40 - display.context.measureText(scoreText).width, 100);

    // draw eggs
    for (let i = 0; i < gameState.eggs.length; i += 1) {
        const egg = gameState.eggs[i];
        display.context.drawImage(images.ei.image, egg.coords.x - images.ei.width / 2, egg.coords.y - images.ei.height / 2, images.ei.width, images.ei.height);
    }

    // draw chickens
    //TODO: moving animation & side change
    for (let i = 0; i < gameState.chickens.length; i += 1) {
        const chicken = gameState.chickens[i];
        switch (chicken.state) {
            case ChickenConfig.stateMoving:
            case ChickenConfig.stateLeaving: {
                //TODO: abstract animations
                const elapsedSinceAnimationStart = Math.max(now - chicken.moveAnimationStartTimestamp, 0);
                const spriteQuantity = 2;
                const y = elapsedSinceAnimationStart % (spriteQuantity * ChickenConfig.moveAnimationDurationPerSprite);
                const spriteIndex = Math.floor(y / ChickenConfig.moveAnimationDurationPerSprite);
                const sprites=[images.huhnMoving1, images.huhnMoving2];

                const image = sprites[spriteIndex];
                display.context.translate(chicken.coords.x - image.width / 2, chicken.coords.y - image.height / 2);
                let relativeX = 0
                if (chicken.moveVec.x > 0) {
                    display.context.scale(-1, 1);
                    relativeX = -image.width;
                }
                display.context.drawImage(image.image, relativeX, 0, image.width, image.height);
                display.context.resetTransform();
                break;
            }
            case ChickenConfig.stateJumping: {
                const image = images.jump;
                display.context.translate(chicken.coords.x - image.width / 2, chicken.coords.y - image.height / 2);
                let relativeX = 0
                if (chicken.moveVec.x > 0) {
                    display.context.scale(-1, 1);
                    relativeX = -image.width;
                }
                display.context.drawImage(image.image, relativeX, 0, image.width, image.height);
                display.context.resetTransform();
                break;
            }
        }
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
    let jumpY = -Math.cos(elapsedSinceStart / slowingFactor / 180 * Math.PI) * images.huhn.height / 2;
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

        const startX = display.width / 2 - images.huhn.width / 2 * transitionScale;
        const startY = display.height / 2 - images.huhn.height / 2 * transitionScale;

        display.context.translate(startX, startY);
        display.context.scale(transitionScale, transitionScale);
        display.context.drawImage(images.huhn.image, 0, 0, images.huhn.width, images.huhn.height);
        display.context.resetTransform();
        return;
    }

    // default welcome screen: big jumping chicken
    const startX = display.width / 2 - images.huhn.width / 2 * scale;
    const startY = display.height / 2 - images.huhn.height / 2 * scale;

    display.context.translate(startX, startY);
    display.context.scale(scale, scale);
    display.context.drawImage(images.huhn.image, 0, -jumpY, images.huhn.width, images.huhn.height);
    display.context.resetTransform();
}

