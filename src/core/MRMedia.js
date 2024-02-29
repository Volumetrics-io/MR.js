import * as THREE from 'three';

import { MRDivEntity } from 'mrjs/core/MRDivEntity';

import { mrjsUtils } from 'mrjs';

/**
 * @class MRMedia
 * @classdesc Base html media entity represented in 3D space. `mr-media`
 * @augments MRDivEntity
 */
export class MRMedia extends MRDivEntity {
    /**
     * @class
     * @description Constructs a base media entity using a UIPlane and other 3D elements as necessary.
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Create the object3D. Dont need default value for geometry
        // until the connected call since this will get overwritten anyways.
        let material = new THREE.MeshStandardMaterial({
            side: 0,
            transparent: true,
        });
        // Object3D for MRMedia (mrimage,mrvideo,etc) is the actual image/video/etc itself in 3D space
        this.object3D = new THREE.Mesh(undefined, material);
        this.object3D.receiveShadow = true;
        this.object3D.renderOrder = 3;
        this.object3D.name = 'media';

        // the media to be filled out.
        // for ex: document.createElement('video') or document.createElement('img');
        this.media = null;

        // This is a reference to the texture that is used as part of the
        // threejs material. Separating it out for easier updating after it is loaded.
        // The texture is filled-in in the connected function.
        this.texture = null;

        // This is used to aid in the formatting for certain object-fit setups
        // ex: contain, scale-down
        this.subMediaMesh = null;
    }

    /**
     * @function
     * @description Calculates the width of the img based on the img tag in the shadow root
     * @returns {number} - the resolved width
     */
    get width() {
        let width = this.objectFitDimensions?.width;
        return width > 0 ? width : super.width;
    }

    /**
     * @function
     * @description Calculates the height of the img based on the img tag in the shadow root
     * @returns {number} - the resolved height
     */
    get height() {
        let height = this.objectFitDimensions?.height;
        return height > 0 ? height : super.height;
    }

    get mediaWidth() {
        // to be filled in in children
    }

    get mediaHeight() {
        // to be filled in in children
    }

    generateNewMediaPlaneGeometry() {
        if (this.object3D.geometry !== undefined) {
            this.object3D.geometry.dispose();
        }
        this.object3D.geometry = mrjsUtils.geometry.UIPlane(this.width, this.height, this.borderRadii, 18);
    }

    loadMediaTexture() {
        // filled in by MRMedia children (MRImage,MRVideo,etc)
    }

    /**
     * @function
     * @description Callback function of MREntity - handles setting up this Image and associated 3D geometry style (from css) once it is connected to run as an entity component.
     */
    connected() {
        this.media.setAttribute('src', mrjsUtils.html.resolvePath(this.getAttribute('src')));
        this.media.setAttribute('style', 'object-fit:inherit; width:inherit');

        this.objectFitDimensions = { height: 0, width: 0 };
        if (this.getAttribute('src') !== undefined) {
            this.computeObjectFitDimensions();
            this.generateNewMediaPlaneGeometry();
            this.loadMediaTexture();
        }
    }

    _mutationCheck() {
        // to be filled in by children
    }

    /**
     * @function
     * @description Callback function of MREntity - Updates the image's cover,fill,etc based on the mutation request.
     * @param {object} mutation - the update/change/mutation to be handled.
     */
    mutated(mutation) {
        super.mutated();
        
        // moving the if 'mutation' handling check to the children, since
        // mutations are only understood by their actual type. Any mutation
        // passed through MRMedia directly is undefined since it is not
        // a direct element for users.
        //
        // those functions can do the if (mutation.type ....) handling and
        // their specific cases and then call back up to here to run the below functionality.
        this.media.setAttribute('src', this.getAttribute('src'));
        this.computeObjectFitDimensions();
        this.loadMediaTexture();
    }

    /**
     * @function
     * @description computes the width and height values for the image considering the value of object-fit
     */
    computeObjectFitDimensions() {
        if (!this.texture || !this.media) {
            // We assume every media item exists and has its attached texture.
            // If texture doesnt exist, it's just not loaded in yet, meaning
            // we can skip the below until it is.
            return;
        }

        const _oldSubMediaNotNeeded = () => {
            if (this.subMediaMesh !== null) {
                mrjsUtils.model.disposeObject3D(this.subMediaMesh);
                this.subMediaMesh = null;
            }
        };

        let containerWidth = this.parentElement.width;
        let containerHeight = this.parentElement.height;
        let mediaWidth = this.mediaWidth;
        let mediaHeight = this.mediaHeight;
        const mediaAspect = mediaWidth / mediaHeight;
        const containerAspect = containerWidth / containerHeight;
        switch (this.compStyle.objectFit) {
            case 'fill':
                _oldSubMediaNotNeeded();
                this.objectFitDimensions = { width: containerWidth, height: containerHeight };

                break;

            case 'contain':
            case 'scale-down':
                // `contain` and `scale-down` are the same except for one factor:
                // - `contain` will always scale the media to fit
                // - `scale-down` will only scale the media to fit if the media is larger than the container

                // Plane dimensions in 3D space
                const planeWidth = containerWidth;
                const planeHeight = containerHeight;

                // Check if resize is required
                if (this.compStyle.objectFit === 'contain' || mediaWidth > planeWidth || mediaHeight > planeHeight) {
                    const scaleRatio = Math.min(planeWidth / mediaWidth, planeHeight / mediaHeight);
                    mediaWidth *= scaleRatio;
                    mediaHeight *= scaleRatio;
                }

                const mediaGeometry = new THREE.PlaneGeometry(mediaWidth, mediaHeight);
                const mediaMaterial = new THREE.MeshStandardMaterial({
                    map: this.texture,
                    transparent: true,
                });
                _oldSubMediaNotNeeded();
                this.subMediaMesh = new THREE.Mesh(mediaGeometry, mediaMaterial);

                // cleanup for final rendering setup
                let planeMesh = this.object3D;
                let mediaMesh = this.subMediaMesh;

                this.objectFitDimensions = {
                    width: planeWidth,
                    height: planeHeight,
                };
                planeMesh.material.visible = false;
                planeMesh.material.needsUpdate = true;
                planeMesh.add(mediaMesh);

                mediaMesh.material.visible = true;
                mediaMesh.material.needsUpdate = true;

                break;

            case 'cover':
                _oldSubMediaNotNeeded();

                this.texture.repeat.set(1, 1); // Reset scaling

                if (containerAspect > mediaAspect) {
                    // Plane is wider than the texture
                    const scale = containerAspect / mediaAspect;
                    this.texture.repeat.y = 1 / scale;
                    this.texture.offset.y = (1 - 1 / scale) / 2; // Center the texture vertically
                } else {
                    // Plane is taller than the texture
                    const scale = mediaAspect / containerAspect;
                    this.texture.repeat.x = 1 / scale;
                    this.texture.offset.x = (1 - 1 / scale) / 2; // Center the texture horizontally
                }
                this.texture.needsUpdate = true; // Important to update the texture

                this.objectFitDimensions = {
                    width: containerWidth,
                    height: containerHeight,
                };

                break;

            case 'none':
                _oldSubMediaNotNeeded();
                this.objectFitDimensions = { width: mediaWidth, height: mediaHeight };

                break;

            default:
                throw new Error(`Unsupported object-fit value ${this.compStyle.objectFit}`);
        }

        this.style.width = `${this.objectFitDimensions.width}px`;
        this.style.height = `${this.objectFitDimensions.height}px`;
    }
}

// TODO - dont want to allow users to create this as a generic item, just as a base class for all future
// media elements?
// customElements.get('mr-media') || customElements.define('mr-media', MRMedia);
