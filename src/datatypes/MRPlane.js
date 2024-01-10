export class MRPlane {
    label = null
    orientation = null
    dimensions = new THREE.Vector3()
    occupied = false // Each plane can have one Entity anchored to it for simplicity.
    mesh = null
    body = null
}