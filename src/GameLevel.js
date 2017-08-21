import Scene from 'qtek/lib/Scene';
import Node from 'qtek/lib/Node';
import Material from 'qtek/lib/Material';
import Shader from 'qtek/lib/Shader';
import Mesh from 'qtek/lib/Mesh';
import PerspectiveCamera from 'qtek/lib/camera/Perspective';
import OrthographicCamera from 'qtek/lib/camera/Orthographic';
import shaderLibrary from 'qtek/lib/shader/library';
import DirectionalLight from 'qtek/lib/light/Directional';
import AmbientLight from 'qtek/lib/light/Ambient';
import AmbientSHLight from 'qtek/lib/light/AmbientSH';
import Vector3 from 'qtek/lib/math/Vector3';
import GLTF2Loader from 'qtek/lib/loader/GLTF2';

import 'qtek/lib/shader/builtin';

import BevelCube from './BevelCube';

class GameLevel {

    constructor({
        route,
        animation,
        control
    }) {
        this._scene = new Scene();
        this._camera = new PerspectiveCamera({
            fov: 20
        });

        this._animation = animation;
        this._control = control;

        this._createBricks(route);
        this._createGround();

        this._createLight();

        /**
         * @private
         */
        this._currentBrick = 0;

        /**
         * @private
         */
        this._cameraCenter = [5, 0, 5];

        this._focusOnScene();
        
    }

    update() {}


    get scene() {
        return this._scene
    }
    get camera() {
        return this._camera
    }

    get center() {
        return this._cameraCenter.slice();
    }

    loadCharacter(url) {
        let characterRoot = new Node();
        let loader = new GLTF2Loader({
            rootNode: new Node()
        });
        characterRoot.add(loader.rootNode);
        characterRoot.invisible = true;
        this._characterRoot = characterRoot;
        
        return new Promise((resolve, reject) => {

            loader.load(url);
            loader.success((res) => {
                this._scene.add(characterRoot);
                this._fitCharacter(res.rootNode);
                this._placeCharacter(this._currentBrick);
                res.clips.forEach((clip) => {
                    this._animation.addClip(clip);
                });

                resolve();
            });
        });
    }
    
    moveCharacterForward(forwardNum) {
        return this.moveCharacterToBrick(this._currentBrick + forwardNum);
    }

    moveCharacterToBrick(targetBrickIdx) {
        targetBrickIdx = Math.min(targetBrickIdx, this._route.length - 1);
        if (targetBrickIdx === this._currentBrick) {
            return;
        }

        let bricks = this._route;
        let currentBrick = bricks[this._currentBrick];
        let targetBrick = bricks[targetBrickIdx];
        let characterRoot = this._characterRoot;
        let animation = this._animation;
        let self = this;
        currentBrick.onleave && currentBrick.onleave();

        function moveNext(from, to, cb) {
            if (from >= targetBrickIdx) {
                return;
            }

            let fromBrick = bricks[from];
            let toBrick = bricks[to];

            animation.animate(characterRoot.position)
                .when(0, {
                    x: fromBrick.x, y: fromBrick.y, z: fromBrick.z
                })
                .when(500, {
                    x: toBrick.x, y: toBrick.y, z: toBrick.z
                })
                .done(() => {
                    moveNext(to, to + 1);
                    if (toBrick !== currentBrick && toBrick !== targetBrick) {
                        toBrick.onpass && toBrick.onpass();
                    }
                    self._placeCharacter(to);
                    self._currentBrick = to;
                })
                .start();
        }

        return new Promise((resolve, reject) => {
            moveNext(this._currentBrick, this._currentBrick + 1, () => {
                targetBrick.onenter && targetBrick.onenter();
                resolve();
            });
        });
    }

    playInitAnimation() {
        return Promise.all([
            this._bricksInitAnimation().then(() => this._characterInitAnimation()),
            this._cameraInitAnimation()
        ]);
    }

    _cameraInitAnimation() {
        return new Promise((resolve, reject) => {
            this._control.animateTo({
                beta: this._control.getBeta() - 360,
                duration: 10000,
                done: () => resolve()
            })
        });
    }

    _bricksInitAnimation() {
        return new Promise((resolve, reject) => {
            let animationCount = 0;
            this._bricksRoot.eachChild((child) => {
                let targetY = child.position.y;
                child.position.y = 20;
                animationCount++;
                this._animation.animate(child.position)
                    .when(500 + Math.random() * 800, {
                        y: targetY
                    })
                    // .delay(idx / route.length * 2000)
                    .delay(Math.random() * 5000)
                    .done(() => {
                        animationCount--;
                        if (animationCount === 0) {
                            resolve();
                        }
                    })
                    .start('bounceOut')
            });
        });
    }

    _characterInitAnimation() {
        return new Promise((resolve, reject) => {
            this._characterRoot.invisible = false;
            let targetY = this._characterRoot.position.y;
            this._characterRoot.position.y = 5;
            this._animation.animate(this._characterRoot.position)
                .when(1000, {
                    y: targetY
                })
                .done(() => resolve())
                .start('bounceOut');
        });
    }

    _placeCharacter(idx) {
        let currentBrick = this._route[idx];
        let nextBrick = this._route[idx + 1];
        if (!nextBrick) {
            return;
        }

        this._characterRoot.position.set(currentBrick.x, currentBrick.y, currentBrick.z);
        this._characterRoot.lookAt(new Vector3(nextBrick.x, currentBrick.y, nextBrick.z));
    }

    _createBricks(route) {

        this._bricksRoot = new Node({
            name: 'bricks'
        });        

        let bevelCube = new BevelCube({
            size: [0.9, 0.4, 0.9]
        });

        route = route.filter((brickInfo, idx) => {
            if (idx > 0) {
                let prevBrick = route[idx - 1];
                return !(brickInfo.x === prevBrick.x
                    && brickInfo.z === prevBrick.z);
            }
            return true;
        })

        route.forEach(function (brickInfo, idx) {
            let { x, y, z } = brickInfo;
            let mesh = new Mesh({
                name: 'brick',
                material: new Material({
                    shader: shaderLibrary.get('qtek.standard')
                }),
                geometry: bevelCube
            });
            mesh.position.set(x, y, z);

            this._bricksRoot.add(mesh);
        }, this);

        this.scene.add(this._bricksRoot);

        this._route = route;
    }

    _createGround() {

        let bevelCube = new BevelCube({
            size: [15, 2, 15],
            bevelSize: 0.1,
            bevelSegments: 4
        });

        let groundMesh = new Mesh({
            material: new Material({
                shader: shaderLibrary.get('qtek.standard')
            }),
            geometry: bevelCube
        });
        groundMesh.position.set(4, -2, 4);
        groundMesh.material.set('color', [1, 1, 0]);

        this._scene.add(groundMesh);
    }

    _createLight() {
        this._mainLight = new DirectionalLight({
            intensity: 0.6,
            shadowBias: 0.01,
            shadowResolution: 1024
        });
        this._mainLight.position.set(1, 2, 1);
        this._mainLight.lookAt(Vector3.ZERO);
        this.scene.add(this._mainLight);

        this._ambientLight = new AmbientSHLight({
            intensity: 0.5,
            coefficients: [0.8437718749046326, 0.7119551301002502, 0.6915095448493958, -0.03782108053565025, 0.08277066797018051, 0.16676367819309235, 0.34294256567955017, 0.2882286012172699, 0.3000207543373108, -0.041648123413324356, -0.02208542637526989, -0.009571924805641174, -0.0035407955292612314, -0.041702818125486374, -0.06433344632387161, -0.012146145105361938, -0.007677558809518814, -0.005088089499622583, -0.031185373663902283, 0.03404870629310608, 0.08188919723033905, -0.059674497693777084, -0.04938139393925667, -0.06084217131137848, 0.046793099492788315, 0.055832892656326294, 0.04983913525938988]
        });
        this.scene.add(this._ambientLight);
    }

    _focusOnScene() {
        // 10x10 bricks?
        this._camera.position.setArray(this._cameraCenter).scaleAndAdd(new Vector3(1, 2, 1), 15);
        this._camera.lookAt(new Vector3().setArray(this._cameraCenter));
    }

    _fitCharacter(rootNode) {
        let bbox = rootNode.getBoundingBox();
        let size = new Vector3();
        let center = new Vector3();
        size.copy(bbox.max).sub(bbox.min);
        center.copy(bbox.max).add(bbox.min).scale(0.5);

        // Look at right position.
        rootNode.rotation.rotateY(Math.PI);

        rootNode.position.set(-center.x, -bbox.min.y + 0.4, -center.z);
        let scale = 1 / Math.max(size.x, size.y, size.z);
        rootNode.scale.set(scale, scale, scale);
    }
}

export default GameLevel;