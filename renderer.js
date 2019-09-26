// All of the Node.js APIs are available in this process.
const fs = require('fs');
const gm = require('gm');
const path = require('path');
const { dialog } = require('electron').remote;

const imagesExt = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/svg': 'svg' };
let userImageBase64 = '';
let choosedShape = '';

let loadFile = async () => {
  try {
    let files = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{
        name: 'Images',
        extensions: ['jpg', 'jpeg', 'png', 'gif']
      }]
    })
    let filePath = files.filePaths[0];
    userImageBase64 = fs.readFileSync(filePath).toString('base64');
    const data = gm(new Buffer(userImageBase64, 'base64')).resizeExact(512, 512)
    let buffer = await gmToBuffer(data)
    let squareIcon = document.getElementById('square-icon');
    userImageBase64 = buffer.toString('base64');
    squareIcon.src = `data:image/png;base64,${userImageBase64}`;
  } catch (e) {
    console.log(e);
  }
}

let updateSize = () => {
  let size = document.getElementById('input-size-range').value;
  document.getElementById('image-height').value = `${size}px`;
  document.getElementById('image-width').value = `${size}px`;
}


let saveImage = async () => {
  let size = document.getElementById('input-size-range').value;
  let color = document.getElementById('input-color').value;
  let result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  let directoryPath = result.filePaths[0];
  gm(new Buffer(userImageBase64, 'base64'))
    .fill(color)
    .opaque('black')
    // Implement shaping round corner later
    .resizeExact(size, size)
    .write(path.join(directoryPath, 'your-icon.png'), err => {
      if (err) console.log(err);
      console.log('Created an image from a Buffer!');
    });
}

/**
 * sélectionne une forme 'square', 'round' ou 'circle'
 */
let selectShape = shape => {
  choosedShape = shape;
  let corresp = { 'square': 'square-shape', 'round': 'round-shape', 'circle': 'circle-shape' };
  for (let prop in corresp) {
    document.getElementById(corresp[prop]).style.border = prop === shape ? '3px solid #626183' : 'none';
  }
  if (shape === 'square') {
    document.getElementById('square-icon').style['border-radius'] = '0';
  } else if (shape === 'round') {
    document.getElementById('square-icon').style['border-radius'] = '50px';
  } else {
    document.getElementById('square-icon').style['border-radius'] = '100%';
  }
}

let modifyBgColor = () => {
  let value = document.getElementById('input-color').value;
  document.getElementById('square-icon').style['background-color'] = value;
}

/**
 * Retourne une image sous forme de buffer
 */
function gmToBuffer(data) {
  return new Promise((resolve, reject) => {
    data.stream((err, stdout, stderr) => {
      if (err) { return reject(err) }
      const chunks = []
      stdout.on('data', (chunk) => { chunks.push(chunk) })
      stdout.once('end', () => { resolve(Buffer.concat(chunks)) })
      stderr.once('data', (data) => { reject(String(data)) })
    })
  })
}