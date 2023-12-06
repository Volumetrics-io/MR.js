import * as THREE from 'three';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { USDZLoader } from 'three/examples/jsm/loaders/USDZLoader.js';

// import { AMFLoader } from 'three/addons/loaders/AMFLoader.js';
// import { BVHLoader } from 'three/addons/loaders/BVHLoader.js';
// import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// import { GCodeLoader } from 'three/addons/loaders/GCodeLoader.js';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// // import { IFCLoader }        from 'web-ifc-three';
// // import { IFCSPACE }         from 'web-ifc';
// import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
// import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js';
// import { PCDLoader } from 'three/addons/loaders/PCDLoader.js';
// import { PDBLoader } from 'three/addons/loaders/PDBLoader.js';
// import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
// import { STLLoader } from 'three/addons/loaders/STLLoader.js';
// import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
// import { TDSLoader } from 'three/addons/loaders/TDSLoader.js';
// import { ThreeMFLoader } from 'three/addons/loaders/3MFLoader.js';
// import { USDZLoader } from 'three/addons/loaders/USDZLoader.js';

// TODOs before merge
// - look into smaller todos leftover
// - see if any items after loading should be returned instead of directly added to scene
//   - prob should allow scene to be an optional parameter and return items as necessary
// - i should probably simply these to be more self contained of pure model and allow modifications on top, tbd
// - current highest priority is GLB/GLTF and USDZ
// - if model already exists in the scene - add an instance of it instead of fully reloading

/*
// Loads 3dm file
// @param libraryPath - optional - default is 'jsm/libs/rhino3dm'. If not using the
// default, set this variable to proper local path.
// Assumes cdn path is https://cdn.jsdelivr.net/npm/rhino3dm@8.0.0-beta2/
function load3DM(filePath, scene, libraryPath) {
    const loader = new Rhino3dmLoader();

    // cdn - generally, use this for the Library Path: https://cdn.jsdelivr.net/npm/rhino3dm@8.0.0-beta2/
    loader.setLibraryPath( 'jsm/libs/rhino3dm/' );
    loader.load( filePath, function ( object ) {
        scene.add( object );
    }, undefined, function ( error ) {
        console.error( error );
        return false;
    } );
    return true;
}

// Loads 3ds file
// @param resourcePath - path to the additional 3ds file resources
// @param normalMap - optional - 3ds files dont store normal maps, pass a THREE.TextureLoader
// as the normal map if you'd like to add one. Otherwise, leave variable empty.
function load3DS(filePath, resourcePath, scene, normalMap) {
    const loader = new TDSLoader();

    loader.setResourcePath(resourcePath);

    loader.load( filePath, function ( object ) {
        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.material.specular.setScalar( 0.1 );
                if (normalMap != undefined) {
                    child.material.normalMap = normalMap;
                }
            }
        } );

        scene.add( object );

    }, undefined, function ( error ) {
        console.error( error );
        return false;
    } );
    return true;
}

// Loads 3mf file
// @param loadingManager - optional - User your own THREE.LoadingManager, otherwise defaults to
// simplest loading manager with empty constructor.
function load3MF(filePath, scene, loadingManager) {
    if (loadingManager == undefined) {
        loadingManager = new THREE.LoadingManager();
    }
    const loader = new ThreeMFLoader(loadingManager);

    // TODO - check back on this one - it seems *~ off ~*
    loader.load( filePath, function ( group ) {
        if ( object ) {

            object.traverse( function ( child ) {
                if ( child.material ) child.material.dispose();
                if ( child.material && child.material.map ) child.material.map.dispose();
                if ( child.geometry ) child.geometry.dispose();
            } );

            scene.remove( object );
        }

        object = group;

        scene.add(object);

    }, undefined, function ( error ) {
        console.error( error );
        return false;
    } );
    return true;
}

// Loads amf file
function loadAMF(filePath, scene) {
    const loader = new AMFLoader();

    loader.load( filePath, function ( amfobject ) {
        scene.add( amfobject );
    }, undefined, function ( error ) {
        console.error( error );
        return false;
    } );
    return true;
}

// Loads bvh file
function loadBVH(filePath, scene) {
    const loader = new BVHLoader();

    loader.load( filePath, function ( result ) {
        const skeletonHelper = new THREE.SkeletonHelper( result.skeleton.bones[ 0 ] );

        scene.add( result.skeleton.bones[ 0 ] );
        scene.add( skeletonHelper );
    }, undefined, function ( error ) {
        console.error( error );
        return false;
    } );
    return true;
}
*/

// Loads Collada file
/**
 *
 * @param filePath
 */
function loadDAE(filePath) {
    const loader = new ColladaLoader();

    return new Promise((resolve, reject) => {
        loader.load(
            filePath,
            (dae) => {
                resolve(dae.scene);
            },
            undefined,
            (error) => {
                console.error(error);
                reject(error);
            }
        );
    });
}

/*
// Loads Draco file
// @param decoderConfig - required - example: 'js'
// @param libraryPath - optional - default is 'jsm/libs/draco/'. If not using the
// default, set this variable to proper local path.
function loadDRACO(filePath, scene, decoderConfig, libraryPath) {
    const dracoLoader = new DRACOLoader();

    dracoLoader.setDecoderConfig( { type: 'js' } );
    dracoLoader.setDecoderPath( 'jsm/libs/draco/' );

    dracoLoader.load( filePath, function ( geometry ) {

        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial();
        const mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );

    }, undefined, function ( error ) {
        console.error( error );
        dracoLoader.dispose();
        return false;
    } );

    // Release decoder resources.
    dracoLoader.dispose();

    return true;
}
*/

// Loads fbx file
/**
 *
 * @param filePath
 */
function loadFBX(filePath) {
    const loader = new FBXLoader();

    return new Promise((resolve, reject) => {
        loader.load(
            filePath,
            (fbx) => {
                resolve(fbx);
            },
            undefined,
            (error) => {
                console.error(error);
                reject(error);
            }
        );
    });
}

/*
// Loads gcode file
function loadGCODE(filePath, scene) {
    const loader = new GCodeLoader();

    loader.load( filePath, function ( object ) {
        scene.add( object );
    }, undefined, function ( error ) {
        console.error( error );
        return false;
    } );
    return true;
}
*/

// Loads GLTF/GLB file
/**
 *
 * @param filePath
 */
async function loadGLTF(filePath) {
    const loader = new GLTFLoader();

    return new Promise((resolve, reject) => {
        loader.load(
            filePath,
            (gltf) => {
                resolve(gltf.scene);
            },
            undefined,
            (error) => {
                console.error(error);
                reject(error);
            }
        );
    });
}

/*
// Loads IFC file
function loadIFC(filePath, scene) {
    const ifcLoader = new IFCLoader();
    await ifcLoader.ifcManager.setWasmPath( 'https://unpkg.com/web-ifc@0.0.36/', true );

    await ifcLoader.ifcManager.parser.setupOptionalCategories( {
        [ IFCSPACE ]: false,
    } );

    await ifcLoader.ifcManager.applyWebIfcConfig( {
        USE_FAST_BOOLS: true
    } );

    ifcLoader.load( filePath, function ( model ) {
        scene.add( model.mesh );
    }, undefined, function ( error ) {
        console.error( error );
        return false;
    } );
    return true;
}

// TODO - from imagebitmap <--> nrrd

// TODO - see if can combine the two below obj methods

// Loads OBJ file
function loadOBJ(filePath, scene) {
    const objLoader = new OBJLoader();
    objLoader.load(filePath, (root) => {
        scene.add(root);
    }, undefined, function ( error ) {
        console.error( error );
        return false;
    } );
    return true;
}

// Loads OBJ file with material
function loadOBJWithMTL(objFilePath, mtlFilePath, scene) {
    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();

    mtlLoader.load( mtlFilePath, function ( materials ) {
        materials.preload();

        objLoader
            .setMaterials( materials )
            .load( objFilePath, function ( object ) {

                scene.add( object );

            }, undefined, function ( error ) {
                console.error( error );
                return false;
            } );

    }, undefined, function ( error ) {
        console.error( error );
        return false;
    } );
    return true;
}

// Loads pcd file
function loadPCD(filePath, scene) {
    const loader = new PCDLoader();

    loader.load( filePath, function ( points ) {
        scene.add( points );
    }, undefined, function ( error ) {
        console.error( error );
        return false;
    } );
    return true;
}

// TODO - pdb

// Loads ply file
function loadPLY(filePath, scene) {
    const loader = new PLYLoader();
    loader.load( filePath, function ( geometry ) {

        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial(  );
        const mesh = new THREE.Mesh( geometry, material );

        scene.add( mesh );

    }, undefined, function ( error ) {
        console.error( error );
        return false;
    } );
    return true;
}
*/

// Loads stl file
/**
 *
 * @param filePath
 */
async function loadSTL(filePath) {
    const loader = new STLLoader();

    return new Promise((resolve, reject) => {
        loader.load(
            filePath,
            (geometry) => {
                const material = new THREE.MeshPhongMaterial();
                const mesh = new THREE.Mesh(geometry, material);

                resolve(mesh); // Resolve the promise with the loaded mesh
            },
            (xhr) => {
                // Progress callback
                console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
            },
            (error) => {
                console.error(error);
                reject(error); // Reject the promise if there's an error
            }
        );
    });
}

// TODO - svg

// TODO - tilt, tff

// Loads USD/USDZ file
/**
 *
 * @param filePath
 */
async function loadUSDZ(filePath) {
    const usdzLoader = new USDZLoader();

    const [model] = await Promise.all([usdzLoader.loadAsync(filePath)], undefined, (error) => {
        console.error(error);
        return null;
    });

    return model;
}

// TODO - vox <--> xyz

/// ////////////////////////
// Main Loading Function //
/// ////////////////////////

/**
 *
 * @param filePath
 * @param extension
 */
export function loadModel(filePath, extension) {
    // later on - this would be better//faster with enums<->string<-->num interop but
    // quick impl for now

    // if (extension == 'gltf') { // - need to be able to have additional filepaths
    //   return loadGLTF(filePath);
    // }
    // if (extension == 'dae') {
    //     return loadDAE(filePath);
    // } else
    if (extension == 'fbx') {
        return loadFBX(filePath);
    } else if (extension == 'glb') {
        return loadGLTF(filePath);
    } else if (extension == 'stl') {
        return loadSTL(filePath);
    }
    // if (extension == 'usdc') {
    //   return loadUSDZ(filePath);
    // }
    // if (extension == 'usdz') {
    //   return loadUSDZ(filePath);
    // }
    console.error(`ERR: the extensions ${extension} is not supported by MR.js`);
    return null;
}