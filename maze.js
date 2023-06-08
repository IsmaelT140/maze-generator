let grid = []
let stack = []
// Create openSet and closedSet to keep track of visited and unvisited cells
const openSet = []
const closedSet = []
const w = 64
let current

function setup() {
	createCanvas(512, 512)
	const cols = floor(width / w)
	const rows = floor(height / w)
	// frameRate(10)

	for (let x = 0; x < rows; x += 1) {
		grid[x] = []
		for (let y = 0; y < cols; y += 1) {
			grid[x].push(new Cell(x, y))
		}
	}

	current = grid[0][0]
}

function draw() {
	background(126, 132, 138)

	grid.forEach((row) => row.forEach((cell) => cell.show()))

	current.visited = true

	let next = current.checkNeighbors()

	if (next && !next.visited) {
		next.visited = true
		stack.push(current)
		removeWalls(current, next)
		current = next
	} else if (stack.length !== 0) {
		current = stack.pop()
	} else {
		console.log(
			"%cMaze Completed!",
			"color: #ff00ff; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px #9932cc;"
		)

		// Call the A* algorithm to find the path
		const path = aStar()
		path.forEach((pathCell) => {
			pathCell.isFinalPath = true
		})

		// Redraw the canvas to reflect the changes
		background(126, 132, 138)
		grid.forEach((row) => row.forEach((cell) => cell.show()))

		//Stop the animation loop
		noLoop()
	}
}

function findCell(x, y) {
	if (x < 0 || y < 0 || x > grid.length - 1 || y > grid[x].length - 1) {
		return undefined
	}
	return grid[x][y]
}

function removeWalls(a, b) {
	const dx = a.x - b.x
	const dy = a.y - b.y

	if (dy === 1) {
		a.walls[0] = false
		b.walls[2] = false
	} else if (dx === -1) {
		a.walls[1] = false
		b.walls[3] = false
	} else if (dy === -1) {
		a.walls[2] = false
		b.walls[0] = false
	} else if (dx === 1) {
		a.walls[3] = false
		b.walls[1] = false
	}
}

class Cell {
	constructor(x, y) {
		this.x = x
		this.y = y
		this.walls = [true, true, true, true]
		this.visited = false
		this.isFinalPath = false
	}

	checkNeighbors(aStar) {
		const { x, y } = this
		const neighbors = []

		const top = findCell(x, y - 1)
		const right = findCell(x + 1, y)
		const bottom = findCell(x, y + 1)
		const left = findCell(x - 1, y)

		const adjacentCells = [top, right, bottom, left]
		adjacentCells.forEach((n) => {
			if (n && !n.visited) neighbors.push(n)
		})

		if (aStar) {
			if (!this.walls[0]) neighbors.push(top)
			if (!this.walls[1]) neighbors.push(right)
			if (!this.walls[2]) neighbors.push(bottom)
			if (!this.walls[3]) neighbors.push(left)
			return neighbors
		}

		let next = neighbors[floor(random(0, neighbors.length))]
		return next && !next.visited ? next : undefined
	}

	show() {
		const x = this.x * w
		const y = this.y * w

		stroke(0)
		if (this.walls[0]) line(x, y, x + w, y)
		if (this.walls[1]) line(x + w, y, x + w, y + w)
		if (this.walls[2]) line(x + w, y + w, x, y + w)
		if (this.walls[3]) line(x, y + w, x, y)

		if (this.visited) {
			noStroke()
			fill(238, 239, 240)
			rect(x, y, w, w)
		}

		// Draw cells in the final path with a different color
		if (this.isFinalPath) {
			noStroke()
			fill(40, 110, 200, 200)
			rect(x, y, w, w)
		}
	}
}

/**
 * The function calculates the heuristic value between two points based on their distance in the x and
 * y directions.
 * This is done by calculating the Manhattan distance between two points in a grid.
 * It takes the absolute difference between the x-coordinates and the y-coordinates of the two
 * points, and returns the sum of these differences. This is a heuristic function used in the A*
 * algorithm to estimate the distance between the current cell and the end cell. */
function heuristic(a, b) {
	const dx = a.x - b.x
	const dy = a.y - b.y
	return abs(dx) + abs(dy)
}

function aStar() {
	// Define the start and end cells
	const start = grid[0][0]
	const end = grid[grid.length - 1][grid[0].length - 1]

	// Add the start cell to the openSet
	openSet.push(start)

	// Start the A* algorithm loop
	while (openSet.length > 0) {
		// Find the cell with the lowest f score in the openSet
		let current = openSet[0]
		let currentIndex = 0

		for (let i = 0; i < openSet.length; i += 1) {
			const f = current.g + current.heuristic
			const otherF = openSet[i].g + openSet[i].h
			if (otherF < f) {
				current = openSet[i]
				currentIndex = i
			}
		}

		// Remove the current cell from the openSet and add it to the closedSet
		openSet.splice(currentIndex, 1)
		closedSet.push(current)

		// Check if the current cell is the end cell
		if (current === end) {
			// Path found! Reconstruct the path
			console.log("Path found!")
			let path = []
			let temp = current
			path.push(temp)
			while (temp.previous) {
				path.push(temp.previous)
				temp = temp.previous
			}
			return path
		}

		// Explore the neighbors of the current cell
		const neighbors = current.checkNeighbors(true)
		for (let i = 0; i < neighbors.length; i += 1) {
			const neighbor = neighbors[i]

			// Skip neighbors that are already in the closedSet
			if (closedSet.includes(neighbor)) continue

			// Calculate the g score for the neighbor
			const g = current.g + 1
			let newPath = false

			// Check if the neighbor is already in the openSet
			if (openSet.includes(neighbor)) {
				if (g < neighbor.g) {
					// Update the g score and set newPath to true
					neighbor.g = g
					newPath = true
				}
			} else {
				//Add the neighbor to the openSet and set newPath to true
				neighbor.g = g
				openSet.push(neighbor)
				newPath = true
			}

			// If a new path to the neighbor id found, update its scores and previous cell
			if (newPath) {
				neighbor.h = heuristic(neighbor, end)
				neighbor.f = neighbor.g + neighbor.h
				neighbor.previous = current
			}
		}
	}

	console.log("No path found!")
	return []
}
