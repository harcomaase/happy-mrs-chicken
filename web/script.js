
const canvas = document.getElementById('canvas');

const root = document.getElementsByTagName('html')[0];
let width = root.clientWidth;
let height = root.clientHeight;

canvas.width = width;
canvas.height = height;

const context = canvas.getContext("2d");

//TODO: pre-load images before drawing
const huhnImage = new Image();
huhnImage.src = 'huhn.png';

init();

function init() {
    context.fillStyle = "#FAFAFA";
    context.fillRect(0, 0, width, height);

    context.drawImage(huhnImage, 200, 100);

    // add some first game-like feature: spawn chicken on touch or click or key
    canvas.addEventListener(
        "touchstart",
        (e) => {
            console.log('touch');
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                handleTapEvent(touch.clientX, touch.clientY);
            }
        }, false,
    );
    canvas.addEventListener(
        "mousedown",
        (e) => {
            console.log('click');
            handleTapEvent(e.clientX, e.clientY);
        }, false
    );
    canvas.addEventListener(
        "keyup",
        (e) => {
            console.log('key: ' + e.key);
            const x = Math.random() * width;
            const y = Math.random() * height;
            handleTapEvent(x, y);
        }, false,
    );
}

function handleTapEvent(eventX, eventY) {
    console.log('handling event with coords: ' + eventX + '|' + eventY);

    drawChicken(eventX, eventY);
}

function drawChicken(eventX, eventY) {
    const x = eventX - huhnImage.naturalWidth / 2;
    const y = eventY - huhnImage.naturalHeight / 2;
    context.drawImage(huhnImage, x, y);
}
