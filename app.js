// 1. SCENE SETUP
const viewport = document.getElementById('viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

const camera = new THREE.PerspectiveCamera(75, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
viewport.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 3, 0);
controls.update();

// Grid and Lighting
const gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
});

// 2. R6 RIG BUILDER (With correct joint pivots)
function createLimb(width, height, depth, color, x, y, z, pivotY) {
    const group = new THREE.Group(); // The joint/pivot point
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Offset the mesh so the group acts as a pivot at the top (shoulders/hips)
    mesh.position.y = pivotY; 
    group.add(mesh);
    group.position.set(x, y, z);
    
    return group;
}

function spawnR6() {
    const r6 = new THREE.Group();
    
    // Proportions similar to Roblox (Width, Height, Depth)
    const torsoMat = 0x0055ff; // Blue
    const limbMat = 0xaaaaaa;  // Grey
    const headMat = 0xffff00;  // Yellow

    // Torso: 2 x 2 x 1. Center of the body.
    const torsoGeo = new THREE.BoxGeometry(2, 2, 1);
    const torso = new THREE.Mesh(torsoGeo, new THREE.MeshStandardMaterial({color: torsoMat}));
    torso.position.y = 4; // Elevate from floor
    r6.add(torso);

    // Head: 1.2 x 1.2 x 1.2
    const head = createLimb(1.2, 1.2, 1.2, headMat, 0, 1.6, 0, 0); // Pivot at neck
    torso.add(head);

    // Right Arm: 1 x 2 x 1 (Pivot at shoulder)
    const rightArm = createLimb(1, 2, 1, limbMat, -1.5, 1, 0, -1);
    torso.add(rightArm);

    // Left Arm: 1 x 2 x 1
    const leftArm = createLimb(1, 2, 1, limbMat, 1.5, 1, 0, -1);
    torso.add(leftArm);

    // Right Leg: 1 x 2 x 1 (Pivot at hips)
    const rightLeg = createLimb(1, 2, 1, limbMat, -0.5, -1, 0, -1);
    torso.add(rightLeg);

    // Left Leg: 1 x 2 x 1
    const leftLeg = createLimb(1, 2, 1, limbMat, 0.5, -1, 0, -1);
    torso.add(leftLeg);

    scene.add(r6);
    
    // Add to hierarchy UI
    document.getElementById('hierarchy').innerHTML += `<li>R6_Character</li>`;

    // Demo Animation: Make it walk
    animateR6(leftArm, rightArm, leftLeg, rightLeg);
}

function animateR6(la, ra, ll, rl) {
    let time = 0;
    function walkCycle() {
        time += 0.05;
        // Sine wave math for walking motion
        la.rotation.x = Math.sin(time) * 0.5;
        ra.rotation.x = Math.sin(time + Math.PI) * 0.5; // Opposite phase
        ll.rotation.x = Math.sin(time + Math.PI) * 0.5;
        rl.rotation.x = Math.sin(time) * 0.5;
        requestAnimationFrame(walkCycle);
    }
    walkCycle();
}

// 3. UI BUTTON LOGIC
document.getElementById('add-r6').addEventListener('click', spawnR6);

document.getElementById('add-prop').addEventListener('click', () => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({color: Math.random() * 0xffffff});
    const prop = new THREE.Mesh(geo, mat);
    prop.position.set(Math.random()*4-2, 0.5, Math.random()*4-2);
    scene.add(prop);
    document.getElementById('hierarchy').innerHTML += `<li>Prop_${scene.children.length}</li>`;
});

// 4. MAIN RENDER LOOP
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
