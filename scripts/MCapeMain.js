import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

import {
    OrbitControls
} from 'https://cdn.jsdelivr.net/npm/three@0.122.0/examples/jsm/controls/OrbitControls.js';

import 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/2.0.0-alpha.2/cropper.min.js';

let upLoaderElement = document.getElementById('imageUpload');
let image = document.getElementById('image');
let resolutionInputBar = document.getElementById('resolutionFactorBar');
let resolutionInput = document.getElementById('resolutionFactor');
let resultPreview = document.getElementById("previewCanvas");
var finalCanvas;
var moudeDownTimer;
var tempImage = new Image()
var cropper = new Cropper(image, options);

//3*3 png
const defaultTexture = String.raw `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAYAAABWKLW/AAAAFElEQVR4nGNgYGD4zwABMBqT8R8AWc0E/AO/g9cAAAAASUVORK5CYII=`;
var cubeMaterialsFront = [
    //right side
    //left side
    //top side
    //bottom side
    //front side
    //back side
];
var cubeMaterialsBack = [];

// the resolution base of every face 
const resolutionModes = [
    [1, 15],
    [1, 15],
    [7, 1],
    [7, 1],
    [10, 16],
    [10, 16]
];
var resizeCanvass = [
    null, null, null, null, null, null,
];
const TargetCoordinate = [
    //in [left top x y ,with,height]
    //this is the coordinattes used to draw every part canvas store in resizeCavass to the mc cape image (final canvas)
    //the order is with  cubeMaterials
    [0, 1, 1, 16], //"left"
    [11, 1, 1, 16], //"right"
    [1, 0, 10, 1], //"top"
    [11, 0, 10, 1], //"bottom" 
    [1, 1, 10, 16], //"outside"
    [12, 1, 10, 16], //"inside" 
]

var reResolutionFactors = 10;
const loader = new THREE.TextureLoader();

// Restricts input for the given textbox to the given inputFilter.
function setInputFilter(textbox, inputFilter) {
    ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach(function (event) {
        textbox.addEventListener(event, function () {
            if (inputFilter(this.value)) {
                this.oldValue = this.value;
                this.oldSelectionStart = this.selectionStart;
                this.oldSelectionEnd = this.selectionEnd;
            } else if (this.hasOwnProperty("oldValue")) {
                this.value = this.oldValue;
                this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
            } else {
                this.value = "";
            }
        });
    });
}
setInputFilter(document.getElementById("resolutionFactor"), function (value) {
    return /^\d*$/.test(value) && (value === "" || parseInt(value) <= 50);
});


function setTexture(index) {

    var readedCanvas = resizeCanvass[index]
    if (readedCanvas) {
        cubeMaterialsFront[index].map = new THREE.CanvasTexture(readedCanvas);
        cubeMaterialsFront[index].map.magFilter = THREE.NearestFilter;
        cubeMaterialsBack[index].map = new THREE.CanvasTexture(readedCanvas);
        cubeMaterialsBack[index].map.magFilter = THREE.NearestFilter;
    }
}

function updateReResolutionFactor(value) {
    reResolutionFactors = value
}

function cloneCanvas(sourceCanvas) {
    if (!sourceCanvas) return null;
    var cloneCanvas = document.createElement('canvas')
    cloneCanvas.width = sourceCanvas.width;
    cloneCanvas.height = sourceCanvas.height;
    cloneCanvas.getContext('2d').drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height)
    return cloneCanvas;
}

// resize the resolution of temp canvas
function reResolution(index) {
    const updatingIndex = cropper.options.updatingFaceIndex;
    resizeCanvass[index] = cropper.getCroppedCanvas();
    var tempCanvas = cropper.getCroppedCanvas();

    var ctx = tempCanvas.getContext('2d')

    const width = (resolutionModes[updatingIndex][0]) * reResolutionFactors;
    const height = (resolutionModes[updatingIndex][1]) * reResolutionFactors;
    //TODO 卡顿？
    tempCanvas.width = width;
    tempCanvas.height = height;

    ctx.drawImage(resizeCanvass[index], 0, 0, width, height)
    resizeCanvass[index] = cloneCanvas(tempCanvas);
}

//update cropped to texture
function updateTexture() {
    //update texture
    //TODO ad blocker 性能问题 建议隐身模式

    reResolution(cropper.options.updatingFaceIndex);
    setTexture(cropper.options.updatingFaceIndex)
}

//Add Cube
function addCube() {

    //可更改？
    const geometry = new THREE.BoxGeometry(10, 16, 1);

    for (let index = 0; index < 6; index++) {
        // ImgdataURIs.push('')
        cubeMaterialsFront.push(new THREE.MeshBasicMaterial({
            map: loader.load(defaultTexture),
            transparent: true,
            side: THREE.FrontSide
        }));
        cubeMaterialsBack.push(new THREE.MeshBasicMaterial({
            map: loader.load(defaultTexture),
            transparent: true,
            side: THREE.BackSide
        }));
        //过滤器选择？
        //纹理 重复 偏移 旋转 控制器
        //https://threejs.org/manual/examples/textured-cube-adjust.html

        //悬浮文字
        //https://threejs.org/manual/?q=texture#en/canvas-textures
        cubeMaterialsFront[index].map.magFilter = THREE.NearestFilter;
        cubeMaterialsFront[index].map.minFilter = THREE.LinearFilter;
        cubeMaterialsBack[index].map.magFilter = THREE.NearestFilter;
        cubeMaterialsBack[index].map.minFilter = THREE.LinearFilter;

    }

    // var cubeFront = new THREE.Mesh(geometry, cubeMaterialsFront);
    // var cubeBack = new THREE.Mesh(geometry, cubeMaterialsBack);
    scene.add(new THREE.Mesh(geometry, cubeMaterialsBack))
    scene.add(new THREE.Mesh(geometry, cubeMaterialsFront));

}

function buildTargetImage() {
    //skin : width 10 ; height:16; depth:1
    //little skin require? width:height=2:1 or width:height=22:17

    //min image width:34, height:17 

    finalCanvas = document.createElement('canvas')
    finalCanvas.width = 22 * reResolutionFactors;
    finalCanvas.height = 17 * reResolutionFactors;
    for (let index = 0; index < resizeCanvass.length; index++) {
        if (resizeCanvass[index] != null)
            finalCanvas.getContext('2d').drawImage(resizeCanvass[index], TargetCoordinate[index][0] * reResolutionFactors, TargetCoordinate[index][1] * reResolutionFactors, TargetCoordinate[index][2] * reResolutionFactors, TargetCoordinate[index][3] * reResolutionFactors)
    }
    resultPreview.innerHTML = '';
    resultPreview.appendChild(finalCanvas)

}

function downloadImg() {
    if (finalCanvas == null) buildTargetImage()

    tempImage.src = finalCanvas.toDataURL("image/png");
    var tempLink = document.createElement('a');
    tempLink.href = finalCanvas.toDataURL("image/png");
    tempLink.download = (22 * reResolutionFactors).toString() + "X" + (17 * reResolutionFactors).toString();
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
}

var options = {
    aspectRatio: 10 / 16,
    updatingFaceIndex: 4,
    dragMode: "move",
    // preview: '.img-preview',
    ready: function (e) {},
    cropstart: function (e) {},
    cropmove: function (e) {
        updateTexture()
    },
    crop: function (e) {
        updateTexture()
    },
    zoom: function (e) {
        updateTexture()
    },

};





upLoaderElement.onchange = function () {

    document.getElementById('image').src = URL.createObjectURL(upLoaderElement.files[0]);
    if (cropper) {
        cropper.destroy();
    }
    cropper = new Cropper(image, options);
}
document.getElementById("imageDownload").onclick = function () {
    downloadImg();
}
document.getElementById("imagePreview").onclick = function () {
    buildTargetImage();
}

var actions = document.getElementById('actions');

// updating resolution factor
actions.querySelector('.docs-buttons').oninput = function (event) {
    const tempResolutionFactor = event.target.value;
    resolutionInputBar.value = tempResolutionFactor;
    resolutionInput.value = tempResolutionFactor;
    updateReResolutionFactor(tempResolutionFactor)

    updateTexture();
}
actions.querySelector('.docs-buttons').onmouseup = function (event) {
    clearInterval(moudeDownTimer);
}
actions.querySelector('.docs-buttons').onmouseout = function (event) {
    clearInterval(moudeDownTimer);
}
actions.querySelector('.docs-buttons').onmousedown = function (event) {
    var e = event || window.event;
    var target = e.target || e.srcElement;
    var cropped;
    var result;
    var input;
    var data;

    if (!cropper) {
        return;
    }

    while (target !== this) {
        if (target.getAttribute('data-method')) {
            break;
        }

        target = target.parentNode;
    }

    if (target === this || target.disabled || target.className.indexOf('disabled') > -1) {
        return;
    }

    data = {
        method: target.getAttribute('data-method'),
        target: target.getAttribute('data-target'),
        option: target.getAttribute('data-option') || undefined,
        secondOption: target.getAttribute('data-second-option') || undefined
    };

    cropped = cropper.cropped;

    if (data.method) {
        if (typeof data.target !== 'undefined') {
            input = document.querySelector(data.target);

            if (!target.hasAttribute('data-option') && data.target && input) {
                try {
                    data.option = JSON.parse(input.value);
                } catch (e) {
                    console.log(e.message);
                }
            }
        }

        switch (data.method) {
            case 'rotate':
                if (cropped && options.viewMode > 0) {
                    cropper.clear();
                }

                break;

            case 'getCroppedCanvas':
                try {
                    data.option = JSON.parse(data.option);
                } catch (e) {
                    console.log(e.message);
                }

                if (uploadedImageType === 'image/jpeg') {
                    if (!data.option) {
                        data.option = {};
                    }

                    data.option.fillColor = '#fff';
                }

                break;
        }



        moudeDownTimer = setInterval(function () {
            result = cropper[data.method](data.option, data.secondOption);
            console.log("set interval")
            cropper.crop();
        }, 1);

        switch (data.method) {
            case 'rotate':
                if (cropped && options.viewMode > 0) {

                    // moudeDownTimer = setInterval(function () {
                    //     console.log("set interval")
                    //     cropper.crop();
                    // }, 500);
                    cropper.crop();
                }

                break;

            case 'scaleX':
            case 'scaleY':
                target.setAttribute('data-option', -data.option);
                break;

            case 'getCroppedCanvas':
                if (result) {
                    // Bootstrap's Modal
                    $('#getCroppedCanvasModal').modal().find('.modal-body').html(result);

                    if (!download.disabled) {
                        download.download = uploadedImageName;
                        download.href = result.toDataURL(uploadedImageType);
                    }
                }

                break;

            case 'destroy':
                cropper = null;

                if (uploadedImageURL) {
                    URL.revokeObjectURL(uploadedImageURL);
                    uploadedImageURL = '';
                    image.src = originalImageURL;
                }

                break;
        }

        if (typeof result === 'object' && result !== cropper && input) {
            try {
                input.value = JSON.stringify(result);
            } catch (e) {
                console.log(e.message);
            }
        }
    }
};
// Options
actions.querySelector('.docs-toggles').onchange = function (event) {



    var e = event || window.event;
    var target = e.target || e.srcElement;
    var cropBoxData;
    var canvasData;
    var isCheckbox;
    var isRadio;

    if (!cropper) {
        return;
    }

    if (target.tagName.toLowerCase() === 'label') {
        target = target.querySelector('input');
    }

    isCheckbox = target.type === 'checkbox';
    isRadio = target.type === 'radio';

    if (isCheckbox || isRadio) {
        if (isCheckbox) {
            options[target.name] = target.checked;
            cropBoxData = cropper.getCropBoxData();
            canvasData = cropper.getCanvasData();

            options.ready = function () {
                console.log('ready');
                cropper.setCropBoxData(cropBoxData).setCanvasData(canvasData);
            };
        } else {
            console.log(target.value, target.name)
            options[target.name] = target.value;
            options.ready = function () {
                console.log('ready');
            };
        }

        // Restart
        cropper.destroy();
        cropper = new Cropper(image, options);
    }
};

let camera, controls, scene, renderer;
scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);
// scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

renderer = new THREE.WebGLRenderer({
    // antialias: false
    canvas: document.getElementById("3dCanvas")
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
// document.body.appendChild(renderer.domElement);

camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 0, 20);

// controls

controls = new OrbitControls(camera, renderer.domElement);
// controls.listenToKeyEvents(window); // optional

//controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.05;

controls.screenSpacePanning = false;

controls.minDistance = 5;
controls.maxDistance = 50;

// controls.maxPolarAngle = Math.PI / 2;

// world


// var dynamictexture = new THREEx.DynamicTexture(512, 512);
// dynamictexture.context.font = "bolder 90px verdana";
// dynamictexture.texture.needsUpdate = true;
// dynamictexture.clear('#d35400').drawText('Text', undefined, 256, 'green');
// var material = new THREE.MeshBasicMaterial({color: 0xffffff, map: dynamictexture.texture, opacity:1, transparent: true});


addCube();


window.addEventListener('resize', onWindowResize);

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    requestAnimationFrame(animate);

    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

    render();

}

function render() {

    renderer.render(scene, camera);

}
animate();