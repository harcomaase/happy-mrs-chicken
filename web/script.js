registerServiceWorker();

const canvas = document.getElementById('canvas');
const context = canvas.getContext("2d");

let width = 0;
let height = 0;
adjustCanvasDimensions();


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

const CHICKEN_STATE_MOVING = 0;
const CHICKEN_STATE_LAYING_EGG = 1;
const chickenEggLayingTime = 2000;
class Chicken {
    constructor(coords) {
        this.coords = coords;
        this.dest = new Point(Math.random() * width, Math.random() * height);
        this.v = 200;
        this.state = CHICKEN_STATE_MOVING;
        this.lastEggTimestamp = 0;
    }
}

const chickens = [];
chickens.push(new Chicken(new Point(width / 2, height / 2)));

const eggs = [];

let previousTimestamp = 0;

//TODO: pre-load images before drawing (use window.onload?)
const huhnImage = new Image();
const eiImage = new Image();
let imagesLoaded = 0;
const imagesToLoad = 2;
huhnImage.onload = function() {
    checkLoadedImages();
}
eiImage.onload = function() {
    checkLoadedImages();
}
huhnImage.src = 'huhn.png';
eiImage.src = 'ei.png';

function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("serviceworker.js")
    }
}

function checkLoadedImages() {
    if (++imagesLoaded >= imagesToLoad) {
        imagesLoaded = 0;// reset somehow
        init();
    }
}

function init() {
    // add some first game-like feature: spawn chicken on touch or click
    //
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
        adjustCanvasDimensions();
    }, false);

    // kick off the game loop
    window.requestAnimationFrame(gameLoop);
}

function adjustCanvasDimensions() {
    const root = document.getElementsByTagName('html')[0];
    width = root.clientWidth;
    height = root.clientHeight;

    console.log(`changing canvas dimensions from ${canvas.width}x${canvas.height} to ${width}x${height}`);
    canvas.width = width;
    canvas.height = height;
}

function handleTapEvent(eventX, eventY) {
    console.log(`handling event with coords: ${eventX}|${eventY}`);

    // check if chicken was tapped
    const halfWidth = huhnImage.naturalWidth / 2;
    const halfHeight = huhnImage.naturalHeight / 2;
    for (let i = 0; i < chickens.length; i += 1) {
        const chicken = chickens[i];
        if (eventX >= chicken.coords.x - halfWidth && eventX <= chicken.coords.x + halfWidth
            && eventY >= chicken.coords.y - halfHeight && eventY <= chicken.coords.y + halfHeight) {
            // very simple collision detection
            //TODO: improve collision detection
            handleChickenTap(chicken);
            break;
        }
    }

}

function handleChickenTap(chicken) {
    if (chicken.state !== CHICKEN_STATE_MOVING) {
        // only moving chicken are tap-able
        return;
    }
    chicken.state = CHICKEN_STATE_LAYING_EGG;
    chicken.lastEggTimestamp = Date.now();
    //TODO: laying egg animation
}

function addChicken(x, y) {
    chickens.push(new Chicken(new Point(x, y)));
    if (chickens.length > 25) {
        chickens.shift();
    }
}

function setRandomDestination(chicken) {
    chicken.dest.x = Math.random() * width;
    chicken.dest.y = Math.random() * height;
}

function gameLoop(timestamp) {
    const elapsed = (timestamp - previousTimestamp) / 1000;
    previousTimestamp = timestamp;
    const now = Date.now();

    // calculate chicken movement
    for (let i = 0; i < chickens.length; i += 1) {
        const chicken = chickens[i];

        switch (chicken.state) {
            case CHICKEN_STATE_MOVING:{
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

            case CHICKEN_STATE_LAYING_EGG:{
                const layingTime = now - chicken.lastEggTimestamp;
                if (layingTime > chickenEggLayingTime) {
                    setRandomDestination(chicken);
                    eggs.push(new Egg(new Point(chicken.coords.x, chicken.coords.y), Date.now(), 3000));
                    chicken.state = CHICKEN_STATE_MOVING;
                }
                break;
            }
            default:
                console.log(`illegal chicken state => ${chicken.state}`);
        }
    }

    // update eggs
    const eggsToRemove = [];
    for (let i = 0; i < eggs.length; i += 1) {
        const egg = eggs[i];
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
        eggs.splice(index, 1);
    }

    draw();

    window.requestAnimationFrame(gameLoop);
}

function draw() {
    // clear screen
    context.fillStyle = "#FAFAFA";
    context.fillRect(0, 0, width, height);

    // instructions and info
    context.font = '2em sans-serif';
    context.fillStyle = 'black';
    context.fillText('click the chicken', 20, 50);

    // draw eggs
    for (let i = 0; i < eggs.length; i += 1) {
        const egg = eggs[i];
        context.drawImage(eiImage, egg.coords.x - eiImage.naturalWidth / 2, egg.coords.y - eiImage.naturalHeight / 2);
    }

    // draw chickens
    for (let i = 0; i < chickens.length; i += 1) {
        const chicken = chickens[i];
        context.drawImage(huhnImage, chicken.coords.x - huhnImage.naturalWidth / 2, chicken.coords.y - huhnImage.naturalHeight / 2);
    }

}

