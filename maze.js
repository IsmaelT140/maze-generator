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
const cellSize = 20
const wallWidth = 20

const mazeStart = [0, 0]
const mazeEnd = [rows - 1, cols - 1]

const mazeGenerationSpeed = 1
const pathfindingSpeed = 5

let grid = null
let exploredNodes = null
let path = null

function initGrid() {
	return Array.from({ length: rows }, () =>
		Array.from({ length: cols }, () => ({
			top: true,
			right: true,
			bottom: true,
			left: true,
			highlight: false,
			distance: null,
			parent: null,
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
	path = []

	const canvasWidth = cols * cellSize + (cols + 1) * wallWidth
	const canvasHeight = rows * cellSize + (rows + 1) * wallWidth
	createCanvas(canvasWidth, canvasHeight, canvas)
}

function draw() {
	background(mirage)
	strokeWeight(wallWidth)
	stroke(0)
	for (let row = 0; row < rows; row += 1) {
		for (let col = 0; col < cols; col += 1) {
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

	if (path) {
		for (let i = 0; i < path.length; i += 1) {
			const [row, col] = path[i]
			const x = col * cellSize + (col + 1) * wallWidth
			const y = row * cellSize + (row + 1) * wallWidth
			const cellCenter = [x + cellSize / 2, y + cellSize / 2]

			if (path[i + 1]) {
				const [nextRow, nextCol] = path[i + 1]
				const r = nextCol * cellSize + (nextCol + 1) * wallWidth
				const c = nextRow * cellSize + (nextRow + 1) * wallWidth
				const nextCellCenter = [r + cellSize / 2, c + cellSize / 2]

				stroke(237, 129, 152)
				strokeWeight(Math.floor(cellSize / 4))
				line(...cellCenter, ...nextCellCenter)
			}

			stroke(198)
			circle(...cellCenter, Math.floor(cellSize / 3))
		}
	}
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
		case "kruskalsAlgorithm":
			await kruskalsAlgorithm()
			break

		default:
			alert("Please select a valid maze generation algorithm.")
			return
	}

	switch (pathfindingAlgorithm) {
		case "depthFirstSearch":
			await pathfindingDFS(mazeStart, mazeEnd)
			break
		case "breadthFirstSearch":
			await breadthFirstSearch(mazeStart, mazeEnd)
			break
		case "greedyBFS":
			await greedyBFS(mazeStart, mazeEnd)
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

function getNeighbors(row, col, gen, visited = false, validityOnly) {
	const neighbors = []
	const cell = grid[row][col]

	let topValid = isCellValid(row - 1, col, visited, validityOnly)
	let rightValid = isCellValid(row, col + 1, visited, validityOnly)
	let bottomValid = isCellValid(row + 1, col, visited, validityOnly)
	let leftValid = isCellValid(row, col - 1, visited, validityOnly)

	if ((gen || validityOnly || !cell.top) && topValid)
		neighbors.push([row - 1, col])
	if ((gen || validityOnly || !cell.right) && rightValid)
		neighbors.push([row, col + 1])
	if ((gen || validityOnly || !cell.bottom) && bottomValid)
		neighbors.push([row + 1, col])
	if ((gen || validityOnly || !cell.left) && leftValid)
		neighbors.push([row, col - 1])

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
	path = []
	let current = mazeEnd

	while (current) {
		path.push(current)
		current = pathMap.get(current.toString())
	}

	path = path.reverse()

	return path
}

function removeDuplicateCombinations(pairs) {
	const uniqueCombinations = new Set()

	pairs.forEach((pair) => {
		const sortedPair = pair.sort((a, b) => a[0] - b[0] || a[1] - b[1])

		uniqueCombinations.add(JSON.stringify(sortedPair))
	})
	return Array.from(uniqueCombinations).map((string) => JSON.parse(string))
}

function distance(firstRow, firstCol, secondRow, secondCol) {
	let rowDelta = secondRow - firstRow
	let colDelta = secondCol - firstCol
	return Math.sqrt(Math.pow(rowDelta, 2) + Math.pow(colDelta, 2))
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

		const neighbors = getNeighbors(row, col, true)

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
}

async function randomizedPrims() {
	let stack = []

	exploredNodes = initExploredNodesArray()
	exploredNodes[0][0] = true
	setCellState(0, 0, { highlight: "closedSet" })
	draw()

	getNeighbors(0, 0, true).forEach((neighbor) => {
		const [row, col] = neighbor
		stack.push([row, col])
		setCellState(row, col, { highlight: "openSet" })
	})

	while (stack.length > 0) {
		const [row, col] = stack.splice(getRandomIndex(stack), 1)[0]

		draw()

		const neighbors = getNeighbors(row, col, true, true)

		const [nextRow, nextCol] = neighbors.splice(
			getRandomIndex(neighbors),
			1
		)[0]

		exploredNodes[row][col] = true
		setCellState(row, col, { highlight: "closedSet" })
		removeWalls(row, col, nextRow, nextCol)
		getNeighbors(row, col, true).forEach((neighbor) => {
			if (!arrayIncludesCell(stack, neighbor)) {
				stack.push(neighbor)
				setCellState(neighbor[0], neighbor[1], { highlight: "openSet" })
			}
		})
		await new Promise((resolve) => setTimeout(resolve, mazeGenerationSpeed))
	}
}

async function kruskalsAlgorithm() {
	let coordinatePairs = []

	let setCount = rows * cols

	for (let row = 0; row < rows; row += 1) {
		for (let col = 0; col < cols; col += 1) {
			let neighbors = getNeighbors(row, col, true, null, true)
			neighbors.forEach((neighbor) =>
				coordinatePairs.push([
					[row, col],
					[neighbor[0], neighbor[1]],
				])
			)
			grid[row][col].set = [[row, col]]
			setCellState(row, col, { parent: [row, col] })
		}
	}

	randomizedQueue = removeDuplicateCombinations(coordinatePairs)

	while (
		Array.isArray(randomizedQueue) &&
		randomizedQueue.length > 0 &&
		setCount > 1
	) {
		const [[row, col], [neighborRow, neighborCol]] = randomizedQueue.splice(
			getRandomIndex(randomizedQueue),
			1
		)[0]
		const current = grid[row][col]
		const neighbor = grid[neighborRow][neighborCol]

		removeWalls(row, col, neighborRow, neighborCol)
		setCellState(neighborRow, neighborCol, { highlight: "closedSet" })
		setCellState(row, col, { highlight: "closedSet" })

		let currentDistance = distance(row, col, mazeStart[0], mazeStart[1])
		let neighborDistance = distance(
			neighborRow,
			neighborCol,
			mazeStart[0],
			mazeStart[1]
		)

		let currentParent = grid[current.parent[0]][current.parent[1]]
		let neighborParent = grid[neighbor.parent[0]][neighbor.parent[1]]

		if (currentDistance < neighborDistance) {
			neighborParent.set.forEach((cell) => {
				let [row, col] = cell
				grid[row][col].parent = current.parent
				currentParent.set.push(cell)
			})
			neighborParent.set = null
			setCount -= 1
		}
		if (currentDistance > neighborDistance) {
			currentParent.set.forEach((cell) => {
				let [row, col] = cell
				grid[row][col].parent = neighbor.parent
				neighborParent.set.push(cell)
			})
			currentParent.set = null
			setCount -= 1
		}

		randomizedQueue = randomizedQueue.filter((pair) => {
			const [[x, y], [r, c]] = pair
			return grid[x][y].parent !== grid[r][c].parent
		})

		await new Promise((resolve) => setTimeout(resolve, mazeGenerationSpeed))
	}
}

async function pathfindingDFS(start, end) {
	let pathMap = new Map()

	let stack = []
	stack.push(start)

	pathMap.set(start.toString(), null)

	exploredNodes = initExploredNodesArray()

	while (Array.isArray(stack) && stack.length > 0) {
		const [row, col] = stack.pop()
		setCellState(row, col, { highlight: "current" })

		draw()

		if (exploredNodes[row][col] === false) {
			exploredNodes[row][col] = true
		}

		if ([row, col].toString() === end.toString()) {
			setCellState(row, col, { highlight: "path" })
			return reconstructPath(pathMap)
		}

		getNeighbors(row, col, false).forEach((neighbor) => {
			let [neighborRow, neighborCol] = neighbor

			if (exploredNodes[neighborRow][neighborCol] === false) {
				exploredNodes[neighborRow][neighborCol] = true
				if (!arrayIncludesCell(stack, neighbor)) {
					stack.push([row, col])
					stack.push(neighbor)
				}
			}
		})

		const nextNode = stack[stack.length - 1]

		if (!pathMap.has(nextNode.toString())) {
			pathMap.set(nextNode.toString(), [row, col])
		}

		await new Promise((resolve) => setTimeout(resolve, pathfindingSpeed))
		setCellState(row, col, { highlight: "path" })
	}
	console.error("No path found.")
	return false
}

async function breadthFirstSearch(start, end) {
	let pathMap = new Map()
	let queue = []
	queue.push(start)

	exploredNodes = initExploredNodesArray()

	while (Array.isArray(queue) && queue.length > 0) {
		const [row, col] = queue.shift()
		setCellState(row, col, { highlight: "current" })

		draw()

		if (exploredNodes[row][col] === false) {
			exploredNodes[row][col] = true
		}

		if ([row, col].toString() === end.toString()) {
			setCellState(row, col, { highlight: "path" })
			return reconstructPath(pathMap)
		}

		setCellState(row, col, { highlight: "current" })

		getNeighbors(row, col, false).forEach((neighbor) => {
			if (!arrayIncludesCell(queue, neighbor)) {
				queue.push(neighbor)
				setCellState(neighbor[0], neighbor[1], { highlight: "openSet" })
			}
			if (!pathMap.has(neighbor.toString())) {
				pathMap.set(neighbor.toString(), [row, col])
			}
		})

		await new Promise((resolve) => setTimeout(resolve, pathfindingSpeed))
		setCellState(row, col, { highlight: "path" })
	}
	console.error("No path found.")
	return false
}

async function greedyBFS(start, end) {
	let pathMap = new Map()
	let queue = []
	queue.push(start)

	exploredNodes = initExploredNodesArray()

	while (Array.isArray(queue) && queue.length > 0) {
		const [row, col] = queue.shift()
		setCellState(row, col, { highlight: "current" })

		if (exploredNodes[row][col] === false) {
			exploredNodes[row][col] = true
		}

		if ([row, col].toString() === end.toString()) {
			setCellState(row, col, { highlight: "path" })
			return reconstructPath(pathMap)
		}

		getNeighbors(row, col, false).forEach((neighbor) => {
			const [neighborRow, neighborCol] = neighbor

			if (typeof grid[neighborRow][neighborCol].distance !== "number") {
				let d =
					Math.abs(mazeEnd[0] - neighborRow) +
					Math.abs(mazeEnd[1] - neighborCol)
				grid[neighborRow][neighborCol].distance = d
			}

			queue.push(neighbor)
			setCellState(neighborRow, neighborCol, { highlight: "openSet" })

			queue.sort((a, b) => {
				const aDistance = grid[a[0]][a[1]].distance
				const bDistance = grid[b[0]][b[1]].distance

				return aDistance - bDistance
			})

			if (!pathMap.has(neighbor.toString())) {
				pathMap.set(neighbor.toString(), [row, col])
			}
		})

		await new Promise((resolve) => setTimeout(resolve, pathfindingSpeed))

		setCellState(row, col, { highlight: "path" })
	}
	console.error("No path found.")
	return false
}
