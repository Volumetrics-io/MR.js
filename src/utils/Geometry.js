import * as THREE from 'three';

/**
 * @namespace Geometry
 * @description Useful namespace for helping with Geometry utility functions
 */
var Geometry = {};

/**
 * @function
 * @memberof Geometry
 * @description This construction function creates the UIPlane that is used as the backdrop for most mrjs Panel divs.
 * @param {number} width - the expected width of the plane.
 * @param {number} height - the expected height of the plane.
 * @param {number} radius_corner - the expected radius value to curve the planes corners.
 * @param {number} smoothness - the expected smoothness value.
 * @returns {THREE.BufferGeometry} - The completed threejs plane object.
 */
Geometry.UIPlane = function(width, height, radius_corner, smoothness) {
    let w = width == 'auto' ? 1 : width;
    w = w != 0 ? w : 1;
    let h = height == 'auto' ? 1 : height;
    h = h != 0 ? h : 1;
    const r = radius_corner[0] == 0 ? 0.0001 : radius_corner[0];
    const s = smoothness; // shortening for calculation quickness.

    if (!w || !h || !r || !s) {
        return null;
    }

    // helper const's
    const wi = w / 2 - r; // inner width
    const hi = h / 2 - r; // inner height
    const ul = r / w; // u left
    const ur = (w - r) / w; // u right
    const vl = r / h; // v low
    const vh = (h - r) / h; // v high

    const positions = [wi, hi, 0, -wi, hi, 0, -wi, -hi, 0, wi, -hi, 0];

    const uvs = [ur, vh, ul, vh, ul, vl, ur, vl];

    const n = [3 * (s + 1) + 3, 3 * (s + 1) + 4, s + 4, s + 5, 2 * (s + 1) + 4, 2, 1, 2 * (s + 1) + 3, 3, 4 * (s + 1) + 3, 4, 0];

    const indices = [n[0], n[1], n[2], n[0], n[2], n[3], n[4], n[5], n[6], n[4], n[6], n[7], n[8], n[9], n[10], n[8], n[10], n[11]];

    let phi;
    let cos;
    let sin;
    let xc;
    let yc;
    let uc;
    let vc;
    let idx;

    for (let i = 0; i < 4; i++) {
        xc = i < 1 || i > 2 ? wi : -wi;
        yc = i < 2 ? hi : -hi;

        uc = i < 1 || i > 2 ? ur : ul;
        vc = i < 2 ? vh : vl;

        for (let j = 0; j <= s; j++) {
            phi = (Math.PI / 2) * (i + j / s);
            cos = Math.cos(phi);
            sin = Math.sin(phi);

            positions.push(xc + r * cos, yc + r * sin, 0);

            uvs.push(uc + ul * cos, vc + vl * sin);

            if (j < s) {
                idx = (s + 1) * i + j + 4;
                indices.push(i, idx, idx + 1);
            }
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();

    return geometry;
}

export { Geometry };
