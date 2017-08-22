import StaticGeometry from 'qtek/lib/StaticGeometry';
import glMatrix from 'qtek/lib/dep/glmatrix';

let vec3 = glMatrix.vec3;
let mat3 = glMatrix.mat3;

let BevelCube = StaticGeometry.extend(function () {
    return {
        bevelSize: 0.15,
        bevelSegments: 2,

        size: [0.9, 0.9, 0.9]
    };
},
function () {
    this.build();
    this.updateBoundingBox();
},
{
    build: (function () {

        let rotateMat = mat3.create();

        let bevelStartSize = [];

        let xOffsets = [1, -1, -1, 1];
        let zOffsets = [1, 1, -1, -1];
        let yOffsets = [1, -1];

        return function () {
            let size = this.size;
            let vertexCount = this._getBevelBarVertexCount(this.bevelSegments);
            let triangleCount = this._getBevelBarTriangleCount(this.bevelSegments);
            this.attributes.position.init(vertexCount);
            this.attributes.normal.init(vertexCount);
            this.attributes.texcoord0.init(vertexCount);
            this.indices = new Uint16Array(triangleCount * 3);

            let bevelSize = this.bevelSize;
            let bevelSegments = this.bevelSegments;

            bevelSize = Math.min(size[0], size[2]) / 2 * bevelSize;

            for (let i = 0; i < 3; i++) {
                bevelStartSize[i] = Math.max(size[i] - bevelSize * 2, 0);
            }
            let rx = (size[0] - bevelStartSize[0]) / 2;
            let ry = (size[1] - bevelStartSize[1]) / 2;
            let rz = (size[2] - bevelStartSize[2]) / 2;

            let pos = [];
            let normal = [];

            let endIndices = [];
            let vertexOffset = 0;

            for (let i = 0; i < 2; i++) {
                endIndices[i] = endIndices[i] = [];

                for (let m = 0; m <= bevelSegments; m++) {
                    for (let j = 0; j < 4; j++) {
                        if ((m === 0 && i === 0) || (i === 1 && m === bevelSegments)) {
                            endIndices[i].push(vertexOffset);
                        }
                        for (let n = 0; n <= bevelSegments; n++) {

                            let phi = n / bevelSegments * Math.PI / 2 + Math.PI / 2 * j;
                            let theta = m / bevelSegments * Math.PI / 2 + Math.PI / 2 * i;
                            // let r = rx < ry ? (rz < rx ? rz : rx) : (rz < ry ? rz : ry);
                            normal[0] = rx * Math.cos(phi) * Math.sin(theta);
                            normal[1] = ry * Math.cos(theta);
                            normal[2] = rz * Math.sin(phi) * Math.sin(theta);
                            pos[0] = normal[0] + xOffsets[j] * bevelStartSize[0] / 2;
                            pos[1] = (normal[1] + ry) + yOffsets[i] * bevelStartSize[1] / 2;
                            pos[2] = normal[2] + zOffsets[j] * bevelStartSize[2] / 2;

                            // Normal is not right if rx, ry, rz not equal.
                            if (!(Math.abs(rx - ry) < 1e-6 && Math.abs(ry - rz) < 1e-6)) {
                                normal[0] /= rx * rx;
                                normal[1] /= ry * ry;
                                normal[2] /= rz * rz;
                            }
                            vec3.normalize(normal, normal);

                            this.attributes.position.set(vertexOffset, pos);
                            this.attributes.normal.set(vertexOffset, normal);
                            vertexOffset++;
                        }
                    }
                }
            }

            let widthSegments = bevelSegments * 4 + 3;
            let heightSegments = bevelSegments * 2 + 1;

            let len = widthSegments + 1;
            let triangleOffset = 0;

            for (let j = 0; j < heightSegments; j ++) {
                for (let i = 0; i <= widthSegments; i ++) {
                    let i2 = j * len + i;
                    let i1 = (j * len + (i + 1) % len);
                    let i4 = (j + 1) * len + (i + 1) % len;
                    let i3 = (j + 1) * len + i;

                    this.setTriangleIndices(triangleOffset++, [i4, i2, i1]);
                    this.setTriangleIndices(triangleOffset++, [i4, i3, i2]);
                }
            }

            // Close top and bottom
            this.setTriangleIndices(triangleOffset++, [endIndices[0][0], endIndices[0][2], endIndices[0][1]]);
            this.setTriangleIndices(triangleOffset++, [endIndices[0][0], endIndices[0][3], endIndices[0][2]]);
            this.setTriangleIndices(triangleOffset++, [endIndices[1][0], endIndices[1][1], endIndices[1][2]]);
            this.setTriangleIndices(triangleOffset++, [endIndices[1][0], endIndices[1][2], endIndices[1][3]]);
        };
    })(),

    
    _getBevelBarVertexCount: function (bevelSegments) {
        return (bevelSegments + 1) * 4 * (bevelSegments + 1) * 2;
    },

    _getBevelBarTriangleCount: function (bevelSegments) {
        var widthSegments = bevelSegments * 4 + 3;
        var heightSegments = bevelSegments * 2 + 1;
        return (widthSegments + 1) * heightSegments * 2 + 4;
    }
});

export default BevelCube;