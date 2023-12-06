import { MREntity } from 'MRJS/Core/MREntity';

/**
 *
 */
export class MRSystem {
    frameRate = null;

    delta = 0;

    /**
     *
     * @param useComponents
     * @param frameRate
     */
    constructor(useComponents = true, frameRate = null) {
        this.app = document.querySelector('mr-app');

        if (!this.app) {
            return;
        }

        this.frameRate = frameRate;
        // Need a way to register and deregister systems per environment
        this.registry = new Set();

        this.systemName = this.constructor.name.split('System')[0];
        this.componentName = `comp${this.systemName}`;

        this.app.registerSystem(this);

        if (useComponents) {
            document.addEventListener(`${this.componentName}-attached`, this.onAttach);
            document.addEventListener(`${this.componentName}-updated`, this.onUpdate);
            document.addEventListener(`${this.componentName}-detached`, this.onDetatch);
        }

        this.app.addEventListener('new-entity', (event) => {
            if (this.registry.has(event.target)) {
                return;
            }
            this.onNewEntity(event.target);
        });

        const entities = document.querySelectorAll(`[${this.componentName}]`);
        for (const entity of entities) {
            if (!(entity instanceof MREntity)) {
                return;
            }
            this.registry.add(entity);
        }
    }

    /**
     *
     * @param deltaTime
     * @param frame
     */
    __update(deltaTime, frame) {
        if (this.frameRate) {
            this.delta += deltaTime;
            if (this.delta < this.frameRate) {
                return;
            }
        }
        this.update(deltaTime, frame);
        this.delta = 0;
    }

    // Called per frame
    /**
     *
     * @param deltaTime
     * @param frame
     */
    update(deltaTime, frame) {}

    // called when a new entity is added to the scene
    /**
     *
     * @param entity
     */
    onNewEntity(entity) {}

    // called when the component is initialized
    /**
     *
     * @param entity
     * @param data
     */
    attachedComponent(entity, data) {
        //console.log(`attached ${this.componentName} ${entity.dataset[this.componentName]}`);
    }

    /**
     *
     * @param entity
     * @param data
     * @param oldData
     */
    updatedComponent(entity, oldData) {
        //console.log(`updated ${this.componentName} ${entity.dataset[this.componentName]}`);
    }

    // called when the component is removed
    /**
     *
     * @param entity
     */
    detachedComponent(entity) {
        console.log(`detached ${this.componentName}`);
    }

    onAttach = (event) => {
        this.registry.add(event.detail.entity);
        this.attachedComponent(event.detail.entity);
    };

    onUpdate = (event) => {
        this.updatedComponent(event.detail.entity, event.detail.oldData);
    };

    onDetatch = (event) => {
        this.registry.delete(event.detail.entity);
        this.detachedComponent(event.detail.entity);
    };
}