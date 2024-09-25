const logStyles = [
	"background-color: #F5F2F1",
	"color: #F37E8C",
	"padding: 0.5rem",
	"font-size: 2rem",
	"font-family: `JetBrains Mono`, monospace",
	"font-optical-sizing: auto",
	"font-weight: 500",
	"font-style: normal",
].join(";")
const canvas = document.getElementById("mazeCanvas")
const mazeDiv = document.getElementById("mazeDiv")
const startButton = document.getElementById("startButton")
const clearButton = document.getElementById("clearButton")

const athensGray = "#E4E8EC"
const glacier = "#7BA6C2"
const azure = "#396FB8"
const stormGray = "#666C85"
const mirage = "#1A1D30"

const rows = 20
const cols = 30
const cellSize = 25
const wallWidth = 5

const mazeStart = [0, 0]
const mazeEnd = [rows - 1, cols - 1]

const mazeGenerationSpeed = 20
const pathfindingSpeed = 40

const canvasWidth = cols * cellSize + (cols + 1) * wallWidth
const canvasHeight = rows * cellSize + (rows + 1) * wallWidth

let grid = null
let exploredNodes = null

function initGrid() {
	return Array.from({ length: rows }, () =>
		Array.from({ length: cols }, () => ({
			top: true,
			right: true,
			bottom: true,
			left: true,
			highlight: false,
		}))
	)
}
function initExploredNodesArray() {
	return Array.from({ length: rows }, () =>
		Array.from({ length: cols }, () => false)
	)
}

function setup() {
	grid = initGrid()
	exploredNodes = initExploredNodesArray()

	createCanvas(canvasWidth, canvasHeight, canvas)

	strokeWeight(wallWidth)
	stroke(0)
}

function draw() {
	background(mirage)
	for (let row = 0; row < rows; row += 1) {
		for (let col = 0; col < cols; col += 1) {
			// TODO: Fix the rendering for edge case where there is a visible line between cells.
			// TODO: Fix the rendering issue that causes the walls to be colored non-centered.
			const cell = grid[row][col]
			const x = col * cellSize + (col + 1) * wallWidth
			const y = row * cellSize + (row + 1) * wallWidth
			const halfLineWidth = Math.floor(wallWidth / 2)

			let cellAbove,
				cellRight,
				cellLeft,
				cellBelow = null

			if (isCellValid(row - 1, col, null, true)) {
				cellAbove = true
			}
			if (isCellValid(row, col + 1, null, true)) {
				cellRight = true
			}
			if (isCellValid(row + 1, col, null, true)) {
				cellBelow = true
			}
			if (isCellValid(row, col - 1, null, true)) {
				cellLeft = true
			}

			let cellColor = null
			if (cell.highlight) {
				if (cell.highlight === "current") {
					cellColor = athensGray
				}
				if (cell.highlight === "openSet") {
					cellColor = glacier
				}
				if (cell.highlight === "closedSet") {
					cellColor = azure
				}
				if (cell.highlight === "path") {
					cellColor = stormGray
				}
				noStroke()
				fill(cellColor)
				square(x, y, cellSize)
			}

			stroke(mirage)
			strokeCap(SQUARE)

			if (cell.top) {
				line(
					x - wallWidth,
					y - halfLineWidth,
					x + cellSize + wallWidth,
					y - halfLineWidth
				)
			}

			if (cell.right && !cellRight) {
				line(
					x + cellSize + halfLineWidth,
					y - wallWidth,
					x + cellSize + halfLineWidth,
					y + cellSize + wallWidth
				)
			}

			if (cell.bottom && !cellBelow) {
				line(
					x - wallWidth,
					y + cellSize + halfLineWidth,
					x + cellSize + wallWidth,
					y + cellSize + halfLineWidth
				)
			}

			if (cell.left) {
				line(
					x - halfLineWidth,
					y - wallWidth,
					x - halfLineWidth,
					y + cellSize + wallWidth
				)
			}

			if (cellColor) {
				stroke(cellColor)

				if (!cell.top) {
					line(x, y - halfLineWidth, x + cellSize, y - halfLineWidth)
				}

				if (!cell.right && !cellRight) {
					line(
						x + cellSize + halfLineWidth,
						y,
						x + cellSize + halfLineWidth,
						y + cellSize
					)
				}

				if (!cell.bottom && !cellBelow) {
					line(
						x,
						y + cellSize + halfLineWidth,
						x + cellSize,
						y + cellSize + halfLineWidth
					)
				}

				if (!cell.left) {
					line(x - halfLineWidth, y, x - halfLineWidth, y + cellSize)
				}
			}
		}
	}
	// TODO: Add code to render the pathfinding algorithms visited cells, and the final path.
}

async function startAlgorithm(mazeAlgorithm, pathfindingAlgorithm) {
	draw()
	startButton.disabled = true
	clearButton.disabled = true

	switch (mazeAlgorithm) {
		case "generateDepthFirstSearch":
			await depthFirstSearch()
			break
		case "generateRandomizedPrims":
			await randomizedPrims()
			break

		default:
			alert("Please select a valid maze generation algorithm.")
			return
	}

	switch (pathfindingAlgorithm) {
		case "depthFirstSearch":
			await pathfindingDFS()
			break

		default:
			alert("Please select a valid pathfinding algorithm.")
			return
	}

	clearButton.disabled = false
	draw()
}

startButton.addEventListener("click", () => {
	setup()
	draw()
	const mazeAlgorithm = document.getElementById("mazeAlgorithmSelect").value
	const pathfindingAlgorithm = document.getElementById(
		"pathfindingAlgorithmSelect"
	).value
	startAlgorithm(mazeAlgorithm, pathfindingAlgorithm)
})

clearButton.addEventListener("click", () => {
	setup()
	draw()
	startButton.disabled = false
})

function getRandomIndex(array) {
	if (!Array.isArray(array)) {
		throw new Error("Input must be an array")
	}
	if (array.length === 0) {
		return -1
	}
	return Math.floor(Math.random() * array.length)
}

function arrayIncludesCell(array, cell) {
	return array.some((item) => item[0] === cell[0] && item[1] === cell[1])
}

function isCellValid(row, col, visited, validityOnly) {
	const validRow = row >= 0 && row < rows
	const validCol = col >= 0 && col < cols
	const validCell = validRow && validCol

	if (validityOnly) return validCell

	if (validCell) {
		return exploredNodes[row][col] === visited
	}
	return false
}

function getNeighbors(row, col, visited = false) {
	const neighbors = []

	if (isCellValid(row - 1, col, visited)) neighbors.push([row - 1, col])

	if (isCellValid(row, col + 1, visited)) neighbors.push([row, col + 1])

	if (isCellValid(row + 1, col, visited)) neighbors.push([row + 1, col])

	if (isCellValid(row, col - 1, visited)) neighbors.push([row, col - 1])

	return neighbors
}

function getPathfindingNeighbors(row, col, visited = false) {
	const neighbors = []
	let cell = grid[row][col]

	if (!cell.top) {
		if (isCellValid(row - 1, col, visited)) neighbors.push([row - 1, col])
	}
	if (!cell.right) {
		if (isCellValid(row, col + 1, visited)) neighbors.push([row, col + 1])
	}
	if (!cell.bottom) {
		if (isCellValid(row + 1, col, visited)) neighbors.push([row + 1, col])
	}
	if (!cell.left) {
		if (isCellValid(row, col - 1, visited)) neighbors.push([row, col - 1])
	}

	return neighbors
}

function setCellState(row, col, state) {
	if (row >= 0 && row < rows && col >= 0 && col < cols) {
		grid[row][col] = { ...grid[row][col], ...state }
	}
}

function removeWalls(row, col, nextRow, nextCol) {
	const x = row - nextRow
	const y = col - nextCol

	if (x === 1) {
		setCellState(row, col, { top: false })
		setCellState(nextRow, nextCol, { bottom: false })
	}
	if (x === -1) {
		setCellState(row, col, { bottom: false })
		setCellState(nextRow, nextCol, { top: false })
	}
	if (y === 1) {
		setCellState(row, col, { left: false })
		setCellState(nextRow, nextCol, { right: false })
	}
	if (y === -1) {
		setCellState(row, col, { right: false })
		setCellState(nextRow, nextCol, { left: false })
	}
}

function reconstructPath(pathMap) {
	let path = []
	let current = mazeEnd

	console.log(pathMap)

	while (current) {
		path.push(current)
		current = pathMap.get(current.toString())
	}

	path = path.reverse()
	console.log(path)

	return path
}

async function depthFirstSearch() {
	let stack = []

	exploredNodes = initExploredNodesArray()

	stack.push([0, 0])

	while (stack.length > 0) {
		const [row, col] = stack.pop()
		exploredNodes[row][col] = true
		setCellState(row, col, { highlight: "current" })

		draw()

		await new Promise((resolve) => setTimeout(resolve, mazeGenerationSpeed))

		const neighbors = getNeighbors(row, col)

		if (!Array.isArray(neighbors) || !neighbors.length > 0) {
			setCellState(row, col, { highlight: "closedSet" })
			continue
		}

		const [nextRow, nextCol] = neighbors[getRandomIndex(neighbors)]
		removeWalls(row, col, nextRow, nextCol)

		stack.push([row, col], [nextRow, nextCol])

		setCellState(row, col, { highlight: "openSet" })
		setCellState(nextRow, nextCol, { highlight: "openSet" })
	}
	console.log(`%cDone!`, logStyles)
}

async function randomizedPrims() {
	let stack = []

	exploredNodes = initExploredNodesArray()
	exploredNodes[0][0] = true
	setCellState(0, 0, { highlight: "closedSet" })
	draw()

	getNeighbors(0, 0).forEach((cell) => {
		const [row, col] = cell
		stack.push([row, col])
		setCellState(row, col, { highlight: "openSet" })
	})

	while (stack.length > 0) {
		const [row, col] = stack.splice(getRandomIndex(stack), 1)[0]

		draw()

		const neighbors = getNeighbors(row, col, true)

		const [nextRow, nextCol] = neighbors.splice(
			getRandomIndex(neighbors),
			1
		)[0]

		exploredNodes[row][col] = true
		setCellState(row, col, { highlight: "closedSet" })
		removeWalls(row, col, nextRow, nextCol)
		getNeighbors(row, col).forEach((neighbor) => {
			if (!arrayIncludesCell(stack, neighbor)) {
				stack.push(neighbor)
				setCellState(neighbor[0], neighbor[1], { highlight: "openSet" })
			}
		})
		await new Promise((resolve) => setTimeout(resolve, mazeGenerationSpeed))
	}
	console.log(`%cDone!`, logStyles)
}

async function pathfindingDFS() {
	console.log("Pathfinding DFS starting...")
	let pathMap = new Map()

	let stack = []
	stack.push(mazeStart)

	pathMap.set(mazeStart.toString(), null)

	exploredNodes = initExploredNodesArray()
	exploredNodes[0][0] = true

	while (Array.isArray(stack) && stack.length > 0) {
		const [row, col] = stack.pop()
		setCellState(row, col, { highlight: "current" })

		draw()

		if (exploredNodes[row][col] === false) {
			exploredNodes[row][col] = true
		}

		if ([row, col].toString() === mazeEnd.toString()) {
			setCellState(row, col, { highlight: "closedSet" })
			return reconstructPath(pathMap)
		}

		const neighbors = getPathfindingNeighbors(row, col)

		for (const neighbor of neighbors) {
			let [neighborRow, neighborCol] = neighbor

			if (exploredNodes[neighborRow][neighborCol] === false) {
				exploredNodes[neighborRow][neighborCol] = true
				if (!arrayIncludesCell(stack, neighbor)) {
					stack.push([row, col])
					stack.push(neighbor)
				}
			}
		}

		if (Array.isArray(stack) && stack.length > 0) {
			const nextNode = stack[stack.length - 1]

			if (!pathMap.has(nextNode.toString())) {
				pathMap.set(nextNode.toString(), [row, col])
			}
		}
		await new Promise((resolve) => setTimeout(resolve, pathfindingSpeed))
		setCellState(row, col, { highlight: "closedSet" })
	}
	console.error("No path found.")
	return false
}
