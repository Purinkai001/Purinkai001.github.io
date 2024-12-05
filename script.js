// Torus parameters
const thetaSpacing = 0.07; // Controls resolution of cross-section
const phiSpacing = 0.02;   // Controls resolution of torus revolution
const R1 = 1;              // Radius of cross-section
const R2 = 2;              // Radius of revolution
const K2 = 5;              // Distance from viewer
let K1;                    // Projection scaling factor

// Rotation angles influenced by scroll
let A = 0, B = 0;

// Canvas setup
const canvas = document.getElementById("torusCanvas");
const ctx = canvas.getContext("2d");

// Resize canvas to fit screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    K1 = canvas.width * K2 * 3 / (8 * (R1 + R2)); // Adjust scaling factor
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Smooth scrolling variables
let currentScroll = 0;
let targetScroll = 0;
const scrollSpeed = 0.1; // Adjust for smoother or faster scrolling

// Render frame
function renderFrame() {
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Precompute sines and cosines of A and B
    const cosA = Math.cos(A), sinA = Math.sin(A);
    const cosB = Math.cos(B), sinB = Math.sin(B);

    // Initialize Z-buffer
    const zbuffer = Array(width * height).fill(0);

    // Loop over theta (cross-section of torus)
    for (let theta = 0; theta < 2 * Math.PI; theta += thetaSpacing) {
        const costheta = Math.cos(theta), sintheta = Math.sin(theta);

        // Loop over phi (revolution around center of torus)
        for (let phi = 0; phi < 2 * Math.PI; phi += phiSpacing) {
            const cosphi = Math.cos(phi), sinphi = Math.sin(phi);

            // Circle's position before revolution
            const circlex = R2 + R1 * costheta; // X position of cross-section
            const circley = R1 * sintheta;     // Y position of cross-section

            // 3D coordinates after rotation
            const x = circlex * (cosB * cosphi + sinA * sinB * sinphi) - circley * cosA * sinB;
            const y = circlex * (sinB * cosphi - sinA * cosB * sinphi) + circley * cosA * cosB;
            const z = K2 + cosA * circlex * sinphi + circley * sinA;
            const ooz = 1 / z; // "One over z" for depth calculation

            // 2D projection
            const xp = Math.floor(width / 2 + K1 * ooz * x);
            const yp = Math.floor(height / 2 - K1 * ooz * y);

            // Luminance calculation
            const L = cosphi * costheta * sinB - cosA * costheta * sinphi - sinA * sintheta +
                      cosB * (cosA * sintheta - costheta * sinA * sinphi);
            if (L > 0) { // Only render visible surfaces
                const idx = xp + yp * width;
                if (ooz > zbuffer[idx]) { // Z-buffer test
                    zbuffer[idx] = ooz;
                    const luminanceIndex = Math.floor(L * 8);
                    const colorIntensity = Math.floor(255 * (luminanceIndex / 11));
                    ctx.fillStyle = `rgb(${colorIntensity}, ${colorIntensity}, ${colorIntensity})`;
                    ctx.fillRect(xp, yp, 1, 1); // Draw pixel
                }
            }
        }
    }
}

// Smooth scrolling animation loop
function animate() {
    // Ease towards the target scroll position
    currentScroll += (targetScroll - currentScroll) * scrollSpeed;

    // Map scroll position to rotation angles
    A = (currentScroll / 200) % (2 * Math.PI); // Adjust divisor for sensitivity
    B = (currentScroll / 300) % (2 * Math.PI); // Adjust divisor for sensitivity

    renderFrame();
    requestAnimationFrame(animate);
}

// Listen for scroll and update target scroll position
document.addEventListener("scroll", () => {
    targetScroll = window.scrollY; // Update target scroll position
});

// Start animation loop
animate();




/////////////////////////////////////////////////////////////




