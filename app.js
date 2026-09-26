// 1. SCENE & CAMERA SETUP
const viewport = document.getElementById('viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
viewport.appendChild(renderer.domElement);

// Camera Controls (Orbiting)
const orbit = new THREE.OrbitControls(camera, renderer.domElement);
orbit.target.set(0, 3, 0);
orbit.update();

// Grid & Light
scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x222222));
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// 2. EDITOR TOOLS (Transform & Selection)
let selectedObject = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// The 3D Gizmo (Arrows to move/rotate)
const transformControl = new THREE.TransformControls(camera, renderer.domElement);
transformControl.addEventListener('dragging-changed', function (event) {
    orbit.enabled = !event.value; // Disable camera orbit when dragging the gizmo
});
scene.add(transformControl);

// Select Objects by Clicking
viewport.addEventListener('pointerdown', (event) => {
    // Calculate mouse position in 3D space
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    let clickedMesh = null;
    for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.userData.selectable) {
            clickedMesh = intersects[i].object;
            break;
        }
    }

    if (clickedMesh) {
        // We select the GROUP (the pivot point), not just the mesh block
        selectedObject = clickedMesh.parent; 
        transformControl.attach(selectedObject);
        document.getElementById('selected-text').innerText = "Selected: " + selectedObject.userData.name;
    } else if (!transformControl.dragging) {
        // Clicked empty space
        transformControl.detach();
        selectedObject = null;
        document.getElementById('selected-text').innerText = "Selected: None";
    }
});

// Tool Buttons
document.getElementById('tool-translate').onclick = () => transformControl.setMode('translate');
document.getElementById('tool-rotate').onclick = () => transformControl.setMode('rotate');

// Keyboard shortcuts for tools
window.addEventListener('keydown', (e) => {
    if(e.key === 't') transformControl.setMode('translate');
    if(e.key === 'r') transformControl.setMode('rotate');
});

// 3. R6 RIG AND PROPS
let rightArmGroup = null; // Store reference for welding
let spawnedSword = null;

function createLimb(name, width, height, depth, color, x, y, z, pivotY) {
    const group = new THREE.Group(); 
    group.userData.name = name;
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = pivotY; 
    mesh.userData.selectable = true; // Tag for raycaster

    group.add(mesh);
    group.position.set(x, y, z);
    return group;
}

document.getElementById('add-r6').onclick = () => {
    const r6 = new THREE.Group();
    const torsoMat = 0x0055ff, limbMat = 0xaaaaaa, headMat = 0xffff00;

    const torso = createLimb("Torso", 2, 2, 1, torsoMat, 0, 4, 0, 0);
    const head = createLimb("Head", 1.2, 1.2, 1.2, headMat, 0, 1.6, 0, 0);
    rightArmGroup = createLimb("Right Arm", 1, 2, 1, limbMat, -1.5, 1, 0, -1);
    const leftArm = createLimb("Left Arm", 1, 2, 1, limbMat, 1.5, 1, 0, -1);
    const rightLeg = createLimb("Right Leg", 1, 2, 1, limbMat, -0.5, -1, 0, -1);
    const leftLeg = createLimb("Left Leg", 1, 2, 1, limbMat, 0.5, -1, 0, -1);

    torso.add(head, rightArmGroup, leftArm, rightLeg, leftLeg);
    scene.add(torso);
};

document.getElementById('add-prop').onclick = () => {
    spawnedSword = createLimb("Sword", 0.2, 2.5, 0.2, 0xff0000, 3, 2, 0, 0);
    scene.add(spawnedSword);
};

// 4. THE WELDER
document.getElementById('weld-btn').onclick = () => {
    if (spawnedSword && rightArmGroup) {
        // Remove from scene, add to right arm
        scene.remove(spawnedSword);
        rightArmGroup.add(spawnedSword);
        
        // Position it nicely in the hand
        spawnedSword.position.set(0, -1.5, -0.5);
        spawnedSword.rotation.x = Math.PI / 2; // Point forward
        alert("Sword Welded! Now try rotating the Right Arm using the 'R' key.");
    } else {
        alert("Please spawn both the R6 Rig and the Sword first!");
    }
};

// 5. RENDER LOOP
window.addEventListener('resize', () => {
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
