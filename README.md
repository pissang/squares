# SQUARES

### Build

```bash
npm install -g rollup
npm install
npm run dev
```


### Basic Usage

```html
<script src="../dist/squares.js"></script>
```

```js
var squares = new Squares(document.getElementById('main'), {
    // If enable shadow
    shadow: true
});

var route = [];
var height = 0;
for (var i = 0; i < 10; i++) {
    route.push({
        x: i, z: 0,
        // Distance to ground
        y: height += 0.2,
        name: 'Cube_' + i,
        // Callback when character leave.
        onleave: function () {
            console.log('Laved ' + this.name);
        },
        // Callback when character enter.
        onenter: function () {
            console.log('Entered ' + this.name);
        },
        // Callback when character walk passed
        onpass: function () {
            console.log('Passed ' + this.name);
        }
    });
}

// Load game level
squares.loadLevel({
    route: route,
    // Character gltf file path.
    character: './asset/baixiaodu.gltf'
}).then(function () {
    // Level loaded and animation finished.
});
```