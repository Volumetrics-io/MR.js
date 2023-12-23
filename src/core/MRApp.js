import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { ClearPass } from 'three/addons/postprocessing/ClearPass.js';
import { MaskPass } from 'three/addons/postprocessing/MaskPass.js';

// import { OutPass } from 'three/addons/postprocessing/OutPass.js';
// import { ClearMaskPass } from 'three/addons/postprocessing/ClearMaskPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';




import { ARButton } from 'three/addons/webxr/ARButton.js';

import Stats from 'stats.js';

import { MRElement } from 'mrjs/core/MRElement';

import { mrjsUtils } from 'mrjs';

import { MREntity } from 'mrjs/core/MREntity';
import { MRSystem } from 'mrjs/core/MRSystem';
import { ClippingSystem } from 'mrjs/core/componentSystems/ClippingSystem';
import { ControlSystem } from 'mrjs/core/componentSystems/ControlSystem';
import { LayoutSystem } from 'mrjs/core/componentSystems/LayoutSystem';
import { MaskingSystem } from 'mrjs/core/componentSystems/MaskingSystem';
import { PhysicsSystem } from 'mrjs/core/componentSystems/PhysicsSystem';
import { SurfaceSystem } from 'mrjs/core/componentSystems/SurfaceSystem';
import { StyleSystem } from 'mrjs/core/componentSystems/StyleSystem';
import { TextSystem } from 'mrjs/core/componentSystems/TextSystem';

('use strict');
window.mobileCheck = function () {
    return mrjsUtils.Display.mobileCheckFunction();
};

// // Render target for texture1
// global.renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
// const myscene = new THREE.Scene();

// const torusGeometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
// const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
// const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
// // Torus material for rendering to texture
// const stencilRenderMaterial = new THREE.ShaderMaterial({
//     vertexShader: `
//         void main() {
//             gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//         }
//     `,
//     fragmentShader: `
//         void main() {
//             gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // Render white
//         }
//     `,
// });

// // Torus material
// const torusMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

// // Shader material for cube and sphere
// const shaderMaterialUniforms = {
//     texture1: { value: global.renderTarget.texture },
//     resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
// };

// const objectShaderMaterial = {
//     uniforms: shaderMaterialUniforms,
//     vertexShader: `
//         void main() {
//             vUv = uv;
//             gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//         }
//     `,
//     fragmentShader: `
//         uniform sampler2D texture1;
//         uniform vec2 resolution;

//         void main() {
//             vec4 textureColor = texture2D(texture1, gl_FragCoord.xy / resolution);
//             if (textureColor.r < 0.1) {
//                 discard;
//             } else {
//                 gl_FragColor = vec4(0, 0, 0, 1);
//             }
//         }
//     `
// };

// // Cube and sphere materials
// const cubeMaterial = new THREE.ShaderMaterial({
//     ...objectShaderMaterial,
//     fragmentShader: `
//         uniform sampler2D texture1;
//         uniform vec2 resolution;

//         void main() {
//             vec4 textureColor = texture2D(texture1, gl_FragCoord.xy / resolution);
//             if (textureColor.r < 0.1) {
//                 discard;
//             } else {
//                 gl_FragColor = vec4(1, 0, 0, 1); // Red color
//             }
//         }
//     `
// });

// const sphereMaterial = new THREE.ShaderMaterial({
//     ...objectShaderMaterial,
//     fragmentShader: `
//         uniform sampler2D texture1;
//         uniform vec2 resolution;

//         void main() {
//             vec4 textureColor = texture2D(texture1, gl_FragCoord.xy / resolution);
//             if (textureColor.r < 0.1) {
//                 discard;
//             } else {
//                 gl_FragColor = vec4(0, 0, 1, 1); // Blue color
//             }
//         }
//     `
// });

// const torus = new THREE.Mesh(torusGeometry, torusMaterial);
// const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
// const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

// // Positioning objects
// sphere.position.x = -1.5;
// cube.position.x = 1.5;

// // Adding objects to the scene
// myscene.add(torus, sphere, cube);

// // Debugging plane for texture1
// const planeGeometry = new THREE.PlaneGeometry(1, 1);
// const planeMaterial = new THREE.MeshBasicMaterial({ map: global.renderTarget.texture });
// const plane = new THREE.Mesh(planeGeometry, planeMaterial);
// plane.position.set(-2, 2, 0);
// myscene.add(plane);

///----------

/**
 * @class MRApp
 * @classdesc The engine handler for running MRjs as an App. `mr-app`
 * @augments MRElement
 */
export class MRApp extends MRElement {
    /**
     * @class
     * @description Constructs the base information of the app including system, camera, engine, xr, and rendering defaults.
     */
    constructor() {
        super();
        Object.defineProperty(this, 'isApp', {
            value: true,
            writable: false,
        });

        this.xrsupport = false;
        this.isMobile = window.mobileCheck(); // resolves true/false
        global.inXR = false;

        this.focusEntity = null;

        this.clock = new THREE.Clock();
        this.systems = new Set();
        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.session;

        this.lighting = {
            enabled: true,
            color: 0xffffff,
            intensity: 1,
            radius: 5,
            shadows: true,
        };

        this.cameraOptions = {
            camera: 'orthographic',
        };
        this.render = this.render.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

    }

    /**
     * @function Connected
     * @memberof MRApp
     * @description The connectedCallback function that runs whenever this entity component becomes connected to something else.
     */
    connectedCallback() {
        this.init();

        this.observer = new MutationObserver(this.mutationCallback);
        this.observer.observe(this, { attributes: true, childList: true });

        this.layoutSystem = new LayoutSystem();
        this.styleSystem = new StyleSystem();

        // initialize built in Systems
        document.addEventListener('engine-started', (event) => {
            this.physicsWorld = new mrjsUtils.Physics.RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
            this.physicsSystem = new PhysicsSystem();
            this.controlSystem = new ControlSystem();
            this.textSystem = new TextSystem();

            // these must be the last three systems since
            // they affect rendering. Clipping must happen
            // before masking. Rendering must be the last step.
            this.clippingSystem = new ClippingSystem();
            this.maskingSystem = new MaskingSystem();
            // this.renderSystem = new RenderSystem();
        });
    }

    /**
     * @function Disconnected
     * @memberof MRApp
     * @description The disconnectedCallback function that runs whenever this entity component becomes connected to something else.
     */
    disconnectedCallback() {
        this.denit();
        this.observer.disconnect();
    }

    // TODO: These are for toggling debug and app level flags in realtime.
    //       Currently only 'debug' is implemented. but we should add:
    //       - stats
    //       - lighting
    //       - controllers
    //       - ?
    /**
     * @function
     * @param {object} mutation - TODO
     */
    mutatedAttribute(mutation) {}

    /**
     * @function
     * @param {object} mutation - TODO
     */
    mutatedChildList(mutation) {}

    /**
     * @function
     * @description The mutationCallback function that runs whenever this entity component should be mutated.
     * @param {object} mutationList - the list of update/change/mutation(s) to be handled.
     * @param {object} observer - w3 standard object that watches for changes on the HTMLElement
     */
    mutationCallback = (mutationList, observer) => {
        for (const mutation of mutationList) {
            if (mutation.type === 'childList') {
                this.mutatedChildList(mutation);
            }
            if (mutation.type === 'attributes') {
                this.mutatedAttribute(mutation);
            }
        }
    };

    /**
     * @function
     * @description Initializes the engine state for the MRApp. This function is run whenever the MRApp is connected.
     */
    init() {
        this.debug = this.getAttribute('debug') ?? false;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.autoClear = false;
        this.renderer.shadowMap.enabled = true;
        this.renderer.xr.enabled = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.renderer.localClippingEnabled = true;

        this.cameraOptionString = this.getAttribute('camera');
        if (this.cameraOptionString) {
            this.cameraOptions = mrjsUtils.StringUtils.stringToJson(this.cameraOptionString);
        }

        this.initUser();
        mrjsUtils.Physics.initializePhysics();

        this.user.position.set(0, 0, 1);

        const layersString = this.getAttribute('layers');

        if (layersString) {
            this.layers = mrjsUtils.StringUtils.stringToVector(layersString);

            for (const layer of this.layers) {
                this.user.layers.enable(layer);
            }
        }

        if (this.debug) {
            this.stats = new Stats();
            this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            document.body.appendChild(this.stats.dom);

            const orbitControls = new OrbitControls(this.user, this.renderer.domElement);
            orbitControls.minDistance = 1;
            orbitControls.maxDistance = 2;
            orbitControls.enabled = false;

            document.addEventListener('keydown', (event) => {
                if (event.key == '=') {
                    orbitControls.enabled = true;
                }
            });

            document.addEventListener('keyup', (event) => {
                if (event.key == '=') {
                    orbitControls.enabled = false;
                }
            });
        }

        this.appendChild(this.renderer.domElement);

        navigator.xr?.isSessionSupported('immersive-ar').then((supported) => {
            this.xrsupport = supported;

            if (this.xrsupport) {
                this.ARButton = ARButton.createButton(this.renderer, {
                    requiredFeatures: ['hand-tracking'],
                    optionalFeatures: ['hit-test'],
                });

                this.ARButton.addEventListener('click', () => {
                    if (!this.surfaceSystem) {
                        this.surfaceSystem = new SurfaceSystem();
                    }
                    this.ARButton.blur();
                    global.inXR = true;
                    this.dispatchEvent(new CustomEvent('enterXR', { bubbles: true }));
                });
                document.body.appendChild(this.ARButton);

                this.ARButton.style.position = 'fixed';
                this.ARButton.style.zIndex = 10000;
            }
        });

        this.renderer.setAnimationLoop(this.render);

        window.addEventListener('resize', this.onWindowResize);

        const lightString = this.getAttribute('lighting');

        if (lightString) {
            this.lighting = mrjsUtils.StringUtils.stringToJson(this.lighting);
        }

        this.initLights(this.lighting);
    }

    /**
     * @function
     * @description Initializes the user information for the MRApp including appropriate HMD direction and camera information and the default scene anchor location.
     */
    initUser = () => {
        switch (this.cameraOptions.camera) {
            case 'orthographic':
                global.viewPortWidth = window.innerWidth / 1000;
                global.viewPortHeight = window.innerHeight / 1000;

                this.user = new THREE.OrthographicCamera(global.viewPortWidth / -2, global.viewPortWidth / 2, global.viewPortHeight / 2, global.viewPortHeight / -2, 0.01, 1000);
                break;
            case 'perspective':
            default:
                this.user = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
                this.vFOV = THREE.MathUtils.degToRad(this.user.fov);
                global.viewPortHeight = 2 * Math.tan(this.vFOV / 2);
                global.viewPortWidth = global.viewPortHeight * this.user.aspect;
                break;
        }

        // weird bug fix in getting camera position in webXR
        this.forward = new THREE.Object3D();
        this.user.add(this.forward);

        this.forward.position.setZ(-0.5);

        // for widnow placement
        this.anchor = new THREE.Object3D();
        this.user.add(this.anchor);

        this.anchor.position.setZ(-0.5);
    };

    /**
     * @function
     * @description Initializes default lighting and shadows for the main scene.
     * @param {object} data - the lights data (color, intensity, shadows, etc)
     */
    initLights = (data) => {
        if (!data.enabled) {
            return;
        }
        this.globalLight = new THREE.AmbientLight(data.color);
        this.globalLight.intensity = data.intensity;
        this.globalLight.position.set(0, 0, 0);
        this.scene.add(this.globalLight);

        if (!this.isMobile) {
            if (data.shadows) {
                this.shadowLight = new THREE.PointLight(data.color);
                this.shadowLight.position.set(0, 0, 0);
                this.shadowLight.intensity = data.intensity;
                this.shadowLight.castShadow = data.shadows;
                this.shadowLight.shadow.radius = data.radius;
                this.shadowLight.shadow.camera.near = 0.01; // default
                this.shadowLight.shadow.camera.far = 20; // default
                this.shadowLight.shadow.mapSize.set(2048, 2048);
                this.scene.add(this.shadowLight);
            }
        }
    };

    /**
     * @function
     * @description De-initializes rendering and MR
     */
    denit() {
        document.body.removeChild(this.renderer.domElement);
        this.removeChild(this.ARButton);
        window.removeEventListener('resize', this.onWindowResize);
    }

    /**
     * @function
     * @description Registers a new system addition to the MRApp engine.
     * @param {MRSystem} system - the system to be added.
     */
    registerSystem(system) {
        this.systems.add(system);
    }

    /**
     * @function
     * @description Unregisters a system from the MRApp engine.
     * @param {MRSystem} system - the system to be removed.
     */
    unregisterSystem(system) {
        this.systems.delete(system);
    }

    /**
     * @function
     * @description Adding an entity as an object in this MRApp engine's scene.
     * @param {MREntity} entity - the entity to be added.
     */
    add(entity) {
        this.scene.add(entity.object3D);
    }

    /**
     * @function
     * @description Removing an entity as an object in this MRApp engine's scene.
     * @param {MREntity} entity - the entity to be removed.
     */
    remove(entity) {
        this.scene.remove(entity.object3D);
    }

    /**
     * @function
     * @description Handles what is necessary rendering, camera, and user-wise when the viewing window is resized.
     */
    onWindowResize() {
        switch (this.cameraOptions.camera) {
            case 'orthographic':
                global.viewPortWidth = window.innerWidth / 1000;
                global.viewPortHeight = window.innerHeight / 1000;

                this.user.left = global.viewPortWidth / -2;
                this.user.right = global.viewPortWidth / 2;
                this.user.top = global.viewPortHeight / 2;
                this.user.bottom = global.viewPortHeight / -2;
                break;
            case 'perspective':
            default:
                this.user.aspect = window.innerWidth / window.innerHeight;
                global.viewPortWidth = global.viewPortHeight * this.user.aspect;
                break;
        }
        this.user.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * @function
     * @description Default function header needed by threejs. The render function that is called during ever frame. Calls every systems' update function.
     * @param {number} timeStamp - timeStamp of the current frame.
     * @param {object} frame - given frame information to be used for any feature changes
     */
    render(timeStamp, frame) {
        // ----- grab important vars ----- //

        const deltaTime = this.clock.getDelta();

        // ----- Update needed items ----- //

        if (global.inXR && !this.session) {
            this.session = this.renderer.xr.getSession();
            if (!this.session) {
                return;
            }

            this.session.addEventListener('end', () => {
                global.inXR = false;
                this.user.position.set(0, 0, 1);
                this.user.quaternion.set(0, 0, 0, 1);
                this.session = null;
                this.onWindowResize();
                this.dispatchEvent(new CustomEvent('exitXR', { bubbles: true }));
            });
        }

        if (this.debug) {
            this.stats.begin();
        }
        for (const system of this.systems) {
            system.__update(deltaTime, frame);
        }
        if (this.debug) {
            this.stats.end();
        }

        // ----- Actually Render ----- //


        // goal:
        // render panel to offscreen - white is panel, black otherwise
        // render the whole scene
        // take this pass and use it to determine if entities should be drawn or see thru

        if (this.maskingSystem == undefined) { return; }

        // const camera = this.user;

        // Render pass for the torus
        // const renderPanelToTexture = (panelObject3D) => {
        //     mrjsUtils.Material.setObjectMaterial(panelObject3D,stencilRenderMaterial);
        //     this.renderer.setRenderTarget(global.renderTarget);
        //     this.renderer.clear();
        //     this.renderer.render(myscene2, this.user);
        //     this.renderer.setRenderTarget(null);
        //     mrjsUtils.Material.setObjectMaterial(panelObject3D,torusMaterial);
        // }

        // if (this.maskingSystem != undefined) {
        //     for (const entity of this.maskingSystem.registry) {
        //         let material = mrjsUtils.Material.getObjectMaterial(entity.object3D);
        //         console.log(material);
        //         console.log(entity);
        //         this.maskingSystem.texture1UniformHandle.value = global.renderTarget.texture;
        //         this.maskingSystem.resolutionUniformHandle.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
        //         mrjsUtils.Material.setObjectMaterial(entity.object3D, material);
        //         myscene2.add(entity.object3D);
        //     }

        //     let singlePanel = null;
        //     for (const p of this.maskingSystem.panels.values()) {
        //         singlePanel = p.object3D;
        //         break;
        //     }
        //     myscene2.add(singlePanel);
        //     renderPanelToTexture(singlePanel);
        //     this.renderer.render(myscene2, this.user);
        // }

        // Panel Material
        // const panelMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        // // Entity Material
        // const entityMaterial = new THREE.MeshBasicMaterial({
        //   color: 0x00ff00,
        //   stencilWrite: true,
        //   stencilFunc: THREE.EqualStencilFunc,
        //   stencilRef: 1,
        //   stencilMask: 0xFF,
        //   stencilFail: THREE.ReplaceStencilOp,
        //   stencilZFail: THREE.ReplaceStencilOp,
        //   stencilZPass: THREE.ReplaceStencilOp,
        // });

          ///////
        // const panelObjects = [];
        // for (p in this.maskingSystem.panels.values()) {
        //     panelObjects.push(p.object3D);
        // }
        // const entityObjects = [];
        // for (e in this.maskingSystem.registry.values()) {
        //     entityObjects.push(e.object3D);
        // }

        // let camera = this.user;

        // const ENTITY_LAYER = 1;
        // const PANEL_LAYER = 2;

        // entityObjects.forEach(entity => {
        //     entity.layers.set(ENTITY_LAYER);
        // });

        // panelObjects.forEach(panel => {
        //     panel.layers.set(PANEL_LAYER);
        // });

        // const composer = new EffectComposer(renderer);

        // // Render pass for panels
        // const panelRenderPass = new RenderPass(scene, camera);
        // panelRenderPass.clear = false;
        // panelRenderPass.clearDepth = true;
        // composer.addPass(panelRenderPass);

        // // Render pass for entities
        // const entityRenderPass = new RenderPass(scene, camera);
        // entityRenderPass.clear = false;
        // composer.addPass(entityRenderPass);

        // const panelRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        // const panelCamera = camera.clone();

        // function renderPanels = () => {
        //     camera.layers.set(PANEL_LAYER);
        //     renderer.setRenderTarget(panelRenderTarget);
        //     renderer.render(scene, panelCamera);
        //     renderer.setRenderTarget(null); // Reset to render to the canvas
        // }

        // const overlapShader = {
        //     uniforms: {
        //         panelDepthTexture: { value: panelRenderTarget.depthTexture },
        //         cameraNear: { value: camera.near },
        //         cameraFar: { value: camera.far },
        //     },
        //     vertexShader: `
        //         varying vec2 vUv;
        //         void main() {
        //             vUv = uv;
        //             gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        //         }
        //     `,
        //     fragmentShader: `
        //         uniform sampler2D panelDepthTexture;
        //         uniform float cameraNear;
        //         uniform float cameraFar;
        //         varying vec2 vUv;

        //         float readDepth(sampler2D depthSampler, vec2 coord) {
        //             float fragCoordZ = texture2D(depthSampler, coord).x;
        //             float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
        //             return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
        //         }

        //         void main() {
        //             float panelDepth = readDepth(panelDepthTexture, vUv);
        //             float entityDepth = gl_FragCoord.z;

        //             if (entityDepth > panelDepth) discard; // Discard fragment if entity is behind the panel

        //             gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // Render entity pixel
        //         }
        //     `
        // };

        // const overlapPass = new ShaderPass(overlapShader);
        // composer.addPass(overlapPass);

        // // Render panels
        // camera.layers.set(PANEL_LAYER);
        // panelRenderPass.renderToScreen = false;
        // composer.render();

        // // Render entities
        // camera.layers.set(ENTITY_LAYER);
        // entityRenderPass.renderToScreen = false;
        // composer.render();

        // // Process the overlap
        // overlapPass.renderToScreen = true;
        // composer.render();

        const camera = this.user;

        const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        const shaderMaterialUniforms = {
            texture1: { value: renderTarget.texture },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        };

        const objectShaderMaterial = {
            uniforms: shaderMaterialUniforms,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D texture1;
                uniform vec2 resolution;
                varying vec2 vUv;

                void main() {
                    vec4 textureColor = texture2D(texture1, gl_FragCoord.xy / resolution);
                    if (textureColor.r < 0.1) {
                        discard;
                    } else {
                        gl_FragColor = vec4(0, 0, 0, 1);
                    }
                }
            `
        };

        function createEntityMaterial(color) {
            return new THREE.ShaderMaterial({
                ...objectShaderMaterial,
                fragmentShader: `
                    uniform sampler2D texture1;
                    uniform vec2 resolution;
                    varying vec2 vUv;

                    void main() {
                        vec4 textureColor = texture2D(texture1, gl_FragCoord.xy / resolution);
                        if (textureColor.r < 0.1) {
                            gl_FragColor = vec4(1, 0, 0, 1);
                        } else {
                            gl_FragColor = vec4(${color}, 1); // Use the passed color
                        }
                    }
                `
            });
        }

        // Function to create panel material (similar to torus)
        function createPanelMaterial() {
            return new THREE.ShaderMaterial({
                vertexShader: `
                    void main() {
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    void main() {
                        gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); // Render yellow
                    }
                `,
            });
        }

        const panels = [];
        for (let p of this.maskingSystem.panels) {
            panels.push(p.object3D);
        }
        const entities = [];
        for (let e of this.maskingSystem.registry) {
            entities.push(e.object3D);
        }

        // Create and add entities and panels to the scene
        // You should populate these lists with actual THREE.Group objects
        entities.forEach(entity => {
            const material = createEntityMaterial('1, 0, 0'); // Red, for example
            entity.children.forEach(child => {
                child.material = material;
                child.material.needsUpdate = true;
            });
        });

        panels.forEach(panel => {
            const material = createPanelMaterial();
            panel.children.forEach(child => {
                child.material = material;
                child.material.needsUpdate = true;
            });
        });

        // Adjusted render pass for panels
        // function renderPanelsToTexture() {
        this.renderer.clear();
        this.renderer.setRenderTarget(renderTarget);

        panels.forEach(panel => {
            let material = mrjsUtils.Material.getObjectMaterial(panel);
            mrjsUtils.Material.setObjectMaterial(panel, createPanelMaterial());

            this.renderer.render(this.scene, camera);

            mrjsUtils.Materila.setObjectMaterial(panel, material);
        
        });

        this.renderer.setRenderTarget(null);

        // }
        // // renderPanelsToTexture();
        
        this.renderer.render(this.scene, camera);
    }
}

customElements.get('mr-app') || customElements.define('mr-app', MRApp);
