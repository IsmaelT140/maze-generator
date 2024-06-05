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
const rows = 5
const cols = 5
const cellSize = 50
const wallWidth = 5
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

canvas.width = cols * cellSize + wallWidth
canvas.height = rows * cellSize + wallWidth

ctx.lineWidth = wallWidth

function drawGrid() {
	ctx.clearRect(0, 0, canvas.width, canvas.height)

	for (let row = 0; row < rows; row += 1) {
		for (let col = 0; col < cols; col += 1) {
			const cell = grid[row][col]
			const x = col * cellSize
			const y = row * cellSize

			ctx.beginPath()
			ctx.lineJoin = "round"
			ctx.lineCap = "round"

			if (cell.top) ctx.moveTo(x, y), ctx.lineTo(x + cellSize, y)

			if (cell.right)
				ctx.moveTo(x + cellSize, y),
					ctx.lineTo(x + cellSize, y + cellSize)

			if (cell.bottom)
				ctx.moveTo(x, y + cellSize),
					ctx.lineTo(x + cellSize, y + cellSize)

			if (cell.left) ctx.moveTo(x, y), ctx.lineTo(x, y + cellSize)

			ctx.stroke()

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

function getRandomIndex(array) {
	if (!Array.isArray(array)) {
		throw new Error("Input must be an array")
	}
	if (array.length === 0) {
		return -1
	}
	return Math.floor(Math.random() * array.length)
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

function getNeighbors(row, col, visited = false) {
	// ! The visited property is not being properly checked in the conditional statements.
	const neighbors = []

	if (row > 0 && grid[row - 1][col].visited === visited)
		neighbors.push([row - 1, col])

	if (col < cols - 1 && grid[row][col + 1].visited === visited)
		neighbors.push([row, col + 1])

	if (row < rows - 1 && grid[row + 1][col].visited === visited)
		neighbors.push([row + 1, col])

	if (col > 0 && grid[row][col - 1].visited === visited)
		neighbors.push([row, col - 1])

	// console.log(`Neighbors for row: ${row}, col: ${col}: ${neighbors}`)
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
		await new Promise((resolve) => setTimeout(resolve, 10))
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
				// ! Stack is having already visited cells added.
				stack = [...new Set([...stack, ...getNeighbors(row, col)])]
				await new Promise((resolve) => setTimeout(resolve, 5))
			}

			// console.assert(
			// 	stack.forEach((cell) => {
			// 		const [row, col] = cell
			// 		return !grid[row][col].visited
			// 	}),
			// 	`Stack includes cells that have already been visited.`
			// )
		}
	}
	console.log(`%cDone!`, logStyles)
}
