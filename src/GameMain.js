import Renderer from 'qtek/lib/Renderer';
import Animation from 'qtek/lib/animation/Animation';
import ShadowMapPass from 'qtek/lib/prePass/ShadowMap';

import GameLevel from './GameLevel';
import OrbitControl from 'qtek/lib/plugin/OrbitControl';


class GameMain {

    constructor(dom, opts) {
        opts = opts || {};

        this._currentLevel;

        /**
         * @private
         */
        this._animation = new Animation();
        /**
         * @private
         */
        this._renderer = new Renderer({
            devicePixelRatio: 1
        });
        /**
         * @private
         */
        this._root = dom;
        dom.appendChild(this._renderer.canvas);


        if (opts.shadow) {
            /**
             * @private
             */
            this._shadowMapPass = new ShadowMapPass();
        }

        this.resize();

        this._control = new OrbitControl({
            domElement: dom,
            animation: this._animation,
            panSensitivity: 0,
            minAlpha: 30,
            maxAlpha: 45
        });
    }

    resize() {
        this._renderer.resize(this._root.clientWidth, this._root.clientHeight);
    }
    
    loadLevel({ route, character }) {
        if (this._currentLevel) {
            console.error('Level already loaded. Use unloadLevel to unload current level.');
            return;
        }

        let level = new GameLevel({
            animation: this._animation,
            route: route,
            control: this._control
        });
        this._currentLevel = level;

        this._control.target = level.camera;
        this._control.setCenter(level.center);

        return new Promise((resolve, reject) => {
            if (character) {
                level.loadCharacter(character)
                    .then(() => level.playInitAnimation())
                    .then(() => resolve(level));
            }
            else {
                resolve(level);
            }
        });
    }

    unloadLevel() {
        if (!this._currentLevel) {
            console.error('No level can be unload.');
            return;
        }

        this._renderer.disposeScene(this._currentLevel.scene);
        this._animation.removeClipsAll();
        this._currentLevel = null;
    }

    start() {
        this._animation.start();
        this._animation.on('frame', this._loop, this);
    }

    dispose() {
        if (this._currentLevel) {
            this.unloadLevel();
        }
        if (this._shadowMapPass) {
            this._shadowMapPass.dispose(this._renderer);
        }
        this._renderer.dispose();
    }

    move(step) {
        if (this._currentLevel) {
            return this._currentLevel.moveCharacterForward(step);
        }
        else {
            throw new Error('Level not loaded yet.');
        }
    }

    _loop() {
        if (this._currentLevel) {
            let level = this._currentLevel;
            level.update();
            level.camera.aspect = this._renderer.getViewportAspect();

            this._shadowMapPass && this._shadowMapPass.render(this._renderer, level.scene, level.camera);
            this._renderer.render(level.scene, level.camera);
        }
    }
}

export default GameMain;