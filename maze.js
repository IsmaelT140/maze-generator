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
const rows = 10
const cols = 15
const cellSize = 40
const wallWidth = 40
let grid = Array.from({ length: rows }, () =>
	Array.from({ length: cols }, () => ({
		top: true,
		right: true,
		bottom: true,
		left: true,
		visited: false,
		highlight: false,
	}))
)
const canvas = document.getElementById("mazeCanvas")
const ctx = canvas.getContext("2d")

// canvas.width = cols * cellSize + wallWidth
// canvas.height = rows * cellSize + wallWidth
canvas.width = cols * cellSize + (cols + 1) * wallWidth
canvas.height = rows * cellSize + (rows + 1) * wallWidth

ctx.lineWidth = wallWidth

function drawGrid() {
	ctx.clearRect(0, 0, canvas.width, canvas.height)

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

			ctx.beginPath()
			ctx.lineJoin = "round"
			ctx.lineCap = "round"

			if (cell.top) {
				ctx.moveTo(x - halfLineWidth, y - halfLineWidth)
				ctx.lineTo(x + cellSize + halfLineWidth, y - halfLineWidth)
			}

			if (cell.right && !cellRight) {
				ctx.moveTo(x + cellSize + halfLineWidth, y - halfLineWidth)
				ctx.lineTo(
					x + cellSize + halfLineWidth,
					y + cellSize + halfLineWidth
				)
			}

			if (cell.bottom && !cellBelow) {
				ctx.moveTo(x - halfLineWidth, y + cellSize + halfLineWidth)
				ctx.lineTo(
					x + cellSize + halfLineWidth,
					y + cellSize + halfLineWidth
				)
			}

			if (cell.left) {
				ctx.moveTo(x - halfLineWidth, y - halfLineWidth)
				ctx.lineTo(x - halfLineWidth, y + cellSize + halfLineWidth)
			}

			ctx.stroke()

			/*
			TODO: Fix the coloring and highlighting for the cells and add highlighting groups.
				? Open/Closed sets, Visited/Unvisited, CurrentCell, Frontier
			TODO: Add user input for adjusting maze size.
			TODO: Add option to download the mazes.
			*/

			// if (cell.visited || cell.highlight) {
			// 	ctx.fillStyle = cell.highlight ? "yellow" : "lightblue"
			// 	ctx.fillRect(
			// 		x + wallWidth / 2,
			// 		y + wallWidth / 2,
			// 		cellSize - wallWidth,
			// 		cellSize - wallWidth
			// 	)
			// }
		}
	}
}

async function startAlgorithm(algorithm) {
	drawGrid()

	switch (algorithm) {
		case "generateDepthFirstSearch":
			await depthFirstSearch()
			break
		case "generateRandomizedPrims":
			await randomizedPrims()
			break

		default:
			alert("Please select a valid algorithm.")
			return
	}

	drawGrid()
}

document.getElementById("startButton").addEventListener("click", () => {
	const algorithm = document.getElementById("algorithmSelect").value
	startAlgorithm(algorithm)
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
		const cellVisited = grid[row][col].visited
		return cellVisited === visited
	}
	return false
}

function getNeighbors(row, col, visited = false) {
	const neighbors = []

	if (isCellValid(row - 1, col, visited)) neighbors.push([row - 1, col])

	if (isCellValid(row, col + 1, visited)) neighbors.push([row, col + 1])

	if (isCellValid(row + 1, col, visited)) neighbors.push([row + 1, col])

	if (isCellValid(row, col - 1, visited)) neighbors.push([row, col - 1])

	// console.log(row, col, { neighbors })
	// console.assert(
	// 	neighbors.forEach((neighbor) => {
	// 		const [row, col] = neighbor
	// 		return grid[row][col].visited === visited
	// 	}),
	// 	`Expected neighbors to be visited: ${visited}`
	// )
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

async function depthFirstSearch() {
	let stack = []

	setCellState(0, 0, { visited: true })
	stack.push([0, 0])

	while (stack.length > 0) {
		drawGrid()
		const [row, col] = stack.pop()
		setCellState(row, col, { visited: true })

		const neighbors = getNeighbors(row, col)

		if (Array.isArray(neighbors) && neighbors.length > 0) {
			stack.push([row, col])
			const [nextRow, nextCol] = neighbors[getRandomIndex(neighbors)]
			removeWalls(row, col, nextRow, nextCol)
			setCellState(nextRow, nextCol, { visited: true })
			stack.push([nextRow, nextCol])
		}
		await new Promise((resolve) => setTimeout(resolve, 5))
	}
	console.log(`%cDone!`, logStyles)
}

async function randomizedPrims() {
	let stack = []

	setCellState(0, 0, { visited: true })
	stack.push(...getNeighbors(0, 0))

	while (stack.length > 0) {
		drawGrid()

		const [row, col] = stack.splice(getRandomIndex(stack), 1)[0]

		const neighbors = getNeighbors(row, col, true)

		if (Array.isArray(neighbors) && neighbors.length > 0) {
			const [nextRow, nextCol] = neighbors.splice(
				getRandomIndex(neighbors),
				1
			)[0]

			if (grid[row][col].visited !== grid[nextRow][nextCol].visited) {
				setCellState(row, col, { visited: true })
				removeWalls(row, col, nextRow, nextCol)
				getNeighbors(row, col).forEach((neighbor) => {
					if (!arrayIncludesCell(stack, neighbor)) {
						stack.push(neighbor)
					}
				})
				await new Promise((resolve) => setTimeout(resolve, 5))
			}
		}
	}
	console.log(`%cDone!`, logStyles)
}
