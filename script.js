let width // Canvas width based on img width
let height // Canvas height based on img height
const maxRects = 200 // How many rects are created per cycle
const topSelection = 1 // Select the top 10 from a generation
const numberOfGenerations = 1 // How many generations 
const numberOfCycles = 20000 // How many rects will be added to the final image

let msTime = 0

const targetCanvas = document.getElementById('target-canvas')
const targetCTX = targetCanvas.getContext('2d')
const outputCanvas = document.getElementById('output-canvas')
const outputCTX = outputCanvas.getContext('2d')
const inputCanvas = document.getElementById('input-canvas')
const inputCTX = inputCanvas.getContext('2d')

const worker = new Worker('./worker.js')
let targetCanvasData // var for image pixel data

const imgUrl = './images/monalisa.png'

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
      generations: numberOfGenerations
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
      //drawPerimeter(event.data.perimeter, event.data.vertices[3].Ry, event.data.rectangle)
      break;
    case 'input canvas data':
      const dataArray = new Uint8ClampedArray(event.data.inputData)
      const inputData = new ImageData(dataArray, width, height)
      inputCTX.putImageData(inputData, 0, 0)
      msTime = new Date() - msTime
      console.log('Time to complete: ' + (msTime/1000) + ' seconds')
      document.getElementById('highlight-div').style.display = 'none'
      outputCanvas.style.display = 'none'
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

function drawPerimeter(perimeter, beginning, rectangle){
  outputCTX.fillStyle = 'black'
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
init()