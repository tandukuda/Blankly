// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const container = document.querySelector('.canvas-container');

// Tool elements
const penTool = document.getElementById('pen-tool');
const eraserTool = document.getElementById('eraser-tool');
const textTool = document.getElementById('text-tool');
const rectangleTool = document.getElementById('rectangle-tool');
const circleTool = document.getElementById('circle-tool');
const lineTool = document.getElementById('line-tool');
const clearBtn = document.getElementById('clear-btn');
const saveJpgBtn = document.getElementById('save-jpg-btn');
const savePdfBtn = document.getElementById('save-pdf-btn');

// Options
const brushColor = document.getElementById('brush-color');
const brushSize = document.getElementById('brush-size');
const sizeDisplay = document.getElementById('size-display');

// Text modal elements
const textModal = document.getElementById('text-modal');
const textInput = document.getElementById('text-input');
const textSize = document.getElementById('text-size');
const textSizeDisplay = document.getElementById('text-size-display');
const textFont = document.getElementById('text-font');
const addTextBtn = document.getElementById('add-text-btn');
const cancelTextBtn = document.getElementById('cancel-text-btn');

// Status message
const statusMessage = document.getElementById('status-message');

// State variables
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let selectedTool = 'pen';
let currentColor = '#000000';
let currentSize = 5;
let textPosition = { x: 0, y: 0 };
let shapeStartPos = { x: 0, y: 0 };

// History for undo/redo
let drawingHistory = [];
let currentState = null;

// Initialize canvas size
function resizeCanvas() {
canvas.width = container.clientWidth;
canvas.height = container.clientHeight;
redraw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Save initial state
saveState();

// Tool selection
const tools = [penTool, eraserTool, textTool, rectangleTool, circleTool, lineTool];

tools.forEach(tool => {
tool.addEventListener('click', () => {
tools.forEach(t => t.classList.remove('active'));
tool.classList.add('active');

    if (tool === penTool) selectedTool = 'pen';
    else if (tool === eraserTool) selectedTool = 'eraser';
    else if (tool === textTool) selectedTool = 'text';
    else if (tool === rectangleTool) selectedTool = 'rectangle';
    else if (tool === circleTool) selectedTool = 'circle';
    else if (tool === lineTool) selectedTool = 'line';
});

});

// Brush size change
brushSize.addEventListener('input', () => {
currentSize = brushSize.value;
sizeDisplay.textContent = ${currentSize}px;
});

// Brush color change
brushColor.addEventListener('input', () => {
currentColor = brushColor.value;
});

// Text size change
textSize.addEventListener('input', () => {
textSizeDisplay.textContent = ${textSize.value}px;
});

// Clear canvas
clearBtn.addEventListener('click', () => {
ctx.clearRect(0, 0, canvas.width, canvas.height);
saveState();
showStatus('Canvas cleared');
});

// Mouse events for drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch events
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

function handleTouchStart(e) {
e.preventDefault();
const touch = e.touches[0];
const mouseEvent = new MouseEvent('mousedown', {
clientX: touch.clientX,
clientY: touch.clientY
});
canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
e.preventDefault();
const touch = e.touches[0];
const mouseEvent = new MouseEvent('mousemove', {
clientX: touch.clientX,
clientY: touch.clientY
});
canvas.dispatchEvent(mouseEvent);
}

function handleTouchEnd(e) {
e.preventDefault();
const mouseEvent = new MouseEvent('mouseup', {});
canvas.dispatchEvent(mouseEvent);
}

// Drawing functions
function startDrawing(e) {
isDrawing = true;
const rect = canvas.getBoundingClientRect();
lastX = e.clientX - rect.left;
lastY = e.clientY - rect.top;

if (selectedTool === 'text') {
    textPosition.x = lastX;
    textPosition.y = lastY;
    textModal.style.display = 'flex';
    textInput.focus();
} else if (selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'line') {
    shapeStartPos.x = lastX;
    shapeStartPos.y = lastY;
}

}

function draw(e) {
if (!isDrawing) return;

const rect = canvas.getBoundingClientRect();
const x = e.clientX - rect.left;
const y = e.clientY - rect.top;

ctx.lineJoin = 'round';
ctx.lineCap = 'round';

if (selectedTool === 'pen') {
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
} else if (selectedTool === 'eraser') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = currentSize;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
} else if (selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'line') {
    // For shapes, we'll preview by redrawing the canvas and then the shape
    redraw();
    drawShape(shapeStartPos.x, shapeStartPos.y, x, y);
}

lastX = x;
lastY = y;

}

function stopDrawing() {
if (isDrawing) {
if (selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'line') {
// Save the shape permanently
drawShape(shapeStartPos.x, shapeStartPos.y, lastX, lastY, true);
saveState();
} else if (selectedTool === 'pen' || selectedTool === 'eraser') {
saveState();
}
}
isDrawing = false;
}

function drawShape(startX, startY, endX, endY, save = false) {
ctx.strokeStyle = currentColor;
ctx.lineWidth = currentSize;

// If we're just previewing, use the most recent saved state
if (!save) {
    redraw();
}

ctx.beginPath();

if (selectedTool === 'rectangle') {
    ctx.rect(startX, startY, endX - startX, endY - startY);
} else if (selectedTool === 'circle') {
    const radiusX = Math.abs(endX - startX) / 2;
    const radiusY = Math.abs(endY - startY) / 2;
    const centerX = Math.min(startX, endX) + radiusX;
    const centerY = Math.min(startY, endY) + radiusY;
    
    // Approximation of an ellipse
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
} else if (selectedTool === 'line') {
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
}

ctx.stroke();

}

// Text functions
addTextBtn.addEventListener('click', addText);
cancelTextBtn.addEventListener('click', () => {
textModal.style.display = 'none';
});

function addText() {
const text = textInput.value.trim();
if (text) {
ctx.font = ${textSize.value}px ${textFont.value};
ctx.fillStyle = currentColor;
ctx.fillText(text, textPosition.x, textPosition.y);
saveState();
showStatus('Text added');
}
textInput.value = '';
textModal.style.display = 'none';
}

// Save functions
saveJpgBtn.addEventListener('click', saveAsJPG);
savePdfBtn.addEventListener('click', saveAsPDF);

function saveAsJPG() {
const link = document.createElement('a');
link.download = 'blankly.jpg';
link.href = canvas.toDataURL('image/jpeg');
link.click();
showStatus('Saved as JPG');
}

function saveAsPDF() {
// This is a simplistic implementation using a data URL
// In a real app, you might want to use a library like jsPDF
const link = document.createElement('a');
link.download = 'blankly.pdf';

// Create a canvas with white background
const printCanvas = document.createElement('canvas');
printCanvas.width = canvas.width;
printCanvas.height = canvas.height;
const printCtx = printCanvas.getContext('2d');

// Draw white background
printCtx.fillStyle = 'white';
printCtx.fillRect(0, 0, printCanvas.width, printCanvas.height);

// Draw the whiteboard content on top
printCtx.drawImage(canvas, 0, 0);

// Convert to PDF (in reality this just sends a data URL that browsers usually handle as PDF)
link.href = printCanvas.toDataURL('image/jpeg');
link.click();
showStatus('Saved as PDF (JPG format)');

}

// History functions
function saveState() {
currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
drawingHistory.push(currentState);
}

function redraw() {
if (currentState) {
ctx.putImageData(currentState, 0, 0);
} else {
ctx.clearRect(0, 0, canvas.width, canvas.height);
}
}

// Status message
function showStatus(message) {
statusMessage.textContent = message;
statusMessage.style.opacity = '1';

setTimeout(() => {
    statusMessage.style.opacity = '0';
}, 2000);

}
