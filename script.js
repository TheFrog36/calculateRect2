let width // Canvas width based on img width
let height // Canvas height based on img height

let numberOfCycles // How many rects will be added to the final image
let maxRects  // How many rects are created per cycle
let topSelection // Select the top 10 from a generation
let numberOfGenerations // * 10 // How many generations 
let nRectsFromOld // Generate N new rects from each rect of past gen

let rectMinSizeStart
let rectMinSizeEnd
let rectMaxSizeStart
let rectMaxSizeEnd
let reductionFactor
// maxSize = (((cycles- i) / cycles ) ** reductionFactor) * maxSizeStart + maxSizeEnd
let maxColorDifference
let maxSizeDifference
let maxRotationDifference
let maxOffset
let maxAlphaDifference

let msTime = 0
let currentCycle = 0
let difference = -1
let timeToComplete = -1
let pixelsChecked = 0
let rectArrayInfo = []

const targetCanvas = document.getElementById('target-canvas')
const targetCTX = targetCanvas.getContext('2d')
const outputCanvas = document.getElementById('output-canvas')
const outputCTX = outputCanvas.getContext('2d')
const inputCanvas = document.getElementById('input-canvas')
const inputCTX = inputCanvas.getContext('2d')

const worker = new Worker('./worker.js')
let targetCanvasData // var for image pixel data

const imgUrl = './images/cat.png'

msTime = new Date()
const targetImage = new Image()
targetImage.src = imgUrl
targetImage.onload = () => {
  width = targetImage.width
  height = targetImage.height
  prepareCanvas(targetImage)
  targetCanvasData = targetCTX.getImageData(0, 0, width, height)
}

function init() {
  document.getElementById('highlight-div').style.display = 'block';
  document.getElementById('settings').style.display = 'none'
  document.getElementById('infos').style.display = 'flex'
  updateInfos()
  worker.postMessage({
    instruction: 'start',
    canvasData: targetCanvasData,
    nOfRects: maxRects,
    cycles: numberOfCycles,
    top: topSelection,
    generations: numberOfGenerations,
    nRectsFromOld: nRectsFromOld,
    exponent: reductionFactor,
    topForNewGen: topSelection,
    maxColorDifference: maxColorDifference,
    maxSizeDifference: maxSizeDifference,
    maxRotationDifference: maxRotationDifference,
    maxOffset: maxRotationDifference,
    maxAlphaDifference: maxAlphaDifference,
    rectMinSizeStart: rectMinSizeStart,
    rectMinSizeEnd: rectMinSizeEnd,
    rectMaxSizeStart: rectMaxSizeStart,
    rectMaxSizeEnd: rectMaxSizeEnd
  })
  worker.addEventListener('message', handleResponse)
}

function handleResponse(event) {
  switch (event.data.info) {
    case 'rectangles':
      currentCycle++
      drawRectOnCanvas(event.data.rectangle, outputCTX)
      highlightRect(event.data.rectangle.x, event.data.rectangle.y)
      //drawVertices(event.data.vertices)
      //if(event.data.drawPeri) drawPerimeter(event.data.perimeter, event.data.vertices[3].Ry)
      rectArrayInfo.push(...Object.values(event.data.rectangle))
      pixelsChecked = event.data.pixelChecked
      updateInfos()
      break;
    case 'input canvas data':
      const dataArray = new Uint8ClampedArray(event.data.inputData)
      const inputData = new ImageData(dataArray, width, height)
      document.getElementById('input-canvas').style.display = 'inline-block'
      inputCTX.putImageData(inputData, 0, 0)
      timeToComplete = (new Date() - msTime) / 1000
      document.getElementById('highlight-div').style.display = 'none'
      outputCanvas.style.display = 'none'
      difference = calculateDifferenceCanvas(dataArray, targetCanvasData.data)
      difference = Math.round(difference * 100 * 100) / 100
      updateInfos()
      //displayOutputText()
      break
  }
}

function prepareCanvas(image) {
  targetCanvas.width = width
  targetCanvas.height = height
  targetCTX.drawImage(image, 0, 0)
  outputCanvas.width = width
  outputCanvas.height = height
  outputCTX.fillStyle = 'white'
  outputCTX.fillRect(0, 0, width, height)
  inputCanvas.width = width
  inputCanvas.height = height
}

function drawRectOnCanvas(rectangle, canvasCTX) {
  const colorString = Rectangle.generateRBGString(rectangle.red, rectangle.green, rectangle.blue, rectangle.alpha)
  canvasCTX.save()
  canvasCTX.fillStyle = colorString
  canvasCTX.translate(rectangle.x, rectangle.y)
  canvasCTX.rotate(rectangle.rad)
  canvasCTX.fillRect(-rectangle.width / 2, -rectangle.height / 2, rectangle.width, rectangle.height)
  canvasCTX.restore()
}

function drawVertices(vertices) {
  for (const vertex of vertices) {
    outputCTX.fillStyle = 'black'
    outputCTX.fillRect(vertex.Rx - 1, vertex.Ry - 1, 2, 2)
  }
}

function drawPerimeter(perimeter, beginning) {
  outputCTX.fillStyle = 'red'
  if (beginning < 0) beginning = 1
  for (let i = beginning; i < perimeter.length; i++) {
    if (perimeter[i] === undefined || (perimeter[i].length === 1 && (perimeter[i][0] === 0 || perimeter[i][0] === width))) continue
    outputCTX.fillRect(perimeter[i][0], i, 1, 1)
    outputCTX.fillRect(perimeter[i][perimeter[i].length - 1], i, 1, 1)
  }
}

function highlightRect(x, y) {
  const div = document.getElementById('highlight-div')
  div.style.left = (x - 10) + 'px'
  div.style.top = (y - 10) + 'px'
  console.log
}

function calculateDifferenceCanvas(array1, array2) {
  let tot = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = (y * width + x) * 4
      tot += calculateDifference(
        [array1[pos], array1[pos + 1], array1[pos + 2]],
        [array2[pos], array2[pos + 1], array2[pos + 2]])
    }
  }
  return tot / (width * height * 4)
}

function calculateDifference(color1, color2) {  //Differenza con pitagora (prob faster), fare tests con rettangoli uguali 
  dRsqr = ((color1[0] - color2[0]) / 255) ** 2
  dGsqr = ((color1[1] - color2[1]) / 255) ** 2
  dBsqr = ((color1[2] - color2[2]) / 255) ** 2
  deltaC = Math.sqrt(dRsqr + dGsqr + dBsqr)
  return deltaC / 1.7320508075688772
}

function calculateDifference2(color1, color2) {
  dRsqr = ((color1[0] - color2[0]) / 255) ** 2
  dGsqr = ((color1[1] - color2[1]) / 255) ** 2
  dBsqr = ((color1[2] - color2[2]) / 255) ** 2
  Rmod = (color1[0] + color2[0]) / (2 * 255)
  Rcomp = (2 + Rmod) * dRsqr
  Gcomp = 4 * dGsqr
  Bcomp = (3 - Rmod) * dBsqr
  deltaC = Math.sqrt(Rcomp + Gcomp + Bcomp)
  return deltaC / 3
}

function displayOutputText() {
  const div = document.getElementById('output-text-div')
  div.style.display = 'block'
  div.innerHTML = rectArrayInfo
}

function calcualteInitialDifference() {
  let difference = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = (y * width + x) * 4
      difference += calculateDifference([0, 0, 0], [targetCanvasData.data[pos], targetCanvasData.data[pos + 1], targetCanvasData.data[pos + 2]])
    }
  }
  return difference
}

const button = document.getElementById('start-button')
function start() {
  setRNumber()
  setSizes()
  setNewRFromOld()
  init()
}

function setRNumber() {
  numberOfCycles = document.getElementById('cycles-input').valueAsNumber
  maxRects = document.getElementById('starting-R-input').valueAsNumber
  topSelection = document.getElementById('top-selection-input').valueAsNumber
  numberOfGenerations = document.getElementById('n-generation-input').valueAsNumber
  nRectsFromOld = document.getElementById('n-R-from-old-input').valueAsNumber
}

function setSizes() {
  rectMinSizeStart = document.getElementById('min-start-size-input').valueAsNumber
  rectMinSizeEnd = document.getElementById('min-end-size-input').valueAsNumber
  rectMaxSizeStart = document.getElementById('max-start-size-input').valueAsNumber
  rectMaxSizeEnd = document.getElementById('max-end-size-input').valueAsNumber
  reductionFactor = document.getElementById('reduction-factor-input').valueAsNumber
  
}

function setNewRFromOld() {
  maxColorDifference = document.getElementById('color-difference-input').valueAsNumber
  clamp(maxColorDifference, 0, 100)
  maxSizeDifference = document.getElementById('size-difference-input').valueAsNumber
  clamp(maxSizeDifference, -5, 100)
  maxRotationDifference = document.getElementById('rotation-difference-input').valueAsNumber
  clamp(maxRotationDifference, 0, 45)
  maxRotationDifference = Math.round(Rectangle.degToRad(maxRotationDifference) * 100) / 100
  maxOffset = document.getElementById('position-difference-input').valueAsNumber
  maxAlphaDifference = document.getElementById('alpha-difference-input').valueAsNumber
  clamp(maxAlphaDifference, 0.1, 1)
}

function updateInfos(){
  const TR = numberOfCycles * (maxRects + numberOfGenerations * topSelection * nRectsFromOld) 

  const info = document.getElementById('infos')
  const templateBaseInfo = `
    <div class="single-info">
      <div class="info-name">Total R</div>
      <div class="info-value">${mark3Digits(TR)}</div>
    </div>
    <div class="single-info">
      <div class="info-name">cycle</div>
      <div class="info-value">${currentCycle}/${numberOfCycles}</div>
    </div>
    <div class="single-info">
      <div class="info-name">Starting R</div>
      <div class="info-value">${maxRects}</div>
    </div>
    <div class="single-info">
      <div class="info-name">Pixels checked</div>
      <div class="info-value">${mark3Digits(pixelsChecked)}</div>
    </div>`

  info.innerHTML = templateBaseInfo
  const templateGenerationInfo = `
    <div class="single-info">
      <div class="info-name">N generations</div>
      <div class="info-value">${numberOfGenerations}</div>
    </div>
    <div class="single-info">
      <div class="info-name">Top selection</div>
      <div class="info-value">${topSelection}</div>
    </div>
    <div class="single-info">
      <div class="info-name">New R from old</div>
      <div class="info-value">${nRectsFromOld}</div>
    </div>`
  const templateEnd = `
    <div class="single-info">
      <div class="info-name">Time to complete</div>
      <div class="info-value">${timeToComplete}</div>
    </div>
    <div class="single-info">
      <div class="info-name">Difference</div>
      <div class="info-value">${difference}</div>
    </div>`

  if(numberOfGenerations>0) info.innerHTML += templateGenerationInfo
  if(difference != -1) info.innerHTML += templateEnd
}

function quantityInfo(){
  document.getElementById('difference-explanation-window').style.display = 'none'
  const infoDiv = document.getElementById('quantity-explanation-window')
  if(infoDiv.style.display === 'none') infoDiv.style.display = 'flex'
  else infoDiv.style.display = 'none'
}

function mark3Digits(number){
  number = number.toString().split('').reverse().join('') 
  number = number.replace(/(.{3})/g,"$1'")
  number = number.split('').reverse()
  if(number.length % 4 === 0) number.shift()
  return number.join('')
}

function showQuanitiyExample(){
  const div = document.getElementById('quantity-example-div')
  div.innerHTML = '';
  const cycles = document.getElementById('cycles-input').valueAsNumber
  const startR = document.getElementById('starting-R-input').valueAsNumber
  const generations = document.getElementById('n-generation-input').valueAsNumber
  const topSelection = document.getElementById('top-selection-input').valueAsNumber
  const newR = document.getElementById('n-R-from-old-input').valueAsNumber
  const TR = cycles * (startR + generations * topSelection * newR) 
  const baseTemplate = `
    With the current settings,<b> ${cycles}</b> rectangles will be used to make the final image.<br>
    For each cycle, <b>${startR}</b> rectangles will be generated initially.<br>
  `
  div.innerHTML += baseTemplate
  const noGenTemplate = 'Since there are <b>0</b> generations, no further selections will be made after the initial generation.<br>'
  const genTemplate = `From the initial generation, the best <b>${topSelection}</b> rectangles will be selected and used to create the next generation.<br>For each best rectangle, <b> ${newR}</b> new rectangles will be created. This process will repeat for <b>${generations}</b> times <br>`
  if(generations === 0) div.innerHTML += noGenTemplate
  else div.innerHTML += genTemplate
  const endTemplate = `A total of <b>${mark3Digits(TR)}</b> rectangles will be checked`
  div.innerHTML += endTemplate
}

function differenceInfo(){
  document.getElementById('quantity-explanation-window').style.display = 'none'
  const div = document.getElementById('difference-explanation-window')
  if(div.style.display === 'none') div.style.display = 'flex'
  else div.style.display = 'none'
}

function clamp(num, min, max){
  return Math.min(Math.max(num, min), max);
} 