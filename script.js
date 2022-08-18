let width // Canvas width based on img width
let height // Canvas height based on img height

const maxRects = 1000 // How many rects are created per cycle
const topSelection = 10 // Select the top 10 from a generation
const numberOfGenerations = 20 // * 10 // How many generations 
const nRectsFromOld = 10 // Generate N new rects from each rect of past gen
const numberOfCycles = 3000 // How many rects will be added to the final image
let rectMinSizeStart
let rectMinSizeEnd
let rectMaxSizeStart
let rectMaxSizeEnd
console.log(numberOfCycles * (maxRects + numberOfGenerations * topSelection * nRectsFromOld) + ' tot rects')
// let exponent
let rectArrayInfo = []
let msTime = 0

const targetCanvas = document.getElementById('target-canvas')
const targetCTX = targetCanvas.getContext('2d')
const outputCanvas = document.getElementById('output-canvas')
const outputCTX = outputCanvas.getContext('2d')
const inputCanvas = document.getElementById('input-canvas')
const inputCTX = inputCanvas.getContext('2d')

const worker = new Worker('./worker.js')
let targetCanvasData // var for image pixel data

const imgUrl = './images/cyberpunk.png'

function init(){
  msTime = new Date()
  const targetImage = new Image()
  targetImage.src = imgUrl
  targetImage.onload = () => {
    width = targetImage.width
    height = targetImage.height
    prepareCanvas(targetImage)
    targetCanvasData = targetCTX.getImageData(0, 0, width, height)
    worker.postMessage({
      instruction: 'start', 
      canvasData: targetCanvasData,
      nOfRects: maxRects,
      cycles: numberOfCycles,
      top: topSelection,
      generations: numberOfGenerations,
      nRectsFromOld: nRectsFromOld
    })
    worker.addEventListener('message', handleResponse)
  }
}

function handleResponse(event){
  switch(event.data.info){
    case 'rectangles':
      drawRectOnCanvas(event.data.rectangle, outputCTX)
      highlightRect(event.data.rectangle.x, event.data.rectangle.y)
      //drawVertices(event.data.vertices)
      //if(event.data.drawPeri) drawPerimeter(event.data.perimeter, event.data.vertices[3].Ry)
      rectArrayInfo.push(...Object.values(event.data.rectangle))
      break;
    case 'input canvas data':
      const dataArray = new Uint8ClampedArray(event.data.inputData)
      const inputData = new ImageData(dataArray, width, height)
      document.getElementById('input-canvas').style.display = 'inline-block'
      inputCTX.putImageData(inputData, 0, 0)
      msTime = new Date() - msTime
      console.log('Time to complete: ' + (msTime/1000) + ' seconds')
      document.getElementById('highlight-div').style.display = 'none'
      // outputCanvas.style.display = 'none'
      let diff = calculateDifferenceCanvas(dataArray, targetCanvasData.data)
      diff = Math.round(diff*100*100)/100
      console.log('Difference: ' + diff + '%')
      //displayOutputText()
      break
  }
}

function prepareCanvas(image){
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

function drawRectOnCanvas(rectangle, canvasCTX){
  const colorString = Rectangle.generateRBGString(rectangle.red, rectangle.green, rectangle.blue, rectangle.alpha)
  canvasCTX.save()
  canvasCTX.fillStyle = colorString
  canvasCTX.translate(rectangle.x, rectangle.y)
  canvasCTX.rotate(rectangle.rad)
  canvasCTX.fillRect(-rectangle.width / 2, -rectangle.height / 2, rectangle.width, rectangle.height)
  canvasCTX.restore()
}

function drawVertices(vertices){
  for(const vertex of vertices){
    outputCTX.fillStyle = 'black'
    outputCTX.fillRect(vertex.Rx-1, vertex.Ry-1, 2 ,2)
  }
}

function drawPerimeter(perimeter, beginning){
  outputCTX.fillStyle = 'red'
  if(beginning < 0) beginning = 1
  for(let i = beginning; i < perimeter.length; i++){
    if(perimeter[i] === undefined || (perimeter[i].length === 1 && (perimeter[i][0] === 0 || perimeter[i][0] === width))) continue 
    outputCTX.fillRect(perimeter[i][0], i, 1, 1)
    outputCTX.fillRect(perimeter[i][perimeter[i].length-1], i, 1, 1)
  }
}

function highlightRect(x, y){
  const div = document.getElementById('highlight-div')
  div.style.left = (x -10) + 'px'
  div.style.top = (y - 10) + 'px' 
  console.log
}

function calculateDifferenceCanvas(array1, array2){
  let tot = 0
  for(let y = 0; y < height; y++){
    for(let x = 0; x < width; x++){
      const pos = (y * width + x) * 4
      tot += calculateDifference(
        [array1[pos], array1[pos+1], array1[pos+2]],
        [array2[pos], array2[pos+1], array2[pos+2]])
    }
  }
  return tot/(width * height * 4)
}

function calculateDifference(color1,color2){  //Differenza con pitagora (prob faster), fare tests con rettangoli uguali 
  dRsqr = ((color1[0] - color2[0]) / 255  ) ** 2
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

function displayOutputText(){
  const div = document.getElementById('output-text-div')
  div.style.display = 'block'
  div.innerHTML = rectArrayInfo
}

function calcualteInitialDifference(){
  let difference = 0
  for(let y = 0; y < height; y++){
    for(let x = 0; x < width; x++){
      const pos = (y * width + x) * 4
      difference += calculateDifference([0,0,0], [targetCanvasData.data[pos], targetCanvasData.data[pos+1], targetCanvasData.data[pos+2]])
    }
  }
  return difference 
}

function start(){

}

init()