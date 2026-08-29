"use strict";

const sizeSelect = document.getElementById("sizeSelect");
const scaleSelect = document.getElementById("scaleSelect");
const gridCheck = document.getElementById("gridCheck");
const historyButtons = document.querySelectorAll("#history button");
const dwnBTN = document.getElementById("dwnBTN");
const clearBTN = document.getElementById("clearBTN");
const customColor = document.getElementById("customColor");
const toolPencil = document.getElementById("toolPencil");
const toolEraser = document.getElementById("toolEraser");
const toolFill = document.getElementById("toolFill");
const toolPick = document.getElementById("toolPick");
const grid = document.getElementById("grid");
const paletteGrid = document.getElementById("paletteGrid");
const hexText = document.getElementById("hexText");
const size = document.getElementById("size");

let gridSize = 16;
let cellSize = 20;
let currentColor = "#000000";
let currentTool = "pencil";
let showGridLines = true;
let gridData = [];
let undoStack = [];
let redoStack = [];
let isMouseDown = false;

const paletteColors = [
  "#1a1a2e",
  "#f5f5f5",
  "#6b7280",
  "#d1d5db",
  "#ef4444",
  "#f97316",
  "#facc15",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#92400e",
];

const makeEmptyGrid = (size) => {
  const data = [];
  for (let r = 0; r < size; r++) {
    const row = [];

    for (let c = 0; c < size; c++) {
      row.push("");
    }
    data.push(row);
  }
  return data;
};

const copyGrid = (data) => structuredClone(data);
const buildPalette = () => {
  paletteGrid.innerHTML = "";

  paletteColors.forEach((color) => {
    const swatch = document.createElement("div");
    swatch.className = "swatch";
    swatch.style.backgroundColor = color;
    swatch.setAttribute("data-color", color);

    swatch.addEventListener("click", () => setColor(color));
    paletteGrid.appendChild(swatch);
  });
};

const renderGrid = () => {
  grid.innerHTML = "";
  if (showGridLines) {
    grid.className = "gridLinesOn";
  } else {
    grid.className = "";
  }

  gridData.forEach((row, r) => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "row";

    row.forEach((cellColor, c) => {
      const pixel = document.createElement("div");

      pixel.className = "pixel";
      pixel.style.width = `${cellSize}px`;
      pixel.style.height = `${cellSize}px`;
      if (cellColor !== "") {
        pixel.style.backgroundColor = cellColor;
      }

      pixel.addEventListener("mousedown", () => {
        isMouseDown = true;

        if (
          currentTool === "pencil" ||
          currentTool === "eraser" ||
          currentTool === "fill"
        ) {
          saveHistory();
        }

        handlePixelAction(r, c);
      });

      pixel.addEventListener("mouseover", () => {
        if (isMouseDown && !["fill", "pick"].includes(currentTool)) {
          handlePixelAction(r, c);
        }
      });

      rowDiv.appendChild(pixel);
    });

    grid.appendChild(rowDiv);
  });
};

document.addEventListener("mouseup", () => {
  isMouseDown = false;
});

const setTool = (tool) => {
  currentTool = tool;

  [toolPencil, toolEraser, toolFill, toolPick].forEach((button) => {
    button.className = "toolBtn";
  });

  const activeBtnMap = {
    pencil: toolPencil,
    eraser: toolEraser,
    fill: toolFill,
    pick: toolPick,
  };

  if (activeBtnMap[tool]) {
    activeBtnMap[tool].className = "toolBtn toolBtnActive";
  }

  updateStatusBar();
};

toolPencil.addEventListener("click", () => setTool("pencil"));
toolEraser.addEventListener("click", () => setTool("eraser"));
toolFill.addEventListener("click", () => setTool("fill"));
toolPick.addEventListener("click", () => setTool("pick"));

const setColor = (color) => {
  currentColor = color;

  hexText.textContent = color;
  customColor.value = color;

  document.querySelectorAll(".swatch").forEach((swatch) => {
    const swatchColor = swatch.getAttribute("data-color");

    swatch.className =
      swatchColor.toLowerCase() === color.toLowerCase()
        ? "swatch swatchSelected"
        : "swatch";
  });

  updateStatusBar();
};

customColor.addEventListener("input", (event) => {
  setColor(event.target.value);
});

const handlePixelAction = (r, c) => {
  if (currentTool === "pencil") {
    gridData[r][c] = currentColor;
    renderGrid();
  } else if (currentTool === "eraser") {
    gridData[r][c] = "";
    renderGrid();
  } else if (currentTool === "fill") {
    floodFill(r, c, gridData[r][c]);
    renderGrid();
  } else if (currentTool === "pick") {
    if (gridData[r][c] !== "") {
      setColor(gridData[r][c]);
    }
  }

  updateStatusBar();
};

const floodFill = (startRow, startCol, targetColor) => {
  if (currentColor === targetColor) return;

  const stack = [[startRow, startCol]];

  while (stack.length > 0) {
    const [r, c] = stack.pop();

    if (r < 0 || c < 0 || r >= gridSize || c >= gridSize) continue;
    if (gridData[r][c] !== targetColor) continue;

    gridData[r][c] = currentColor;

    stack.push([r + 1, c]);
    stack.push([r - 1, c]);
    stack.push([r, c + 1]);
    stack.push([r, c - 1]);
  }
};

const saveHistory = () => {
  undoStack.push(copyGrid(gridData));
  redoStack = [];

  if (undoStack.length > 50) {
    undoStack.shift();
  }
};
const undo = () => {
  if (undoStack.length === 0) return;

  redoStack.push(copyGrid(gridData));
  gridData = undoStack.pop();

  renderGrid();
  updateStatusBar();
};
const redo = () => {
  if (redoStack.length === 0) return;

  undoStack.push(copyGrid(gridData));
  gridData = redoStack.pop();

  renderGrid();
  updateStatusBar();
};
historyButtons[0].addEventListener("click", undo);
historyButtons[1].addEventListener("click", redo);

const changeGridSize = () => {
  gridSize = parseInt(sizeSelect.value, 10);

  gridData = makeEmptyGrid(gridSize);

  undoStack = [];
  redoStack = [];

  renderGrid();
  updateStatusBar();
};
sizeSelect.addEventListener("change", changeGridSize);

const changeScale = () => {
  cellSize = parseInt(scaleSelect.value, 10);

  renderGrid();
};
scaleSelect.addEventListener("change", changeScale);

const toggleGridLines = () => {
  showGridLines = gridCheck.checked;

  renderGrid();
};
gridCheck.addEventListener("change", toggleGridLines);

const clearCanvas = () => {
  saveHistory();

  gridData = makeEmptyGrid(gridSize);

  renderGrid();
  updateStatusBar();
};

clearBTN.addEventListener("click", clearCanvas);

const downloadPNG = () => {
  const canvas = document.getElementById("canvas");
  const exportCellSize = 20;

  canvas.width = gridSize * exportCellSize;
  canvas.height = gridSize * exportCellSize;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  gridData.forEach((row, r) => {
    row.forEach((cellColor, c) => {
      if (cellColor !== "") {
        ctx.fillStyle = cellColor;

        ctx.fillRect(
          c * exportCellSize,
          r * exportCellSize,
          exportCellSize,
          exportCellSize,
        );
      }
    });
  });

  const link = document.createElement("a");
  link.download = "pixel_art.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
};

dwnBTN.addEventListener("click", downloadPNG);

const updateStatusBar = () => {
  size.textContent =
    "grid " +
    gridSize +
    "x" +
    gridSize +
    " - " +
    currentTool +
    " - " +
    currentColor;
};

gridData = makeEmptyGrid(gridSize);

buildPalette();
renderGrid();
setTool("pencil");
setColor("#000000");
updateStatusBar();
