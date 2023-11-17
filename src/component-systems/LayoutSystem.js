import System from '../core/System';
import { Surface } from '../entities/Surface';

/**
 *
 */
export class LayoutSystem extends System {
    /**
     *
     */
    constructor() {
        super(false);

        document.addEventListener('DOMContentLoaded', (event) => {
            const containers = this.app.querySelectorAll('mr-container');

            for (const container of containers) {
                this.registry.add(container);
            }
        });
    }

    /**
     *
     * @param deltaTime
     * @param frame
     */
    update(deltaTime, frame) {
        for (const entity of this.registry) {
            this.adjustContainerSize(entity);
        }
    }

    adjustContainerSize = (container) => {
        container.dispatchEvent(new CustomEvent('container-mutated', { bubbles: true }));
    };
}
