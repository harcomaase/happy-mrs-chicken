registerServiceWorker();

const canvas = document.getElementById('canvas');

const root = document.getElementsByTagName('html')[0];
let width = root.clientWidth;
let height = root.clientHeight;
//TODO: add listener for page size changes

canvas.width = width;
canvas.height = height;
const context = canvas.getContext("2d");

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Chicken {
    constructor(coords) {
        this.coords = coords;
        this.dest = new Point(Math.random() * width, Math.random() * height);
        this.v = 200;
    }
}

const chickens = [];
chickens.push(new Chicken(new Point(width / 2, height / 2)));

let previousTimestamp = 0;

//TODO: pre-load images before drawing (use window.onload?)
const huhnImage = new Image();
huhnImage.onload = function() {
    init();
}
huhnImage.src = 'huhn.png';

function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("serviceworker.js")
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

    window.requestAnimationFrame(gameLoop);
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
            chickens.splice(i, 1);
            for (let j = 0; j < 2; j += 1) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                addChicken(x, y);
            }
            break;
        }
    }

}

function addChicken(x, y) {
    chickens.push(new Chicken(new Point(x, y)));
    if (chickens.length > 25) {
        chickens.shift();
    }
}

function gameLoop(timestamp) {
    const elapsed = (timestamp - previousTimestamp) / 1000;
    previousTimestamp = timestamp;

    // calculate chicken movement
    for (let i = 0; i < chickens.length; i += 1) {
        const chicken = chickens[i];

        const dx = chicken.dest.x - chicken.coords.x;
        const dy = chicken.dest.y - chicken.coords.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        chicken.coords.x += dx / length * chicken.v * elapsed;
        chicken.coords.y += dy / length * chicken.v * elapsed;

        // check if chicken has reached destination
        if (Math.abs(dx) + Math.abs(dy) < 20) {
            chicken.dest.x = Math.random() * width;
            chicken.dest.y = Math.random() * height;
        }
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

    // draw chickens
    for (let i = 0; i < chickens.length; i += 1) {
        const chicken = chickens[i];
        context.drawImage(huhnImage, chicken.coords.x - huhnImage.naturalWidth / 2, chicken.coords.y - huhnImage.naturalHeight / 2);
    }

}

