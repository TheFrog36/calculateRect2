let rectangle
let canvasWidth
let canvasHeight
let targetData

let data
let exponent 
let nOfRects // How many rectangle generate in first generation per cycle
let cycles // How many cycles (aka output rectangles)
let topForNewGen  // How many rectangles select to make new gen
let generations   // Number of generations
let newRectsFromOld

let vertices
let perimeterArray
let outputArray
let drawPeri = false  // test variable to see whick rects are post gen 1

let bestRect
let bestPerimeter
let bestScore = 0
let bestVertices
let hasFired = false
let bestScoresArray = new Array(10).fill(0)
let bestRectArray = new Array(10)

let pixelChecked = 0


let gen = 0  // USed to show from whick generation the best rectangle comes from
if ('function' === typeof importScripts) {
  console.log('worker start')
  importScripts('./rectangle-class.js');
  self.addEventListener('message', function (event) {
    if (event.data.instruction === 'start') {
      data = event.data
      targetData = data.canvasData
      canvasWidth = data.canvasData.width
      canvasHeight = data.canvasData.height
      nOfRects = data.nOfRects
      cycles = data.cycles
      topForNewGen = data.top
      generations = data.generations
      newRectsFromOld = data.nRectsFromOld
      exponent = data.exponent
      topForNewGen = data.topSelection

      outputArray = new Array(canvasWidth * canvasHeight * 4)
      outputArray.fill(255)
      let counter = 0
      for (let i = 0; i < cycles; i++) {
        drawPerimeter = false
        const reduFact = ((cycles - i) / cycles) ** exponent
        const minSize = reduFact * data.rectMinSizeStart + data.rectMinSizeEnd
        const maxSize = reduFact * data.rectMaxSizeStart + data.rectMaxSizeEnd
        for (let j = 0; j < nOfRects; j++) {
          counter++
          rectangle = Rectangle.randomRect(canvasWidth, canvasHeight, maxSize, minSize)
          const pos = (rectangle.y * canvasWidth + rectangle.x) * 4
          rectangle.putColors(targetData.data[pos], targetData.data[pos + 1], targetData.data[pos + 2])
          vertices = rectangle.calculateVertices()
          perimeterArray = rectangle.calculatePerimeterArray(vertices, canvasWidth, canvasHeight)
          pixelChecked += calculateCheckedPixel(perimeterArray, vertices[3].Ry)
          const difference = checkRectangleDifference(rectangle, perimeterArray, outputArray, vertices[3].Ry)
          if (generations != 0 && difference > bestScoresArray[9] ) orderedInsertion(bestScoresArray, bestRectArray, difference, rectangle)
          if (difference > bestScore) {
            bestRect = rectangle
            bestPerimeter = perimeterArray
            bestScore = difference
            bestVertices = vertices
          }
        }
        // Adesso ho la gen 1 array
        for (let j = 0; j < generations; j++) {
          //console.log(bestRectArray)
          const oldTopRects = bestRectArray
          for (let k = 0; k < oldTopRects.length; k++) {
            for(let l = 0; l < newRectsFromOld; l++){
              counter++
              if(oldTopRects[k] === undefined) continue
              rectangle = Rectangle.generateSimilarRect(oldTopRects[k], canvasHeight, canvasWidth, data.maxColorDifference, data.maxSizeDifference, data.maxRotationDifference, data.maxOffset, data.maxAlphaDifference)
              vertices = rectangle.calculateVertices()
              perimeterArray = rectangle.calculatePerimeterArray(vertices, canvasWidth, canvasHeight)
              pixelChecked += calculateCheckedPixel(perimeterArray, vertices[3].Ry)
              const difference = checkRectangleDifference(rectangle, perimeterArray, outputArray, vertices[3].Ry)
               if (difference > bestScoresArray[9]) orderedInsertion(bestScoresArray, bestRectArray, difference, rectangle)
               if (difference > bestScore) {
                gen = j
                drawPeri = true
                bestRect = rectangle
                bestPerimeter = perimeterArray
                bestScore = difference
                bestVertices = vertices
              }
            }
          }
          
        }
        
        bestScoresArray.fill(0)
        bestRectArray.fill()
        if (bestScore === 0) continue
        //if(i%10 ===0) console.log('gen: ' + (gen + 1) + ' cycle: ' + i)
        gen = 0
        //bestRect.alpha = (bestRect.alpha + 1) / 2  //Only when using add2colors2 in checkRectangleDifference
        self.postMessage({ 
          info: 'rectangles', 
          rectangle: bestRect, 
          vertices: bestVertices, 
          perimeter: bestPerimeter, 
          emprovement: bestScore, 
          drawPeri: drawPeri,
          pixelChecked: pixelChecked })
        drawRectOnInput(bestRect, bestPerimeter, bestVertices[3].Ry)
        bestScore = 0
      }
      self.postMessage({ info: 'input canvas data', inputData: outputArray })
      console.log('worker done')
    }
  })
}

function checkRectangleDifference(rectangle, perimeter, outputArray, startingPoint) {
  let inputTargetDifference = 0
  let outputTargetDifference = 0
  for (let y = startingPoint; y < perimeter.length; y++) {
    if (perimeter[y] === undefined) continue
    if (perimeter[y].length === 1 && (perimeter[y] === 0 || perimeter[y] === canvasWidth)) continue
    for (let x = perimeter[y][0]; x < perimeter[y][perimeter[y].length - 1]; x++) {
      const pos = (y * canvasWidth + x) * 4
      const color1 = [outputArray[pos], outputArray[pos + 1], outputArray[pos + 2]]
      const color2 = [targetData.data[pos], targetData.data[pos + 1], targetData.data[pos + 2]]
      const color3 = add2colors(
        [rectangle.red, rectangle.green, rectangle.blue, rectangle.alpha],
        [outputArray[pos], outputArray[pos + 1], outputArray[pos + 2], outputArray[pos + 3] / 255])
      inputTargetDifference += calculateDifference(color1, color2)
      outputTargetDifference += calculateDifference(color2, color3)
    }
  }
  return inputTargetDifference - outputTargetDifference
}

// function calculateDifference(color1, color2) {
//   dRsqr = ((color1[0] - color2[0]) / 255) ** 2
//   dGsqr = ((color1[1] - color2[1]) / 255) ** 2
//   dBsqr = ((color1[2] - color2[2]) / 255) ** 2
//   Rmod = (color1[0] + color2[0]) / (2 * 255)
//   Rcomp = (2 + Rmod) * dRsqr
//   Gcomp = 4 * dGsqr
//   Bcomp = (3 - Rmod) * dBsqr
//   deltaC = Math.sqrt(Rcomp + Gcomp + Bcomp)
//   return deltaC / 3
// }

function calculateDifference(color1, color2) {  //Differenza con pitagora (prob faster), fare tests con rettangoli uguali 
  dRsqr = ((color1[0] - color2[0]) / 255) ** 2
  dGsqr = ((color1[1] - color2[1]) / 255) ** 2
  dBsqr = ((color1[2] - color2[2]) / 255) ** 2

  deltaC = Math.sqrt(dRsqr + dGsqr + dBsqr)
  return deltaC / 1.7320508075688772
}

function drawRectOnInput(rectangle, perimeter, startingPoint) {
  for (let y = startingPoint; y < perimeter.length; y++) {
    if (perimeter[y] === undefined) continue
    if (perimeter[y].length === 1 && (perimeter[y] === 0 || perimeter[y] === canvasWidth)) continue
    for (let x = perimeter[y][0]; x < perimeter[y][perimeter[y].length - 1]; x++) {
      const pos = (y * canvasWidth + x) * 4
      const color = add2colors(
        [rectangle.red, rectangle.green, rectangle.blue, rectangle.alpha],
        [outputArray[pos], outputArray[pos + 1], outputArray[pos + 2], outputArray[pos + 3] / 255])
      outputArray[pos] = color[0]
      outputArray[pos + 1] = color[1]
      outputArray[pos + 2] = color[2]
    }
  }
}



function add2colors(color1, color2) {
  const interpolated = [
    color1[0] * color1[3] + color2[0] * (1 - color1[3]),
    color1[1] * color1[3] + color2[1] * (1 - color1[3]),
    color1[2] * color1[3] + color2[2] * (1 - color1[3]),
  ]
  const alpha = color1[3] + (1 - color1[3])
  const finalColor = [interpolated[0] * alpha, interpolated[1] * alpha, interpolated[2] * alpha, alpha]
  return finalColor
}

function add2colors2(color1, color2) {
  const red = (color1[0] + color2[0]) / 2
  const green = (color1[1] + color2[1]) / 2
  const blue = (color1[2] + color2[2]) / 2
  return [red, green, blue]
}

function calcualteInitialDifference() {
  let difference = 0
  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      const pos = (y * canvasWidth + x) * 4
      difference += calculateDifference([outputArray[pos], outputArray[pos + 1], outputArray[pos + 2]], [targetData.data[pos], targetData.data[pos + 1], targetData.data[pos + 2]])
    }
  }
  difference = difference / (canvasHeight * canvasWidth * 4)
  difference = Math.round(difference * 10000) / 100
  return difference
}

function orderedInsertion(scoreArray, rectArray, score, rectangle) {
  let pos
  for (let i = 0; i < scoreArray.length; i++) {
    if (score < scoreArray[i]) continue
    pos = i
    break;
  }
  for (let i = scoreArray.length - 1; i >= pos; i--) {
    scoreArray[i + 1] = scoreArray[i];
    rectArray[i + 1] = rectArray[i]
  }

  scoreArray[pos] = score
  scoreArray.pop()
  rectArray[pos] = rectangle
  rectArray.pop()
}

function calculateCheckedPixel(array, start){
  if(start < 0) start = 0
  let pixels = 0
  for(let i = start; i < array.length; i++){
    if(array[i] === undefined) console.log(array, start)
    if(array[i].length === 1) pixels++
    else pixels += array[i][array[i].length-1] - array[i][0]
  }
  return pixels
}