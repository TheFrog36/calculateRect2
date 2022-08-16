class Rectangle {

  constructor(red, green, blue, alpha, width, height, rad, x, y){
    this.red = red
    this.green = green
    this.blue = blue
    this.alpha = alpha
    this.width = width
    this.height = height
    this.rad = rad
    this.x  = x
    this.y = y
  }

  fillColors() {
    this.red = Math.round(Math.random() * 255)
    this.green = Math.round(Math.random() * 255)
    this.blue = Math.round(Math.random() * 255)
    this.alpha = Math.round(Math.random() * 100) / 100
    //this.alpha = 1
  }

  putColors(R, G, B){
    this.red = R
    this.green = G
    this.blue = B
    this.alpha = Math.round((Math.random() * 0.9 + 0.1) * 100) / 100  
  }

  static generateRBGString(red, green, blue, alpha) {
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`
  }

  generateCenterCoordinates(canvasWidth, canvasHeight) {
    const x = Math.random() * canvasWidth
    const y = Math.random() * canvasHeight
    this.x = Math.round(x)
    this.y = Math.round(y)
  }

  generateDimensions(canvasWidth, canvasHeight, maxSize, minSize){
    // this.width = Math.round(Math.random() * 100 + 1)
    // this.height = Math.round(Math.random() * 100 + 1)
    this.width = Math.round(Math.random() * (maxSize - minSize) + minSize)
    this.height = Math.round(Math.random() * (maxSize - minSize) + minSize)
  }

  generateRotation(){
    const randomAngle = Math.random() * 90
    const rad = randomAngle * Math.PI / 180
    this.rad = Math.round(rad * 100) / 100
  }

  generateOuterRect(x, y, rectWidth, rectHeight, rotationRad) {
    const newWidth = (rectWidth * Math.cos(rotationRad)) + (rectHeight * Math.sin(rotationRad))  //Dimensioni del rettangolo che contiene il rettangolo precedente ruotato
    const newHeight = (rectWidth * Math.sin(rotationRad)) + (rectHeight * Math.cos(rotationRad))
    const topLeftX = Math.max(x - newWidth / 2, 0)
    const topLeftY = Math.max(y - newHeight / 2, 0)
    const botRightX = Math.min(x + newWidth / 2, width)
    const botRightY = Math.min(y + newHeight / 2, height)
    const adjustedNewWidth = botRightX - topLeftX
    const adjustedNewHeight = botRightY - topLeftY
    return [Math.floor(topLeftX), Math.floor(topLeftY), Math.floor(adjustedNewWidth), Math.floor(adjustedNewHeight)]
  }

  static randomRect(canvasWidth, canvasHeight, maxSize, minSize) {
    const newRect = new Rectangle()
    //newRect.fillColors()
    newRect.generateCenterCoordinates(canvasWidth, canvasHeight)
    newRect.generateDimensions(canvasWidth, canvasHeight, maxSize, minSize)
    newRect.generateRotation()
    return newRect
  }

  static generateSimilarRect(rectangle, canvasHeight, canvasWidth){
    const maxColorDifference = 30
    const maxSizeDifference = 100
    const maxRotationDifference = this.degToRad(15)
    const maxOffset = 100
    const maxAlphaDifference = 0.5
    const red = Math.round(this.clamp(rectangle.red + Math.random() * (maxColorDifference * 2) - maxColorDifference, 0, 255))
    const green = Math.round(this.clamp(rectangle.green + Math.random() * (maxColorDifference * 2) - maxColorDifference, 0, 255))
    const blue = Math.round(this.clamp(rectangle.blue + Math.random() * (maxColorDifference * 2) - maxColorDifference, 0, 255))
    const alpha = Math.round(this.clamp(rectangle.alpha + Math.random() * maxAlphaDifference * 2 - maxAlphaDifference, 0.1, 1) * 100) / 100
    const width = Math.round(Math.max(2, rectangle.width + Math.random() * (maxSizeDifference * 2) - maxSizeDifference))
    const height = Math.round(Math.max(2, rectangle.height + Math.random() * (maxSizeDifference * 2) - maxSizeDifference))
    const rad = Math.round((rectangle.rad + Math.random() * maxRotationDifference * 2 - maxRotationDifference) * 100) / 100
    const x = this.clamp(rectangle.x + Math.random() * maxOffset * 2 - maxOffset, 0, canvasWidth)
    const y = this.clamp(rectangle.y + Math.random() * maxOffset * 2 - maxOffset, 0, canvasHeight)
    const newRectangle = new Rectangle(red, green, blue, alpha, width, height, rad, x, y)
    return newRectangle
  }

  calculateVertices(){ // Calcolo i vertici del rettangolo ruotato
    const point1 = this.calculateRectVertex(-1, 1)
    const point2 = this.calculateRectVertex(1, 1)
    const point3 = {Rx: point1.Rx * -1, Ry: point1.Ry * -1}  // Rispetto l'origine, il terzo e quarto punto sono speculari a 1 e 2. 
    const point4 = {Rx: point2.Rx * -1, Ry: point2.Ry * -1}  // ^ cosi evito di fare ulteriori seno coseno
    return this.positionedVertices([point1, point2, point3, point4])
  }
  
  calculateRectVertex(xSide, ySide) {  // Side -1 || 1
    const width = this.width
    const height = this.height
    const rad = this.rad
    const Ox = width / 2 * xSide
    const Oy = height / 2 * ySide
    let Rx = (Ox * Math.cos(rad)) - (Oy * Math.sin(rad))
    let Ry = (Ox * Math.sin(rad)) + (Oy * Math.cos(rad))
    Rx = Math.round(Rx) 
    Ry = Math.round(Ry) 
    return { Rx, Ry }
  }

  positionedVertices(arrayOfPoints){
    for(const point of arrayOfPoints){
      point.Rx += this.x
      point.Ry += this.y
    }
    return arrayOfPoints
  }

  calculatePerimeterArray(points, canvasWidth, canvasHeight){
    let array = []
    this.plotLine(points[3].Rx, points[3].Ry, points[0].Rx, points[0].Ry, array, canvasWidth, canvasHeight)
    this.plotLine(points[0].Rx, points[0].Ry, points[1].Rx, points[1].Ry, array, canvasWidth, canvasHeight)
    this.plotLine(points[1].Rx, points[1].Ry, points[2].Rx, points[2].Ry, array, canvasWidth, canvasHeight)
    this.plotLine(points[2].Rx, points[2].Ry, points[3].Rx, points[3].Ry, array, canvasWidth, canvasHeight)
    return array
  }

  plotLine(x0, y0, x1, y1, array, canvasWidth, canvasHeight) { // Bresenham's line algorithm
    // Fast(?) since is not using Sin or Cos
    // Gets to point, and calculates each pixel between them
    const dx = Math.abs(x1 - x0)
    const sx = x0 < x1 ? 1 : -1
    const dy = -Math.abs(y1 - y0)
    const sy = y0 < y1 ? 1 : -1
    let error = dx + dy
    while (true) {
      if(y0 >= 0 && y0 < canvasHeight){
        let x 
        if(x0 < 0) x = 0
        else if(x0 > canvasWidth) x = canvasWidth
        else x = x0
        if(array[y0] != undefined && array[y0].indexOf(x) == -1){
          array[y0].push(x)
          
        }  
        else if(array[y0] === undefined)  array[y0] = [x]  
      }
      if (x0 == x1 && y0 == y1) break
      const e2 = 2 * error
      if (e2 >= dy) {
        if (x0 == x1) break
        error = error + dy
        x0 = x0 + sx
      }
      if (e2 <= dx) {
        if (y0 == y1) break
        error = error + dx
        y0 = y0 + sy
      }
    }
  }

  static degToRad(deg){
    return deg * Math.PI / 180
  }

  static radToDeg(rad){
    return rad * 180 / Math.PI
  }

  static clamp(num, min, max){
    return Math.min(Math.max(num, min), max);
  } 
}

