registerServiceWorker();

class Display {
    /**
     * @type {Number}
     */
    width;
    /**
     * @type {Number}
     */
    height;
    /**
     * @type {HTMLCanvasElement}
     */
    canvas;
    /**
     * @type {CanvasRenderingContext2D}
     */
    context;
    /**
     * @type {String}
     */
    backgroundColour;

    /**
     * @param {Number} width
     * @param {Number} height
     */
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.canvas = /** @type {HTMLCanvasElement} */(document.getElementById('canvas'));
        this.context =/** @type {CanvasRenderingContext2D} */ (this.canvas.getContext("2d"));
        this.backgroundColour = '#2db6fd';
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
document.getElementsByTagName('body')[0].style.backgroundColor = display.backgroundColour;

class Point {
    /**
     * @type {Number}
     */
    x;
    /**
     * @type {Number}
     */
    y;
    /**
     * @param {Number} x
     * @param {Number} y
     */
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
    /**
     * @type {Point}
     */
    coords;
    /**
     * @type {Number}
     */
    layedTime;
    /**
     * @type {Number}
     */
    hatchingDuration;
    /**
     * @param {Point} coords
     * @param {Number} layedTime
     * @param {Number} hatchingDuration
     */
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
    // for durations between 1 and 6 seconds
    moveDurationBase: 1000,
    moveDurationVariance: 5000,
    moveAnimationDurationPerSprite: 500,
    accelerationFactorAfterTap: 1.1,
};
class Chicken {
    /**
     * @type {Point}
     */
    coords;
    /**
     * @type {Number}
     */
    jumpOffset;
    /**
     * @type {Number}
     */
    v;
    /**
     * @type {Number}
     */
    state;
    /**
     * @type {Number}
     */
    jumpAfterEggStartTimestamp;
    /**
     * @type {Number}
     */
    moveAnimationStartTimestamp;
    /**
     * @type {Point}
     */
    moveVec;
    /**
     * @type {Number}
     */
    moveVecLastChange;
    /**
     * @type {Number}
     */
    moveDuration;
    /**
     * @param {Point} coords
     */
    constructor(coords) {
        this.coords = coords;
        this.jumpOffset = 0;
        this.setRandomDestination();
        this.v = ChickenConfig.speed;
        this.state = ChickenConfig.stateMoving;
        this.jumpAfterEggStartTimestamp = 0;
        this.moveAnimationStartTimestamp = Date.now();
    }

    /**
     * @param {Number} x
     * @param {Number} y
     */
    setDestination(x, y) {
        this.moveVec = new Point(x - this.coords.x, y - this.coords.y);
        this.moveVec.normaliseVector();
        this.moveVecLastChange = Date.now();
        this.moveDuration = ChickenConfig.moveDurationBase + Math.random() * ChickenConfig.moveDurationVariance;
    }

    setRandomDestination() {
        this.setDestination(Math.random() * display.width, Math.random() * display.height);
    }

    /**
     * @param {Number} lowX
     * @param {Number} lowY
     * @param {Number} highX
     * @param {Number} highY
     */
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

    /**
    * @type {Number}
    */
    gameInitialisedTimestamp;
    /**
    * @type {Number}
    */
    welcomeScreenTransitionStart;
    /**
    * @type {Boolean}
    */
    welcomeScreenJumpDone;
    /**
    * @type {Array<Chicken>}
    */
    chickens;
    /**
    * @type {Array<Egg>}
    */
    eggs;
    /**
    * @type {Number}
    */
    gameLoopPreviousTimestamp;
    /**
    * @type {Number}
    */
    totalScore;
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

class Sound {
    /**
    * @type {AudioContext}
    */
    audioContext;
    /**
    * @type {AudioWrapper[]}
    */
    audios;
    constructor() {
        this.audioContext = new AudioContext();
        this.audios = [];
    }

    /**
     * @param {String} filename
     * @param {String} key
     */
    loadAudio(filename, key) {
        fetch(`./audios/${filename}`)
            .then((file) => {
                file.arrayBuffer()
                    .then((arrayBuffer) => {
                        this.audioContext.decodeAudioData(arrayBuffer)
                            .then((audioBuffer) => {
                                console.log('loaded audio: ' + key + ' / ' + filename);
                                this.audios.push(new AudioWrapper(key, audioBuffer));
                                checkLoadedFiles();
                            });
                    });
            });
    }

    /**
     * @param {String} key
     */
    playAudio(key) {
        const a = this.audios.find((a) => a.name === key);
        if (!a) {
            console.log('can not play audio: ' + key);
            return;
        }
        if (this.audioContext.state === "suspended") {
            this.audioContext.resume();
        }
        // play the audio
        const audioSource = this.audioContext.createBufferSource();
        audioSource.buffer = a.audioBuffer;
        audioSource.connect(this.audioContext.destination);
        audioSource.start();
    }

    playRandomAudio() {
        const i = Math.floor(Math.random() * this.audios.length);
        this.playAudio(this.audios[i].name);
    }
}

class AudioWrapper {
    /**
    * @type {String}
    */
    name;
    /**
    * @type {AudioBuffer}
    */
    audioBuffer;

    /**
     * @param {String} name
     * @param {AudioBuffer} audioBuffer
     */
    constructor(name, audioBuffer) {
        this.name = name;
        this.audioBuffer = audioBuffer;
    }
}

class ImageWrapper {
    /**
     * @type {String}
     */
    name;
    /**
     * @type {HTMLImageElement}
     */
    image;
    /**
     * @type {Number}
     */
    width;
    /**
     * @type {Number}
     */
    height;
    /**
     * @param {string} name
     * @param {HTMLImageElement} image
     * @param {number} width
     * @param {number} height
     */
    constructor(name, image, width, height) {
        this.name = name;
        this.width = width;
        this.height = height;
        this.image = image;
    }

}

class Visuals {
    /**
     * @type {ImageWrapper[]}
     */
    images;

    constructor() {
        this.images = [];
        this.loadImage('fallback', 'fallback.png', 128, 128);
    }

    /**
     * @param {string} name
     * @param {String} filename
     * @param {number} width
     * @param {number} height
     */
    loadImage(name, filename, width, height) {
        const image = new Image();
        image.onload = checkLoadedFiles;
        image.src = `./images/${filename}`;

        console.log('loaded image: ' + name + ' / ' + filename);
        const w = new ImageWrapper(name, image, width, height);
        this.images.push(w);
    }

    /**
     * @param {String} key
     *  @returns {ImageWrapper}
     */
    getImage(key) {
        const image = this.images.find((e) => e.name === key);
        if (image) {
            return image;
        }
        return this.images[0]; // fallback
    }
}

const gameState = new GameState();

gameState.chickens.push(new Chicken(new Point(display.width / 2, display.height / 2)));

const sound = new Sound();
sound.loadAudio('chicken-cluck.ogg', 'cluck');

const visuals = new Visuals();
visuals.loadImage('huhn', 'huhn.svg', 128, 128);
visuals.loadImage('huhnMoving1', 'huhn-moving1.svg', 128, 128);
visuals.loadImage('huhnMoving2', 'huhn-moving2.svg', 128, 128);
visuals.loadImage('jump', 'huhn-jump.svg', 128, 128);
visuals.loadImage('ei', 'ei.svg', 128, 128);
visuals.loadImage('ei2', 'ei2.svg', 128, 128);
visuals.loadImage('ei3', 'ei3.svg', 128, 128);

let filesLoaded = 0;

function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("serviceworker.js")
    }
}

function checkLoadedFiles() {
    if (++filesLoaded >= sound.audios.length + visuals.images.length) {
        filesLoaded = 0; // reset somehow
        init();
    }
}

function init() {
    // seems like touch events always also generate a mousedown event, so we
    // don't need the touch event
    //TODO: or do we?
    display.canvas.addEventListener(
        "click",
        (e) => {
            handleTapEvent(e.clientX, e.clientY);
        }, false
    );

    // quick-fix for small children not being able to play well on touchpads.
    // pressing any key acts as if the next moving chicken has been tapped :)
    document.addEventListener(
        "keydown",
        (_e) => {
            console.log('registered keypress');
            switch (gameState.phase) {
                case GameConfig.phaseWelcomeScreen: {
                    // tapping on welcome screen leads to the main game
                    console.log('entering main game');
                    gameState.welcomeScreenTransitionStart = Date.now();
                    break;
                }
                case GameConfig.phaseMainGame: {
                    // check if chicken was tapped
                    for (let i = 0; i < gameState.chickens.length; i += 1) {
                        const chicken = gameState.chickens[i];
                        if (chicken.state === ChickenConfig.stateMoving) {
                            handleChickenTap(chicken);
                            break;
                        }
                    }
                }
            }
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


/**
 * @param {Number} eventX
 * @param {Number} eventY
 */
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
            const image = visuals.getImage('huhn');
            const halfWidth = image.width / 2;
            const halfHeight = image.height / 2;
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

/**
 * @param {Chicken} chicken
 */
function handleChickenTap(chicken) {
    if (chicken.state !== ChickenConfig.stateMoving) {
        // only moving chicken are tap-able
        return;
    }
    chicken.state = ChickenConfig.stateJumping;
    chicken.jumpAfterEggStartTimestamp = Date.now();

    // lay egg a bit to the side, depending where chicken is facing
    let dx = 30;
    if (chicken.moveVec.x > 0) {
        dx = -dx;
    }
    gameState.eggs.push(new Egg(new Point(chicken.coords.x + dx, chicken.coords.y), Date.now(), 4000));

    sound.playAudio('cluck');
}

/**
 * @param {Number} x
 * @param {Number} y
 */
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
            const variance = visuals.getImage('huhn').width;
            const destX = display.width / 2 - variance / 2 + Math.random() * variance;
            const destY = display.height / 2 - variance / 2 + Math.random() * variance;
            chicken.setDestination(destX, destY);
            // run!
            chicken.v *= 2;
        }

    }

}

/**
 * @param {Number} timestamp
 */
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

/**
 * @param {Number} elapsed
 */
function gameLoopMainGame(elapsed) {
    const now = Date.now();

    const chickenToRemove = [];
    // calculate chicken movement
    for (let i = 0; i < gameState.chickens.length; i += 1) {
        const chicken = gameState.chickens[i];
        const image = visuals.getImage('huhn');

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
                    -image.width, -image.height,
                    display.width + image.width, display.height + image.height)
                ) {
                    // chicken is leaving and moved off screen
                    chickenToRemove.push(i);
                }
                break;
            }

            case ChickenConfig.stateJumping: {
                const elapsedSinceJumpStart = now - chicken.jumpAfterEggStartTimestamp;
                chicken.jumpOffset = Math.sin(elapsedSinceJumpStart / 5 / 180 * Math.PI) * image.height / 1.5;
                // jump a bit sideways
                chicken.coords.x += 0.1 * elapsed;

                if (chicken.jumpOffset < 0) {
                    chicken.setRandomDestination();
                    chicken.state = ChickenConfig.stateMoving;
                    chicken.v *= ChickenConfig.accelerationFactorAfterTap;
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

/**
 * @param {Number} now
 */
function drawMainGame(now) {
    // clear screen
    display.context.fillStyle = display.backgroundColour;
    display.context.fillRect(0, 0, display.width, display.height);

    // instructions and info
    display.context.font = '2em sans-serif';
    display.context.fillStyle = 'black';
    // how many eggs have been layed
    const chickenCountText = `${gameState.chickens.length} / ${GameConfig.maxChickenQuantity}`;
    display.context.fillText(chickenCountText, display.width - 80 - display.context.measureText(chickenCountText).width, 50);
    display.context.drawImage(visuals.getImage('ei3').image, display.width - 80, -20, 80, 80);
    // how many chicken ran away already?
    const scoreText = `${gameState.totalScore}`;
    display.context.fillText(scoreText, display.width - 80 - display.context.measureText(scoreText).width, 120);
    display.context.drawImage(visuals.getImage('huhn').image, display.width - 70, 75, 64, 64);

    // draw eggs
    for (let i = 0; i < gameState.eggs.length; i += 1) {
        const egg = gameState.eggs[i];
        let image = visuals.getImage('ei3');
        if (egg.layedTime + egg.hatchingDuration / 3 > now) {
            image = visuals.getImage('ei');
        } else if (egg.layedTime + egg.hatchingDuration * 2 / 3 > now) {
            image = visuals.getImage('ei2');
        }
        display.context.drawImage(image.image, egg.coords.x - image.width / 2, egg.coords.y - image.height / 2, image.width, image.height);
    }

    // draw chickens
    for (let i = 0; i < gameState.chickens.length; i += 1) {
        const chicken = gameState.chickens[i];
        switch (chicken.state) {
            case ChickenConfig.stateMoving:
            case ChickenConfig.stateLeaving: {
                //TODO: abstract animations
                //TODO: reduce duration per sprite based on speed of chicken
                const elapsedSinceAnimationStart = Math.max(now - chicken.moveAnimationStartTimestamp, 0);
                const spriteQuantity = 2;
                const y = elapsedSinceAnimationStart % (spriteQuantity * ChickenConfig.moveAnimationDurationPerSprite);
                const spriteIndex = Math.floor(y / ChickenConfig.moveAnimationDurationPerSprite);
                const sprites = [visuals.getImage('huhnMoving1'), visuals.getImage('huhnMoving2')];

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
                const image = visuals.getImage('jump');
                display.context.translate(chicken.coords.x - image.width / 2, chicken.coords.y - image.height / 2);
                let relativeX = 0
                if (chicken.moveVec.x > 0) {
                    display.context.scale(-1, 1);
                    relativeX = -image.width;
                }
                display.context.drawImage(image.image, relativeX, -chicken.jumpOffset, image.width, image.height);
                display.context.resetTransform();
                break;
            }
        }
    }

}

function drawWelcomeScreen() {
    // clear screen
    display.context.fillStyle = display.backgroundColour;
    display.context.fillRect(0, 0, display.width, display.height);

    const timestamp = Date.now();
    const elapsedSinceStart = timestamp - gameState.gameInitialisedTimestamp;
    const elapsedSinceTransitionStart = timestamp - gameState.welcomeScreenTransitionStart;

    const transitionDurationInMillis = 500;
    const slowingFactor = 10;
    const scale = 2;

    const huhnImage = visuals.getImage('huhn');

    // jumping chicken animation as welcome screen
    let jumpY = -Math.cos(elapsedSinceStart / slowingFactor / 180 * Math.PI) * huhnImage.height / 2;
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

        const startX = display.width / 2 - huhnImage.width / 2 * transitionScale;
        const startY = display.height / 2 - huhnImage.height / 2 * transitionScale;

        display.context.translate(startX, startY);
        display.context.scale(transitionScale, transitionScale);
        display.context.drawImage(huhnImage.image, 0, 0, huhnImage.width, huhnImage.height);
        display.context.resetTransform();
        return;
    }

    // default welcome screen: big jumping chicken
    const startX = display.width / 2 - huhnImage.width / 2 * scale;
    const startY = display.height / 2 - huhnImage.height / 2 * scale;

    display.context.translate(startX, startY);
    display.context.scale(scale, scale);
    display.context.drawImage(huhnImage.image, 0, -jumpY, huhnImage.width, huhnImage.height);
    display.context.resetTransform();
}

