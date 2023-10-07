registerServiceWorker();

const canvas = document.getElementById('canvas');

const root = document.getElementsByTagName('html')[0];
let width = root.clientWidth;
let height = root.clientHeight;
//TODO: add listener for page size changes

canvas.width = width;
canvas.height = height;
const context = canvas.getContext("2d");

class Chicken {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

const chickens = [];
chickens.push(new Chicken(width / 2, height / 2));

let previousTimestamp = Date.now();

//TODO: pre-load images before drawing
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
    // add some first game-like feature: spawn chicken on touch or click or key
    //
    // seems like touch events always also generate a mousedown event, so we
    // don't need the touch event
    //canvas.addEventListener(
    //    "touchstart",
    //    (e) => {
    //        console.log('touch');
    //        if (e.touches.length > 0) {
    //            const touch = e.touches[0];
    //            handleTapEvent(touch.clientX, touch.clientY);
    //        }
    //    }, false,
    //);
    canvas.addEventListener(
        "mousedown",
        (e) => {
            handleTapEvent(e.clientX, e.clientY);
        }, false
    );
    canvas.addEventListener(
        "keyup",
        (e) => {
            console.log(`key: ${e.key}`);
            const x = Math.random() * width;
            const y = Math.random() * height;
            handleTapEvent(x, y);
        }, false,
    );

    window.requestAnimationFrame(gameLoop);
}

function handleTapEvent(eventX, eventY) {
    //console.log(`handling event with coords: ${eventX}|${eventY}`);

    addChicken(eventX, eventY);
}

function addChicken(eventX, eventY) {
    chickens.push(new Chicken(eventX, eventY));
    if (chickens.length > 25) {
        chickens.shift();
    }
}

function gameLoop(timestamp) {
    const elapsed = timestamp - previousTimestamp;
    previousTimestamp = timestamp;

    // clear screen
    context.fillStyle = "#FAFAFA";
    context.fillRect(0, 0, width, height);

    for (let i = 0; i < chickens.length; i += 1) {
        const chicken = chickens[i];
        context.drawImage(huhnImage, chicken.x - huhnImage.naturalWidth / 2, chicken.y - huhnImage.naturalHeight / 2);
    }

    window.requestAnimationFrame(gameLoop);
}

