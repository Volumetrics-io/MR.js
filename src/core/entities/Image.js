import * as THREE from 'three';

import { MRDivEntity } from 'mrjs/core/MRDivEntity';

import { mrjsUtils } from 'mrjs';

/**
 * @class Image
 * @classdesc Base html image represented in 3D space. `mr-image`
 * @augments MRDivEntity
 */
export class Image extends MRDivEntity {
    /**
     * Calculates the width of the img based on the img tag in the shadow root
     * @returns {number} - the resolved width
     */
    get width() {
        let width = mrjsUtils.Css.pxToThree(this.img.width);
        return width > 0 ? width : super.width;
    }

    /**
     * Calculates the height of the img based on the img tag in the shadow root
     * @returns {number} - the resolved height
     */
    get height() {
        let height = mrjsUtils.Css.pxToThree(this.img.height);
        return height > 0 ? height : super.height;
    }

    /**
     * Constructs a base image entity using a UIPlane and other 3D elements as necessary.
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.img = document.createElement('img');
        this.geometry = mrjsUtils.Geometry.UIPlane(1, 1, [0.0001], 18);
        this.material = new THREE.MeshStandardMaterial({
            side: 0,
        });
        this.object3D = new THREE.Mesh(this.geometry, this.material);
        this.object3D.receiveShadow = true;
        this.object3D.renderOrder = 3;
    }

    /**
     * Callback function of MREntity - handles setting up this Image and associated 3D geometry style (from css) once it is connected to run as an entity component.
     */
    connected() {
        this.img = document.createElement('img');
        this.img.setAttribute('src', this.getAttribute('src'));
        this.img.setAttribute('width', '100%');
        this.shadowRoot.appendChild(this.img);

        const borderRadii = this.compStyle.borderRadius.split(' ').map((r) => this.domToThree(r));
        this.object3D.geometry = mrjsUtils.Geometry.UIPlane(this.width, this.height, borderRadii, 18);
        this.texture = new THREE.TextureLoader().load(this.img.src, (texture) => {
            switch (this.compStyle.objectFit) {
                case 'cover':
                    this.cover(texture, this.width / this.height);
                    break;
                case 'fill':
                default:
                    break;
            }
        });
        this.object3D.material.map = this.texture;

        // slight bump needed to avoid overlapping, glitchy visuals.
        // I'm sure there's a better solution lol.
        this.object3D.position.z += 0.001;
    }

    /**
     * Updates the style for the Image's border and background based on compStyle and inputted css elements.
     */
    updateStyle() {
        super.updateStyle();
        const borderRadii = this.compStyle.borderRadius.split(' ').map((r) => this.domToThree(r));
        this.object3D.geometry = mrjsUtils.Geometry.UIPlane(this.width, this.height, borderRadii, 18);
        if (this.texture.image) {
            this.cover(this.texture, this.width / this.height);
        }
    }

    /**
     * Callback function of MREntity - Updates the image's cover,fill,etc based on the mutation request.
     * @param {object} mutation - the update/change/mutation to be handled.
     */
    mutated(mutation) {
        super.mutated();
        if (mutation.type != 'attributes' && mutation.attributeName == 'src') {
            this.img.setAttribute('src', this.getAttribute('src'));
            this.object3D.material.map = new THREE.TextureLoader().load(this.img.src, (texture) => {
                switch (this.compStyle.objectFit) {
                    case 'cover':
                        this.cover(texture, this.width / this.height);
                        break;
                    case 'fill':
                    default:
                        break;
                }
            });
        }
    }

    /**
     * Calculates the texture UV transformation change based on the image's aspect ratio.
     * @param {object} texture - the texture to augment
     * @param {number} aspect - a given expected aspect ratio
     */
    cover(texture, aspect) {
        texture.matrixAutoUpdate = false;

        const imageAspect = texture.image.width / texture.image.height;

        if (aspect < imageAspect) {
            texture.matrix.setUvTransform(0, 0, aspect / imageAspect, 1, 0, 0.5, 0.5);
        } else {
            texture.matrix.setUvTransform(0, 0, 1, imageAspect / aspect, 0, 0.5, 0.5);
        }
    }
}

customElements.get('mr-img') || customElements.define('mr-img', Image);
