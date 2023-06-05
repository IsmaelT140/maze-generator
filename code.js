let grid = []
let stack = []
let cols, rows
const w = 32
let current

function setup() {
	createCanvas(512, 512)
	cols = floor(width / w)
	rows = floor(height / w)
	// frameRate(10)

	for (let x = 0; x < rows; x += 1) {
		grid[x] = []
		for (let y = 0; y < cols; y += 1) {
			let cell = new Cell(x, y)
			grid[x].push(cell)
		}
	}
	current = grid[0][0]
}

function draw() {
	background(126, 132, 138)
	for (let x = 0; x < grid.length; x += 1) {
		for (let y = 0; y < grid[x].length; y += 1) {
			grid[x][y].show()
		}
	}

	current.visited = true
	current.highlight()
	let next = current.checkNeighbors()
	if (next && !next.visited) {
		next.visited = true
		stack.push(current)
		removeWalls(current, next)
		current = next
	} else if (stack.length !== 0) {
		current = stack.pop()
	} else {
		console.log("%cMaze Completed!", "color: pink; background-color: black")
		noLoop()
	}
}

function findCell(x, y) {
	if (x < 0 || y < 0 || x > cols - 1 || y > rows - 1) {
		//404 Cell not Found. :(
		return false
	}
	return grid[x][y]
}

function removeWalls(a, b) {
	let x = a.x - b.x
	let y = a.y - b.y
	if (y === 1) {
		//Up
		a.walls[0] = false
		b.walls[2] = false
	}
	if (x === -1) {
		//Right
		a.walls[1] = false
		b.walls[3] = false
	}
	if (y === -1) {
		//Down
		a.walls[2] = false
		b.walls[0] = false
	}
	if (x === 1) {
		//Left
		a.walls[3] = false
		b.walls[1] = false
	}
}

function Cell(x, y) {
	this.x = x
	this.y = y
	this.walls = [true, true, true, true]
	this.visited = false
	this.checkNeighbors = () => {
		let neighbors = []

		let top = findCell(x, y - 1)
		let right = findCell(x + 1, y)
		let bottom = findCell(x, y + 1)
		let left = findCell(x - 1, y)

		let adjacentCells = [top, right, bottom, left]
		adjacentCells.forEach((n) => {
			if (n && !n.visited) neighbors.push(n)
		})

		if (neighbors.length !== 0) {
			let r = floor(random(0, neighbors.length))
			let xAssert = Math.abs(this.x - neighbors[r].x)
			let yAssert = Math.abs(this.y - neighbors[r].y)
			console.assert(
				xAssert <= 1,
				`Current x is ${this.x} and the neighbor's x was off by ${xAssert}.`
			)
			console.assert(
				yAssert <= 1,
				`Current y is ${this.y} and the neighbor's x was off by ${yAssert}.`
			)
			return neighbors[r]
		} else {
			return undefined
		}
	}
	this.highlight = function () {
		let x = this.x * w
		let y = this.y * w
		noStroke()
		fill(153, 50, 204)
		rect(x, y, w, w)
	}

	this.show = function () {
		let x = this.x * w
		let y = this.y * w
		stroke(0)
		if (this.walls[0]) {
			line(x, y, x + w, y)
		}
		if (this.walls[1]) {
			line(x + w, y, x + w, y + w)
		}
		if (this.walls[2]) {
			line(x + w, y + w, x, y + w)
		}
		if (this.walls[3]) {
			line(x, y + w, x, y)
		}
		if (this.visited) {
			noStroke()
			fill(238, 239, 240)
			rect(x, y, w, w)
		}
	}
}
