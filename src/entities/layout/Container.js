import * as THREE from 'three';
import { ClippingGeometry } from '../../datatypes/ClippingGeometry';
import { LayoutEntity } from './LayoutEntity';

/**
 *
 */
export class Container extends LayoutEntity {
    /**
     *
     */
    constructor() {
        super();
        this.currentPosition = new THREE.Vector3();
        this.prevPosition = new THREE.Vector3();
        this.deltaVector = new THREE.Vector3();
        this.delta = 0
    }

    /**
     *
     */
    connected() {
        this.clipping = new ClippingGeometry(new THREE.BoxGeometry(this.width, this.height, 0.3));
        window.addEventListener('load', (event) => {
            this.dispatchEvent(new CustomEvent('container-mutated', { bubbles: true }));

            
        });

        window.addEventListener('resize', (event) => {
            this.dispatchEvent(new CustomEvent('container-mutated', { bubbles: true }));
        });

        this.parentElement.addEventListener('surface-placed', (event) => {
            this.dispatchEvent(new CustomEvent('container-mutated', { bubbles: true }));
        });

        this.parentElement.addEventListener('surface-removed', (event) => {
            this.dispatchEvent(new CustomEvent('container-mutated', { bubbles: true }));
        });

        this.addEventListener('container-mutated', (event) => {

            // if(global.inXR) {
            //     this.shuttle.position.y -= this.height / 2
            // }

            this.windowVerticalScale = this.parentElement.windowVerticalScale
            this.windowHorizontalScale = this.parentElement.windowHorizontalScale

            this.clipping.geometry.copy(new THREE.BoxGeometry(this.width, this.windowVerticalScale, 0.3));
        });

        document.addEventListener('wheel', (event) => {
            this.onScroll(event);
        });
    }

    /**
     *
     * @param entity
     */
    add(entity) {
        this.shuttle.add(entity.object3D);
    }

    /**
     *
     * @param entity
     */
    remove(entity) {
        this.shuttle.remove(entity.object3D);
    }

    onTouch = (event) => {
        if (event.type == 'touch-end') {
            this.prevPosition.set(0, 0, 0);
            return;
        }
        event.stopPropagation();
        const scrollMin = 0;
        this.currentPosition.copy(event.detail.worldPosition);
        if (this.prevPosition.y != 0) {
            this.deltaVector.subVectors(this.currentPosition, this.prevPosition);
        }
        this.prevPosition.copy(this.currentPosition);

        this.delta = this.deltaVector.y * 2;

        if(this.delta == 0) {
            return
        }

        if(global.inXR){
            this.delta *= 2
        }

        this.momentumScroll(this.threeToPx(this.delta * 3), 5000)

    };


    threeToPx = (val) => {
        return (val / global.viewPortHeight) * window.innerHeight
    }

    momentumScroll = (distance, duration) => {
        let start = null;
        let remainingDistance = distance;
    
        function step() {
            if (start === null) {
                start = new Date().getTime();
            }
    
            const currentTime = new Date().getTime();
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / duration, 1);
            const easing = 1 - Math.pow(1 - progress, 3); // cubic easing out
    
            const scrollDistance = remainingDistance * easing;
            window.scrollBy(0, scrollDistance);
    
            remainingDistance -= scrollDistance;
    
            if (timeElapsed < duration) {
                setTimeout(step, 10); // 10ms for the next step
            }
        }
    
        setTimeout(step, 10);
    }



    onScroll = (event) => {
    };
}

customElements.get('mr-container') || customElements.define('mr-container', Container);
