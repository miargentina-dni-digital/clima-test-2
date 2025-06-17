const sun = document.querySelector('.sun');

let lastX, lastY;
let bgX = 50; // %
let bgY = 50; // %

function mod(n, m) {
    return ((n % m) + m) % m;
}

function updateBackground(dx, dy) {
    // Invertir movimiento: dx negativo para movimiento positivo, etc.
    bgX = mod(bgX - dx * 0.3, 100); // Invertido
    bgY = mod(bgY - dy * 0.3, 100); // Invertido
    sun.style.setProperty('--bg-x', `${bgX}%`);
    sun.style.setProperty('--bg-y', `${bgY}%`);
}

// Touch
sun.addEventListener('touchstart', function(e) {
    const touch = e.touches[0];
    lastX = touch.clientX;
    lastY = touch.clientY;
});
sun.addEventListener('touchmove', function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - lastX;
    const dy = touch.clientY - lastY;
    lastX = touch.clientX;
    lastY = touch.clientY;
    updateBackground(dx, dy);
}, { passive: false });

// Mouse (para escritorio)
sun.addEventListener('mousedown', function(e) {
    lastX = e.clientX;
    lastY = e.clientY;
    function onMove(ev) {
        const dx = ev.clientX - lastX;
        const dy = ev.clientY - lastY;
        lastX = ev.clientX;
        lastY = ev.clientY;
        updateBackground(dx, dy);
    }
    function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
});




