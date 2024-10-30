const maze = document.getElementById("mazeSvg")
const mazeDiv = document.getElementById("mazeDiv")
const startButton = document.getElementById("startButton")
const clearButton = document.getElementById("clearButton")

const athensGray = "#E4E8EC"
const glacier = "#7BA6C2"
const azure = "#396FB8"
const stormGray = "#666C85"
const mirage = "#1A1D30"

const [rows, cols] = [9, 16]
const cellSize = 40
const wallWidth = Math.floor(cellSize / 3)

const svgWidth = cols * cellSize + (cols + 1) * wallWidth
const svgHeight = rows * cellSize + (rows + 1) * wallWidth

const mazeStart = [0, 0]
const mazeEnd = [rows - 1, cols - 1]

const mazeGenerationSpeed = 0
const pathfindingSpeed = 0

let grid = null
let exploredNodes = null
let path = null

function initGrid() {
	let maze = []
	for (let row = 0; row < rows; row += 1) {
		let rowArray = []
		for (let col = 0; col < cols; col += 1) {
			rowArray.push({
				row,
				col,
				getX() {
					return this.col * cellSize + (this.col + 1) * wallWidth
				},
				getY() {
					return this.row * cellSize + (this.row + 1) * wallWidth
				},
				top: true,
				right: true,
				bottom: true,
				left: true,
				highlight: false,
				distance: null,
				parent: null,
			})
		}
		maze.push(rowArray)
	}

	return maze
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
}

function draw() {
	const svg = d3
		.select("#mazeSvg")
		.attr("width", svgWidth)
		.attr("height", svgHeight)

	// svg.append("rect")
	// 	.attr("width", svgWidth)
	// 	.attr("height", svgHeight)
	// 	.attr("class", "background")
	// 	.attr("fill", "#1A1D30")

	svg.selectAll(".cell")
		.data(grid.flat())
		.join("rect")
		.attr("class", "cell")
		.attr("id", (cell) => {
			return `(${cell.row}, ${cell.col})`
		})
		.attr("x", (cell) => {
			return cell.getX()
		})
		.attr("y", (cell) => {
			return cell.getY()
		})
		.attr("width", cellSize)
		.attr("height", cellSize)
		.attr("fill", (cell) => {
			if (cell.highlight) {
				if (cell.highlight === "current") return athensGray

				if (cell.highlight === "openSet") return glacier

				if (cell.highlight === "closedSet") return azure

				if (cell.highlight === "path") return stormGray
			}
			return mirage
		})

	const topWallArray = grid.flat().filter((cell) => {
		return cell.top
	})

	svg.selectAll(".top")
		.data(topWallArray)
		.join("rect")
		.attr("class", "top")
		.attr("x", (cell) => cell.getX() - wallWidth)
		.attr("y", (cell) => cell.getY() - wallWidth)
		.attr("width", cellSize + wallWidth * 2)
		.attr("height", wallWidth)
		.attr("fill", mirage)

	const rightWallArray = grid.flat().filter((cell) => {
		return cell.right
	})

	svg.selectAll(".right")
		.data(rightWallArray)
		.join("rect")
		.attr("class", "right")
		.attr("x", (cell) => cell.getX() + cellSize)
		.attr("y", (cell) => cell.getY() - wallWidth)
		.attr("width", wallWidth)
		.attr("height", cellSize + wallWidth * 2)
		.attr("fill", mirage)

	const bottomWallArray = grid.flat().filter((cell) => {
		return cell.bottom
	})

	svg.selectAll(".bottom")
		.data(bottomWallArray)
		.join("rect")
		.attr("class", "bottom")
		.attr("x", (cell) => cell.getX() - wallWidth)
		.attr("y", (cell) => cell.getY() + cellSize)
		.attr("width", cellSize + wallWidth * 2)
		.attr("height", wallWidth)
		.attr("fill", mirage)

	const leftWallArray = grid.flat().filter((cell) => {
		return cell.left
	})

	svg.selectAll(".left")
		.data(leftWallArray)
		.join("rect")
		.attr("class", "left")
		.attr("x", (cell) => cell.getX() - wallWidth)
		.attr("y", (cell) => cell.getY() - wallWidth)
		.attr("width", wallWidth)
		.attr("height", cellSize + wallWidth * 2)
		.attr("fill", mirage)
}

async function startAlgorithm(mazeAlgorithm, pathfindingAlgorithm) {
	setup()
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

function getRandomItem(array) {
	if (!Array.isArray(array)) {
		throw new Error("Input must be an array")
	}
	if (array.length === 0) {
		return -1
	}
	return array.splice(Math.floor(Math.random() * array.length), 1)[0]
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

function getNeighbors(
	xy,
	visited = false,
	pathfinding = false,
	validityOnly = false
) {
	const [row, col] = xy
	const neighbors = []
	const cell = grid[row][col]
	const directions = [
		{
			rowOffset: -1,
			colOffset: 0,
			wall: "top",
			valid: isCellValid(row - 1, col, visited, validityOnly),
		},
		{
			rowOffset: 0,
			colOffset: 1,
			wall: "right",
			valid: isCellValid(row, col + 1, visited, validityOnly),
		},
		{
			rowOffset: 1,
			colOffset: 0,
			wall: "bottom",
			valid: isCellValid(row + 1, col, visited, validityOnly),
		},
		{
			rowOffset: 0,
			colOffset: -1,
			wall: "left",
			valid: isCellValid(row, col - 1, visited, validityOnly),
		},
	]

	directions.forEach(({ rowOffset, colOffset, wall, valid }) => {
		if (valid && (!pathfinding || !cell[wall])) {
			neighbors.push([row + rowOffset, col + colOffset])
		}
	})

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
	let stack = [mazeStart]

	exploredNodes = initExploredNodesArray()

	while (stack.length > 0) {
		const [row, col] = stack.pop()
		exploredNodes[row][col] = true
		setCellState(row, col, { highlight: "current" })

		draw()

		await new Promise((resolve) => setTimeout(resolve, mazeGenerationSpeed))

		const neighbors = getNeighbors([row, col])

		if (!Array.isArray(neighbors) || !neighbors.length > 0) {
			setCellState(row, col, { highlight: "closedSet" })
			continue
		}

		const [nextRow, nextCol] = getRandomItem(neighbors)
		removeWalls(row, col, nextRow, nextCol)

		stack.push([row, col], [nextRow, nextCol])

		setCellState(row, col, { highlight: "openSet" })
		setCellState(nextRow, nextCol, { highlight: "openSet" })
	}
}

async function randomizedPrims() {
	let stack = []

	exploredNodes = initExploredNodesArray()
	exploredNodes[mazeStart[0]][mazeStart[1]] = true
	setCellState(mazeStart[0], mazeStart[1], { highlight: "closedSet" })
	draw()

	getNeighbors(mazeStart).forEach((neighbor) => {
		const [row, col] = neighbor
		stack.push([row, col])
		setCellState(row, col, { highlight: "openSet" })
	})

	while (stack.length > 0) {
		const [row, col] = getRandomItem(stack)

		draw()

		const neighbors = getNeighbors([row, col], true)

		const [nextRow, nextCol] = getRandomItem(neighbors)

		exploredNodes[row][col] = true
		setCellState(row, col, { highlight: "closedSet" })
		removeWalls(row, col, nextRow, nextCol)
		getNeighbors([row, col]).forEach((neighbor) => {
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
			let neighbors = getNeighbors([row, col], false, false, true)
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
		const [[row, col], [neighborRow, neighborCol]] =
			getRandomItem(randomizedQueue)
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

		getNeighbors([row, col], false, true).forEach((neighbor) => {
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

		getNeighbors([row, col], false, true).forEach((neighbor) => {
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

		getNeighbors([row, col], false, true).forEach((neighbor) => {
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

setup()
draw()
