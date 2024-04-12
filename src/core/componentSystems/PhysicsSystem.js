import * as THREE from 'three';

import { MRSystem } from 'mrjs/core/MRSystem';
import { MREntity } from 'mrjs/core/MREntity';

import { mrjsUtils } from 'mrjs';
import { MRDivEntity } from 'mrjs/core/entities/MRDivEntity';
import { MRPanelEntity } from 'mrjs/core/entities/MRPanelEntity';
import { MRModelEntity } from 'mrjs/core/entities/MRModelEntity';

/**
 * @class PhysicsSystem
 * @classdesc The physics system functions differently from other systems,
 * Rather than attaching components, physical properties such as
 * shape, body, mass, etc are definied as attributes.
 * if shape and body are not defined, they default to the geometry
 * of the entity, if there is no geometry, there is no physics defined
 * on the entity.
 *
 * Alternatively, you can also expressly attach a comp-physics
 * attribute for more detailed control.
 * @augments MRSystem
 */
export class PhysicsSystem extends MRSystem {
    /**
     * @class
     * @description PhysicsSystem's default constructor - sets up useful world and debug information alongside an initial `Rapier` event queue.
     */
    constructor() {
        super(false);
        this.debug = this.app.debug;

        // Temp objects to not have to create and destroy the system
        // items in init and update functions constantly.
        this.tempWorldPosition = new THREE.Vector3();
        this.tempWorldQuaternion = new THREE.Quaternion();
        this.tempWorldScale = new THREE.Vector3();
        this.tempBBox = new THREE.Box3();
        this.tempSize = new THREE.Vector3();
        this.tempCenter = new THREE.Vector3();

        //for oriented BBox
        this.savedQuaternion = new THREE.Quaternion();

        if (this.debug && this.debug == 'true') {
            const material = new THREE.LineBasicMaterial({
                color: 0xffffff,
                vertexColors: true,
            });
            const geometry = new THREE.BufferGeometry();
            this.lines = new THREE.LineSegments(geometry, material);
            this.app.scene.add(this.lines);
        }
    }

    /**
     * @function
     * @description The per global scene event update call.  Based on the captured physics events for the frame, handles all items appropriately.
     */
    eventUpdate = () => {
        for (const entity of this.registry) {
            if (entity.physics?.body == null) {
                continue;
            }
            if (entity instanceof MRModelEntity) {
                this.updateSimpleBody(entity);
            } else if (entity instanceof MRDivEntity) {
                this.updateUIBody(entity);
            }
        }
    };

    // TODO: polish and move this into MRSystem
    /**
     * @function
     * @description a function called when a specific entity has an event update
     * @param {Event} e - the event generated by the entity
     */
    entityEventUpdate = (e) => {
        if (!e.target.physics.body) {
            return;
        }
        if (e.target instanceof MRModelEntity) {
            this.updateSimpleBody(e.target);
        } else if (e.target instanceof MRDivEntity) {
            this.updateUIBody(e.target);
        }
    };

    /**
     * @function
     * @description The per-frame system update call. Based on the captured physics events for the frame, handles all items appropriately.
     * @param {number} deltaTime - given timestep to be used for any feature changes
     * @param {object} frame - given frame information to be used for any feature changes
     */
    update(deltaTime, frame) {
        // per-frame time step
        mrjsUtils.physics.world.step(mrjsUtils.physics.eventQueue);

        for (const entity of this.registry) {
            if (entity.physics?.body == null) {
                continue;
            }
            this.updateBody(entity);
        }

        this.updateDebugRenderer();
    }

    /**
     * @function
     * @description When a new entity is created, adds it to the physics registry and initializes the physics aspects of the entity.
     * @param {MREntity} entity - the entity being set up
     */
    onNewEntity(entity) {
        if (entity.physics.type == 'none') {
            return;
        }

        if (entity instanceof MRDivEntity) {
            this.initPhysicsBody(entity);
            this.registry.add(entity);
            entity.addEventListener('modelchange', (e) => {
                this.entityEventUpdate(e);
            });

            entity.addEventListener('child-updated', (e) => {
                this.entityEventUpdate(e);
            });
        }
    }

    /**
     * @function
     * @description when an entity is removed, remove and destroy it's physics body
     * @param {MREntity} entity - the removed entity
     */
    entityRemoved(entity) {
        mrjsUtils.physics.world.removeRigidBody(entity.physics.body);
        entity.physics.body = null;
    }

    /**
     * @function
     * @description Initializes the rigid body used by the physics part of the entity
     * @param {MREntity} entity - the entity being updated
     */
    initPhysicsBody(entity) {
        const rigidBodyDesc = mrjsUtils.physics.RAPIER.RigidBodyDesc.fixed();
        entity.physics.body = mrjsUtils.physics.world.createRigidBody(rigidBodyDesc);
        entity.object3D.getWorldPosition(this.tempWorldPosition);
        entity.object3D.getWorldQuaternion(this.tempWorldQuaternion);
        entity.physics.body.setTranslation(...this.tempWorldPosition, true);
        entity.physics.body.setRotation(this.tempWorldQuaternion, true);
        // TODO: we should find a way to consolidate these 2, UI and Model are created in slightly different ways
        //       and model will get more complex as we add convexMesh support
        if (entity instanceof MRModelEntity) {
            this.initSimpleBody(entity);
        } else if (entity instanceof MRDivEntity) {
            this.initUIEntityBody(entity);
        }
    }

    /**
     * @function
     * @description Initializes the rigid body used by the physics for non-nr-model div entities
     * @param {MREntity} entity - the entity being updated
     */
    initUIEntityBody(entity) {
        entity.physics.halfExtents = new THREE.Vector3();

        this.tempBBox.setFromCenterAndSize(entity.object3D.position, new THREE.Vector3(entity.width, entity.height, 0.002));
        this.tempWorldScale.setFromMatrixScale(entity.object3D.matrixWorld);
        this.tempBBox.getSize(this.tempSize);
        this.tempSize.multiply(this.tempWorldScale);

        entity.physics.halfExtents.copy(this.tempSize);
        entity.physics.halfExtents.divideScalar(2);

        const rigidBodyDesc = mrjsUtils.physics.RAPIER.RigidBodyDesc.fixed();
        entity.physics.body = mrjsUtils.physics.world.createRigidBody(rigidBodyDesc);

        let colliderDesc = mrjsUtils.physics.RAPIER.ColliderDesc.cuboid(...entity.physics.halfExtents);
        colliderDesc.setCollisionGroups(mrjsUtils.physics.CollisionGroups.UI);
        entity.physics.collider = mrjsUtils.physics.world.createCollider(colliderDesc, entity.physics.body);
        mrjsUtils.physics.COLLIDER_ENTITY_MAP[entity.physics.collider.handle] = entity;
        entity.physics.collider.setActiveCollisionTypes(mrjsUtils.physics.RAPIER.ActiveCollisionTypes.DEFAULT | mrjsUtils.physics.RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED);
        entity.physics.collider.setActiveEvents(mrjsUtils.physics.RAPIER.ActiveEvents.COLLISION_EVENTS);
    }

    /**
     * @function
     * @description Initializes a simple bounding box collider based on the visual bounds of the entity
     * @param {MREntity} entity - the entity being updated
     */
    initSimpleBody(entity) {
        entity.physics.halfExtents = new THREE.Vector3();

        if (entity instanceof MRModelEntity) {
            this.savedQuaternion.copy(entity.object3D.quaternion);
            entity.object3D.quaternion.set(0, 0, 0, 1);
            entity.object3D.updateMatrixWorld(true);

            entity.object3D.remove(entity.background);

            this.tempBBox.setFromObject(entity.object3D, true);

            entity.object3D.add(entity.background);
            entity.object3D.quaternion.copy(this.savedQuaternion);
        } else {
            this.tempBBox.setFromObject(entity.object3D, true);
        }

        this.tempBBox.getSize(this.tempSize);

        entity.physics.halfExtents.copy(this.tempSize);
        entity.physics.halfExtents.divideScalar(2);

        let colliderDesc = mrjsUtils.physics.RAPIER.ColliderDesc.cuboid(...entity.physics.halfExtents);
        colliderDesc.setCollisionGroups(mrjsUtils.physics.CollisionGroups.UI);

        this.tempBBox.getCenter(this.tempCenter);
        entity.object3D.getWorldPosition(this.tempWorldPosition);
        this.tempCenter.subVectors(this.tempCenter, this.tempWorldPosition);

        colliderDesc.setTranslation(...this.tempCenter);

        entity.physics.collider = mrjsUtils.physics.world.createCollider(colliderDesc, entity.physics.body);

        entity.physics.collider.setActiveCollisionTypes(mrjsUtils.physics.RAPIER.ActiveCollisionTypes.DEFAULT | mrjsUtils.physics.RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED);
        entity.physics.collider.setActiveEvents(mrjsUtils.physics.RAPIER.ActiveEvents.COLLISION_EVENTS);

        mrjsUtils.physics.COLLIDER_ENTITY_MAP[entity.physics.collider.handle] = entity;
    }

    /**
     * @function
     * @description Initializes a Rigid Body detailed convexMesh collider for the entity
     * NOTE: not currently in use until we can sync it with animations
     * @param {MREntity} entity - the entity being updated
     */
    initDetailedBody(entity) {
        const rigidBodyDesc = mrjsUtils.physics.RAPIER.RigidBodyDesc.fixed();
        entity.physics.body = mrjsUtils.physics.world.createRigidBody(rigidBodyDesc);

        entity.physics.colliders = [];

        entity.object3D.traverse((child) => {
            if (child.isMesh) {
                let collider = mrjsUtils.physics.world.createCollider(this.initConvexMeshCollider(child, entity.compStyle.scale), entity.physics.body);
                collider.setCollisionGroups(mrjsUtils.physics.CollisionGroups.UI);
                entity.physics.colliders.push(collider);
                mrjsUtils.physics.COLLIDER_ENTITY_MAP[collider.handle] = entity;
                collider.setActiveCollisionTypes(mrjsUtils.physics.RAPIER.ActiveCollisionTypes.DEFAULT | mrjsUtils.physics.RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED);
                collider.setActiveEvents(mrjsUtils.physics.RAPIER.ActiveEvents.COLLISION_EVENTS);
            }
        });
    }

    // /**
    //  * @function
    //  * @param object3D
    //  * @param scale
    //  * @description Initializes a convexMesh collider from a THREE.js geometry
    //  * NOTE: not currently in use until we can sync it with animations
    //  * NOTE: commenting for now until we make sure this works like the other init functions.
    //  * @param {object} entity - the entity being updated
    //  */
    // initConvexMeshCollider(object3D, scale) {
    //     // const positionAttribute = object3D.geometry.getAttribute('position');
    //     // const vertices = [];
    //     // for (let i = 0; i < positionAttribute.count; i++) {
    //     //     const vertex = new THREE.Vector3().fromBufferAttribute(positionAttribute, i).multiplyScalar(scale);
    //     //     vertices.push(vertex.toArray());
    //     // }

    //     // // Convert vertices to a flat Float32Array as required by RAPIER.ConvexHull
    //     // const verticesFlat = new Float32Array(vertices.flat());

    //     // return mrjsUtils.physics.RAPIER.ColliderDesc.convexMesh(verticesFlat);
    // }

    /**
     * @function
     * @description Updates the rigid body used by the physics part of the entity
     * @param {MREntity} entity - the entity being updated
     */
    updateBody(entity) {
        if (!entity.physics.body) {
            return;
        }

        if (entity.compStyle.visibility == 'hidden' && entity.physics.body.isEnabled()) {
            entity.physics.body.setEnabled(false);
        } else if (!entity.physics.body.isEnabled() && entity.compStyle.visibility == 'visible') {
            entity.physics.body.setEnabled(true);
            // TODO: we should find a way to consolidate these 2, UI and Model are created in slightly different ways
            //       and model will get more complex as we add convexMesh support
            if (entity instanceof MRModelEntity) {
                this.updateSimpleBody(entity);
            } else if (entity instanceof MRDivEntity) {
                this.updateUIBody(entity);
            }
        }

        if (entity instanceof MRPanelEntity) {
            entity.panel.getWorldPosition(this.tempWorldPosition);
        } else {
            entity.object3D.getWorldPosition(this.tempWorldPosition);
        }
        entity.physics.body.setTranslation({ ...this.tempWorldPosition }, true);

        entity.object3D.getWorldQuaternion(this.tempWorldQuaternion);
        entity.physics.body.setRotation(this.tempWorldQuaternion, true);
    }

    /**
     * @function
     * @description Updates the rigid body used by the physics part of the div entity
     * @param {MREntity} entity - the entity being updated
     */
    updateUIBody(entity) {
        this.tempBBox.setFromCenterAndSize(entity.object3D.position, new THREE.Vector3(entity.width, entity.height, 0.002));

        this.tempWorldScale.setFromMatrixScale(entity instanceof MRPanelEntity ? entity.panel.matrixWorld : entity.object3D.matrixWorld);
        this.tempBBox.getSize(this.tempSize);
        this.tempSize.multiply(this.tempWorldScale);

        entity.physics.halfExtents.copy(this.tempSize);
        entity.physics.halfExtents.divideScalar(2);

        entity.physics.collider.setHalfExtents(entity.physics.halfExtents);
    }

    /**
     * @function
     * @description Updates the rigid body used by the physics part of the model entity
     * @param {MREntity} entity - the entity being updated
     */
    updateSimpleBody(entity) {
        if (entity instanceof MRModelEntity) {
            this.savedQuaternion.copy(entity.object3D.quaternion);
            entity.object3D.quaternion.set(0, 0, 0, 1);
            entity.object3D.updateMatrixWorld(true);

            entity.object3D.remove(entity.background);

            this.tempBBox.setFromObject(entity.object3D, true);

            entity.object3D.add(entity.background);
            entity.object3D.quaternion.copy(this.savedQuaternion);
        } else {
            this.tempBBox.setFromObject(entity.object3D, true);
        }

        this.tempBBox.getSize(this.tempSize);

        entity.physics.halfExtents.copy(this.tempSize);
        entity.physics.halfExtents.divideScalar(2);
        entity.physics.collider.setHalfExtents(entity.physics.halfExtents);

        this.tempBBox.getCenter(this.tempCenter);
        entity.object3D.getWorldPosition(this.tempWorldPosition);
        this.tempCenter.subVectors(this.tempCenter, this.tempWorldPosition);
        entity.physics.collider.setTranslationWrtParent({ ...this.tempCenter });
    }

    /**
     * @function
     * @description Updates the debug renderer to either be on or off based on the 'this.debug' variable. Handles the drawing of the visual lines.
     */
    updateDebugRenderer() {
        if (!this.debug || this.debug == 'false') {
            return;
        }
        const buffers = mrjsUtils.physics.world.debugRender();
        this.lines.geometry.setAttribute('position', new THREE.BufferAttribute(buffers.vertices, 3));
        this.lines.geometry.setAttribute('color', new THREE.BufferAttribute(buffers.colors, 4));
    }
}
