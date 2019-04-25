const scene = document.querySelector('a-scene');

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function getCat() {
    const x = String(getRandom(-15, 15));
    const y = String(getRandom(20, 30));
    const z = String(getRandom(-5, 5));
    const position = x + ' ' + y + ' ' + z;
    const yaw = String(getRandom(0, 360));
    const cat = document.createElement('a-box');
    cat.classList.add('animal');
    cat.setAttribute('obj-model', 'obj: #cat-obj;');
    cat.setAttribute('src', '#catfur');
    cat.setAttribute('scale', '0.03 0.03 0.03');
    cat.setAttribute('position', position);
    cat.setAttribute('rotation', '5 ' + yaw + ' 0');
    cat.setAttribute('dynamic-body', {
        shape: 'box',
        mass: 1.5,
        linearDamping: 0.005
    });
    return cat;
}


//   <a-sphere dynamic-body id='dog1' obj-model="obj: #dog-obj;" src="#dogfur" position="0 1.5 -3" rotation="0 1.5 0"
//   scale="0.009 0.009 0.009"></a-sphere>

function getDawg() {
    const x = String(getRandom(-15, 15));
    const y = String(getRandom(20, 30));
    const z = String(getRandom(-5, 5));
    const position = x + ' ' + y + ' ' + z;
    const yaw = String(getRandom(0, 360));
    const dawg = document.createElement('a-box');
    dawg.classList.add('animal');
    dawg.setAttribute('obj-model', 'obj: #dog-obj;');
    dawg.setAttribute('src', '#dogfur');
    dawg.setAttribute('scale', '0.009 0.009 0.009');
    dawg.setAttribute('position', position);
    dawg.setAttribute('rotation', '5 ' + yaw + ' 0');
    dawg.setAttribute('dynamic-body', {
        shape: 'box',
        mass: 1.5,
        linearDamping: 0.005
    });
    return dawg;
}

setInterval(function () {
    const cat = getCat();
    const dog = getDawg();
    scene.appendChild(cat);
    scene.appendChild(dog);
}, 600);

const mAudio = new Audio('audio.wav');
mAudio.loop = true;

scene.addEventListener('click', function (e) {
    if (e.target.type != 'div') {
        const animals = document.querySelectorAll('.animal');
        for (let i = 0; i < animals.length; i++) {
            animals[i].parentNode.removeChild(animals[i]);
        }
        mAudio.play().then(function () {
            console.log('Audio started!');
        }).catch(function (error) {
            console.log('audio not started')
            throw error;
        });
    }
});