import { Pond, init } from "ripples";
import { memory } from "ripples/ripples_bg"

init();

const HEIGHT = 1000;
const WIDTH = 1000;

// Scales by 0.6, but reduces floating point ops in a tight loop
const GLOBAL_ALPHA_SCALE_NUMER = 3;
const GLOBAL_ALPHA_SCALE_DENOM = 5;

const pond = Pond.new(WIDTH, HEIGHT);
const canvas = document.getElementById("pond-canvas");
canvas.height = HEIGHT;
canvas.width = WIDTH;

const ctx = canvas.getContext("2d");

const renderLoop = () => {
    pond.tick();
    drawPond();
    requestAnimationFrame(renderLoop);
};

let currColor = 0x08FF; // TODO lift state
let currMagnitude = 200;
let currFreq = 50;

let mouseDown = false;
const addDroplet = (e) => {
    if (mouseDown) {
        currColor = Math.trunc(Math.random() * 0xFFFFFF);
        currFreq = Math.random() * 50 + 20;
        currMagnitude = Math.random() * 200 + 100;
        pond.add_droplet(e.offsetX, e.offsetY, currMagnitude, currColor, currFreq);
    }
};

const drawPond = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const ptrs = [
        pond.ripple_xs(),
        pond.ripple_ys(),
        pond.ripple_mags(),
        pond.ripple_max_mags(),
        pond.ripple_colors(),
    ];
    const rippleCount = pond.ripple_count();
    const [xs, ys, mags, max_mags, colors] = ptrs.map(ptr => new Uint32Array(memory.buffer, ptr, rippleCount));
    for (let i = 0; i < xs.length; i++) {
        let color = (colors[i] & 0xFFFFFF);
        let r = (color >> 16) & 0xFF;
        let g = (color >> 8) & 0xFF;
        let b = color & 0xFF;
        let max_mag = max_mags[i];
        // We scale by integers rather than a floating point scalar for efficiency
        let a = ((max_mag - mags[i]) * GLOBAL_ALPHA_SCALE_NUMER) / (max_mag * GLOBAL_ALPHA_SCALE_DENOM);
        let colorStr = `rgba(${r},${g},${b},${a})`;
        ctx.fillStyle = colorStr;
        ctx.beginPath();
        ctx.arc(
            xs[i],
            ys[i],
            mags[i],
            0,
            2 * Math.PI,
            false
        );
        ctx.fill();
    }
};

canvas.addEventListener("mousedown", (e) => mouseDown = e.button === 0);
canvas.addEventListener("mousemove", addDroplet);
canvas.addEventListener("mouseup", (e) => mouseDown = mouseDown & !(e.button === 0));

drawPond();
requestAnimationFrame(renderLoop);