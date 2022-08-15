let rectangle
let canvasWidth
let canvasHeight
let targetData

let nOfRects // How many rectangle generate in first generation per cycle
let cycles // How many cycles (aka output rectangles)
let topForNewGen  // How many rectangles select to make new gen
let generations  // Number of generations
let vertices
let perimeterArray
let outputArray

let bestRect 
let bestPerimeter
let bestScore = 0
let bestVertices

if ('function' === typeof importScripts) {
  console.log('worker start')
  importScripts('./rectangle-class.js');
  self.addEventListener('message', function(event){
    if(event.data.instruction === 'start'){
      targetData = event.data.canvasData
      canvasWidth = event.data.canvasData.width
      canvasHeight = event.data.canvasData.height
      nOfRects = event.data.nOfRects
      cycles = event.data.cycles
      topForNewGen = event.data.top
      generations = event.data.generations
      outputArray = new Array(canvasWidth * canvasHeight * 4)
      outputArray.fill(255)
      for(let i = 0; i < cycles; i ++){
        for(let j = 0; j < nOfRects; j++){
          rectangle = Rectangle.randomRect(canvasWidth, canvasHeight, 100, 2)
          vertices = rectangle.calculateVertices()
          perimeterArray = rectangle.calculatePerimeterArray(vertices, canvasWidth, canvasHeight)
          const difference = checkRectangleDifference(rectangle, perimeterArray, outputArray, vertices[3].Ry)
          if(difference > bestScore){
            bestRect = rectangle
            bestPerimeter = perimeterArray
            bestScore = difference
            bestVertices = vertices
          }
        }
        if(bestScore === 0) continue
        self.postMessage({info: 'rectangles', rectangle: bestRect, vertices: bestVertices, perimeter: bestPerimeter})
        drawRectOnInput(bestRect, bestPerimeter, bestVertices[3].Ry)
        bestScore = 0
      }
      self.postMessage({info:'input canvas data', inputData: outputArray})
      console.log('worker done')
    }
  })
}

function checkRectangleDifference(rectangle, perimeter, outputArray, startingPoint){
  let inputTargetDifference = 0
  let outputTargetDifference = 0
  for(let y = startingPoint; y < perimeter.length; y ++){
    if(perimeter[y] === undefined) continue
    if(perimeter[y].length === 1 && (perimeter[y] === 0 || perimeter[y] === canvasWidth)) continue
    for(let x = perimeter[y][0]; x < perimeter[y][perimeter[y].length-1]; x++){
      const pos = (y * canvasWidth + x) * 4
      const color1 = [outputArray[pos], outputArray[pos +1], outputArray[pos + 2]]
      const color2 = [targetData.data[pos], targetData.data[pos+1], targetData.data[pos+2]]
      const color3 = add2colors(
        [rectangle.red, rectangle.green, rectangle.blue, rectangle.alpha *  255],
        [outputArray[pos], outputArray[pos+1], outputArray[pos+2], outputArray[pos+3]])
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

function calculateDifference(color1,color2){  //Differenza con pitagora (prob faster), fare tests con rettangoli uguali 
    dRsqr = ((color1[0] - color2[0]) / 255  ) ** 2
    dGsqr = ((color1[1] - color2[1]) / 255) ** 2
    dBsqr = ((color1[2] - color2[2]) / 255) ** 2
   
    deltaC = Math.sqrt(dRsqr + dGsqr + dBsqr)
    return deltaC / 1.7320508075688772
}

function add2colors(color1,color2){    //[R,G,B,A]
  for(let i = 0; i < 3; i++){  // Converto i numeri da 0-255 a 0-1 RGB
      color1[i] = color1[i] / 255
      color2[i] = color2[i] / 255
  }
  
  A = 1 -(1 - color1[3]) * (1 - color2[3]) //Calcolo opacità
  R = color2[0] * color2[3] / A + color1[0] * color1[3] * (1 - color2[3]) / A;  //result RED
  G = color2[1] * color2[3] / A + color1[1] * color1[3] * (1 - color2[3]) / A;  //result GREEN
  B = color2[2] * color2[3] / A + color1[2] * color1[3] * (1 - color2[3]) / A;  //result BLUE
  return [R *  255, G * 255 , B *  255, A]  
  //return [Math.round(R * 255), Math.round(G * 255), Math.round(B * 255)]
}

function add2colors2(color1,color2){
R = (color1[0] + color2[0]) / 2
G = (color1[1] + color2[1]) / 2
B = (color1[2] + color2[2]) / 2
return [R, G, B, 1]
}

function drawRectOnInput(rectangle, perimeter, startingPoint){
  for(let y = startingPoint; y < perimeter.length; y ++){
    if(perimeter[y] === undefined) continue
    if(perimeter[y].length === 1 && (perimeter[y] === 0 || perimeter[y] === canvasWidth)) continue
    for(let x = perimeter[y][0]; x < perimeter[y][perimeter[y].length-1]; x++){
      const pos = (y * canvasWidth + x) * 4
      const color = add2colors3(
        [outputArray[pos], outputArray[pos+1], outputArray[pos+2], outputArray[pos+3]/255],
        [rectangle.red, rectangle.green, rectangle.blue, rectangle.alpha ])
      outputArray[pos] = color[0]
      outputArray[pos+1] = color[1]
      outputArray[pos+2] = color[2]
    }
  }
}

function add2colors3(color1, color2){
  const premultiplied1 = [color1[0] * color1[3], color1[1] * color1[3], color1[2] * color1[3]]
  const premultiplied2 = [color2[0] * color2[3], color2[1] * color2[3], color2[2] * color2[3]]
  const interpolated = [
    premultiplied1[0] * 0.5 + premultiplied2[0] * 0.5,
    premultiplied1[1] * 0.5 + premultiplied2[1] * 0.5,
    premultiplied1[2] * 0.5 + premultiplied2[2] * 0.5
  ]
  const alpha = color1[3] * 0.5 + color2[3] * 0.5
  const finalColor = [interpolated[0]*alpha, interpolated[1]*alpha, interpolated[2]*alpha, alpha]
  return finalColor
  
}

function add2colors3(color1, color2){
  const premultiplied1 = [color1[0] * color1[3], color1[1] * color1[3], color1[2] * color1[3]]
  const premultiplied2 = [color2[0] * color2[3], color2[1] * color2[3], color2[2] * color2[3]]
  const interpolated = [
    premultiplied1[0] * 0.5 + premultiplied2[0] * 0.5,
    premultiplied1[1] * 0.5 + premultiplied2[1] * 0.5,
    premultiplied1[2] * 0.5 + premultiplied2[2] * 0.5
  ]
  const alpha = color1[3] * 0.5 + color2[3] * 0.5
  const finalColor = [interpolated[0]*alpha, interpolated[1]*alpha, interpolated[2]*alpha, alpha]
  return finalColor
}