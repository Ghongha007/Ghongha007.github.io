function initScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x002147);
    scene.fog = new THREE.Fog(0xFFFFFF, 5, 30);
    return scene;
}

function initCamera() {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, 5);
    return camera;
}

function initRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.position = 'absolute'; // Position the canvas
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '1'; // Ensure it's above the Vanta.js background
    document.body.appendChild(renderer.domElement);
    return renderer;
}

function initLights(scene) {
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    directionalLight.position.set(5, 5, 5).normalize();
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const spotLight1 = new THREE.SpotLight(0xFFFFE0, 0.5);
    spotLight1.position.set(0, 5, 0);
    spotLight1.target.position.set(0, 0, 0);
    spotLight1.castShadow = true;
    spotLight1.angle = Math.PI / 2;
    spotLight1.penumbra = 0.1;
    spotLight1.decay = 2;
    scene.add(spotLight1);
    scene.add(spotLight1.target);

}
  
function loadModel(url) {
    return new Promise((resolve, reject) => {
        const loader = new THREE.GLTFLoader();
        loader.load(url, (gltf) => {
            resolve(gltf.scene);
        }, undefined, (error) => {
            reject(error);
        });
    });
}

function createFireflies(count, radius) {
    const fireflies = [];
    const fireflyGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const fireflyMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFF00,
        emissive: 0xFFFF00,
        emissiveIntensity: 1.0,
        shininess: 30
    });

    for (let i = 0; i < count; i++) {
        const firefly = new THREE.Mesh(fireflyGeometry, fireflyMaterial);
        const angle = Math.random() * Math.PI * 2;
        firefly.position.set(
            Math.cos(angle) * radius,
            Math.random() * 2,
            Math.sin(angle) * radius
        );

        const pointLight = new THREE.PointLight(0xFFFF00, Math.random() * 0.5 + 0.5, 2);
        pointLight.position.copy(firefly.position);
        firefly.add(pointLight);
        fireflies.push(firefly);
    }
    return fireflies;
}

function animateFireflies(fireflies) {
    const baseSpeed = 0.0001;
    fireflies.forEach((firefly, index) => {
        const angle = Date.now() * baseSpeed + index * 0.1;
        const radius = 2;

        firefly.position.x = Math.cos(angle) * radius;
        firefly.position.z = Math.sin(angle) * radius;
        firefly.position.y = Math.sin(Date.now() * 0.001 + index) * 0.5;
    });
}

function createSnowflakes(count) {
    const snowflakes = [];
    const snowflakeGeometry = new THREE.SphereGeometry(0.2, 20, 20); // Increase size
    const snowflakeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.5 });

    for (let i = 0; i < count; i++) {
        const snowflake = new THREE.Mesh(snowflakeGeometry, snowflakeMaterial);
        snowflake.position.set(
            Math.random() * 20 - 10, // Random X position
            Math.random() * 10 + 5,  // Random Y position (above the scene)
            Math.random() * 20 - 10  // Random Z position
        );
        snowflake.scale.setScalar(0.05); // Random size
        snowflakes.push(snowflake);
    }
    return snowflakes;
}

function addBlackLightning(scene) {
    const blackLight = new THREE.PointLight(0x3300FF, 5, 50); // Use a dark blue/purple color for black light effect
    blackLight.position.set(0, 10, 0); // Position the light above the scene
    scene.add(blackLight);

    // Function to flash the black light
    function flashBlackLightning() {
        blackLight.intensity = Math.random() * 5; // Random intensity for a flickering effect
        setTimeout(flashBlackLightning, Math.random() * 500); // Random delay between flashes
    }

    flashBlackLightning(); // Start the black lightning effect
}

let munchkinCat; // Declare the Munchkin Cat globally
let raycaster = new THREE.Raycaster(); // Raycaster for mouse interaction
let mouse = new THREE.Vector2(); // Store mouse position

async function main() {
    const scene = initScene();
    const camera = initCamera();
    const renderer = initRenderer();
    initLights(scene);

    const listener = new THREE.AudioListener();
    camera.add(listener);

    // Load the audio file
    const audioLoader = new THREE.AudioLoader();
    const audio = new THREE.Audio(listener);

    audioLoader.load('audio/AFTERDARK.mp3', (buffer) => {
        audio.setBuffer(buffer);
        audio.setLoop(true);
        audio.setVolume(1.0);
        audio.play();
    });

    // Add black lightning effect
    addBlackLightning(scene);

    const model1 = await loadModel('models/halloween_haunted_house.glb');

     // Change the position and size of the model
    model1.position.set(0, -1, -1); // Set the position (x, y, z)
    model1.scale.set(0.1, 0.1, 0.1); // Set the scale (x, y, z)
    scene.add(model1);

    // Create the shiny sphere
    const shinySphere = createShinySphere();
    shinySphere.position.set(0, 4, -1); // Position the sphere above model1
    scene.add(shinySphere);

    // Load the second model and add it to the scene
    const model2 = await loadModel('models/cute_spooky_cat.glb'); // Replace with your second model's URL
    model2.position.set(0, 2.5, -2); // Set the position for the second model
    model2.scale.set(2.5, 2.5, 2.5); // Set the scale for the second model
    model2.rotation.y = Math.PI;
    // Animate the balloon
    //model2.position.y = 1 + Math.sin(Date.now() * 0.002) * 0.2; // Bobbing effect
    //model2.scale.set(1 + Math.sin(Date.now() * 0.005) * 0.1, 1 + Math.sin(Date.now() * 0.005) * 0.1, 1); // Inflate/deflate effect
    scene.add(model2);

    // Load the Munchkin Cat model
    const munchkinCat = await loadModel('models/munchkin_cat.glb'); // Replace with the correct path
    munchkinCat.position.set(-4, -1, -1); // Position the cat on the floor of model1
    munchkinCat.scale.set(2, 2, 2); // Adjust the scale as needed
    munchkinCat.rotation.y = Math.PI/4;
    scene.add(munchkinCat);

    // Track mouse movement
    window.addEventListener('mousemove', onMouseMove);

    // Load the character model
    const character = await loadModel('models/character.glb'); // Replace with your character model's path

    // Adjust the character's position, scale, and rotation
    character.position.set(-5, -1, -1); // Set the position (x, y, z)
    character.scale.set(2, 2, 2); // Set the scale (x, y, z)
    character.rotation.y = Math.PI/4; // Rotate the character to face the laptop
    character.rotation.x = 0; // Ensure no rotation on the x-axis
    character.rotation.z = 0; // Ensure no rotation on the z-axis


    // Add the character to the scene
    scene.add(character);

    // Load the oiai cat model
    const oiaiCat = await loadModel('models/oiai_cat.glb'); // Replace with the correct path
    oiaiCat.position.set(6, 2, -1); // Position the cat opposite to the character
    oiaiCat.scale.set(3, 3, 3); // Adjust the scale as needed
    oiaiCat.rotation.y += Math.PI; // Rotate the cat to face the center
    scene.add(oiaiCat);

    // Load the Maxwell model
    const maxwell = await loadModel('models/maxwell.glb'); // Replace with the correct path
    maxwell.position.set(4, -1, -1); // Set the initial position
    maxwell.scale.set(0.05, 0.05, 0.05); // Adjust the scale as needed
    maxwell.rotation.y = 11; // Rotate the cat to face the center
    scene.add(maxwell);

    // Load the Nyan Cat model
    const nyanCat = await loadModel('models/nyan_cat.glb'); // Replace with the correct path
    nyanCat.position.set(6, 0, -1); // Set the initial position
    nyanCat.scale.set(2, 2, 2); // Adjust the scale as needed
    //nyanCat.rotation.y += Math.PI;
    scene.add(nyanCat);

    // Traverse each model to apply any necessary settings to its meshes
    [model1, model2, munchkinCat, character, oiaiCat, maxwell, nyanCat].forEach((model) => {
      model.traverse((child) => {
         if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
         }
      });
    });

    character.traverse((child) => {
        if (child.isBone || child.isMesh) {
            console.log(child.name); // Log the name of bones/meshes

                        // Adjust arm bones/meshes to bend them
            if (child.name.includes('Arm') || child.name.includes('arm')) {
                // Example: Bend the arms at the elbow
                const bendDegrees = 45; // Desired bend angle in degrees
                const bendRadians = THREE.MathUtils.degToRad(bendDegrees); // Convert to radians

                // Adjust rotation to bend the arm
                child.rotation.x = bendRadians; // Bend along the X-axis (elbow)
            }

        }
    });

    // Add the character to the scene
    scene.add(character);

    // Function to generate a random target position
function getRandomTarget() {
    return new THREE.Vector3(
        Math.random() * 20 - 10, // Random X position
        Math.random() * 10 - 5,  // Random Y position
        Math.random() * 20 - 10  // Random Z position
    );
}

function animateNyanCat() {
    const speed = 0.05; // Adjust the speed as needed

    // Move Nyan Cat along the X-axis
    nyanCat.position.x += speed;

    // Reset position when it reaches the right end of the screen
    if (nyanCat.position.x > 10) {
        nyanCat.position.x = -10; // Reset to the left end
    }
}

    const uvMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0x3300FF, // Emissive color matches the black light
        emissiveIntensity: 1.0
    });

    function createShinySphere() {
        const sphereGeometry = new THREE.SphereGeometry(0.4, 32, 32); // Adjust the size of the sphere
        const sphereMaterial = new THREE.MeshStandardMaterial({
            color: 0x3300FF, // Initial color
            metalness: 1.0, // Make the sphere metallic
            roughness: 0.1, // Make the sphere shiny
            emissive: 0x000000, // No emissive color
            emissiveIntensity: 0
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        return sphere;
    }

    // Create fireflies and add them to the scene
    const fireflies = createFireflies(100, 2); // Create 100 fireflies
    fireflies.forEach(firefly => scene.add(firefly));

    function checkCollision(firefly, model) {
        // Get the bounding boxes of the firefly and model1
        const fireflyBox = new THREE.Box3().setFromObject(firefly);
        const modelBox = new THREE.Box3().setFromObject(model);
    
        // Check if the firefly's bounding box intersects with model1's bounding box
        return fireflyBox.intersectsBox(modelBox);
    }
    
    function animateFireflies(fireflies, model1) {
        const baseSpeed = 0.0001;
        fireflies.forEach((firefly, index) => {
            const angle = Date.now() * baseSpeed + index * 0.1;
            const radius = 2;
    
            // Update firefly position
            firefly.position.x = Math.cos(angle) * radius;
            firefly.position.z = Math.sin(angle) * radius;
            firefly.position.y = Math.sin(Date.now() * 0.001 + index) * 0.5;
    
            // Check for collision with model1
            if (checkCollision(firefly, model1)) {
                // If a collision is detected, change the firefly's position
                firefly.position.y += 1; // Move the firefly up to avoid collision
            }
        });
    }

    // Create snowflakes and add them to the scene
    const snowflakes = createSnowflakes(150); // Adjust the number of snowflakes
    snowflakes.forEach(snowflake => scene.add(snowflake));

    const snowflakeMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.5,
        metalness: 0,
        roughness: 0
    });

    function animateSnowflakes(snowflakes) {
        snowflakes.forEach((snowflake) => {
            snowflake.position.y -= 0.03; // Fall speed
            if (snowflake.position.y < -3) {
                snowflake.position.y = Math.random() * 10 + 5; // Reset to top
                snowflake.position.x = Math.random() * 20 - 10; // Random X position
                snowflake.position.z = Math.random() * 20 - 10; // Random Z position
            }
        });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);

    });

    const smoothingFactor = 0.1; // Adjust this value for smoother or faster transitions

    // Track mouse movement and calculate rotation
    function onMouseMove(event) {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Calculate rotation based on mouse position
    const rotationSpeed = 1.0; // Adjust the rotation speed as needed
    model1.rotation.y = mouse.x * Math.PI * rotationSpeed; // Rotate around the Y-axis based on horizontal mouse movement
    //model1.rotation.x = mouse.y * Math.PI; // Rotate around the X-axis based on vertical mouse movement
}

    function positionChatBox() {
    if (!munchkinCat) return;

    // Get the Munchkin Cat's position in world coordinates
    const worldPosition = new THREE.Vector3();
    munchkinCat.getWorldPosition(worldPosition);

    // Convert the world position to screen coordinates
    const screenPosition = worldPosition.clone().project(camera);

    // Convert normalized device coordinates to screen coordinates
    const x = (screenPosition.x + 1) / 2 * window.innerWidth;
    const y = (-screenPosition.y + 1) / 2 * window.innerHeight;

    // Position the chat box above the Munchkin Cat
    const chatBox = document.getElementById('chatBox');
    chatBox.style.left = `${x}px`;
    chatBox.style.top = `${y - 100}px`; // Adjust the offset as needed
}

    // Animation loop
    function animate() {
        requestAnimationFrame(animate); // Request the next frame

        // Animate the oiai cat (optional)
        if (oiaiCat) {
            oiaiCat.rotation.y += 0.1; // Rotate the cat
        }

        // Animate Nyan Cat
        animateNyanCat();

        // Animate the shiny sphere
    if (shinySphere) {
        const time = Date.now() * 0.001; // Get the current time in seconds

        // Change the sphere's color over time
        const hue = (time * 0.1) % 1; // Cycle through hues
        shinySphere.material.color.setHSL(hue, 1.0, 0.5); // Set the color using HSL

        // Bobbing motion
        shinySphere.position.y = 4 + Math.sin(time * 2) * 0.2; // Bobbing motion centered at y = 4
        shinySphere.position.x = Math.sin(time) * 0.5; // Swaying motion
    }

        // Bobbing motion for Maxwell
    if (maxwell) {
        const time = Date.now() * 0.001; // Get the current time in seconds
        maxwell.position.y = Math.sin(time * 2) * 0.2; // Bobbing motion
    }

         // Update the chat box position
        positionChatBox();

        // Bobbing motion for the Munchkin Cat
    if (munchkinCat) {
        munchkinCat.position.y = -1 + Math.sin(Date.now() * 0.002) * 0.2; // Adjust the amplitude and speed
    }

        // Make the Munchkin Cat look at the mouse cursor
        lookAtMouseCursor();

        // Animate fireflies
        animateFireflies(fireflies, model1);

        // Animate snowflakes
        animateSnowflakes(snowflakes);

        // Rotate model1
        model1.rotation.y += 0.01; // Adjust the rotation speed as needed

        // Rotate model2
        model2.rotation.x -= 0.03;

        // Animate the character (e.g., rotate or move)
        //character.rotation.y += 0.01; // Example: Rotate the character

        // Render the scene
        renderer.render(scene, camera);
    }

    animate(); // Start the animation loop
}

    // Make the Munchkin Cat look at the mouse cursor
    function lookAtMouseCursor() {
    if (!munchkinCat) return; // Ensure the Munchkin Cat is loaded

    // Update the raycaster with the mouse position and camera
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with the Munchkin Cat
    const intersects = raycaster.intersectObject(munchkinCat, true);

    if (intersects.length > 0) {
        // Toggle the visibility of the chat box
        const chatBox = document.getElementById('chatBox');
        chatBox.style.display = chatBox.style.display === 'none' ? 'block' : 'none';
    }
}


// Start the main function
main().catch(error => console.error('Error loading the model:', error));


