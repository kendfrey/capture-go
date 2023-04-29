import Board, { Sign, Vertex } from "@sabaki/go-board";

// UI elements
const opponentSelect = document.getElementById("opponent") as HTMLSelectElement;
const opponentColourSelect = document.getElementById("opponent-colour") as HTMLSelectElement;
const message = document.getElementById("message") as HTMLDivElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;

// Event listeners
opponentSelect.addEventListener("change", checkAITurn);
opponentColourSelect.addEventListener("change", checkAITurn);
canvas.addEventListener("click", onClick);

// Rendering data
const ctx = canvas.getContext("2d")!;
const size: number = 63;
const starPoints: Vertex[] = [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]];

// Game state
let board: Board = Board.fromDimensions(9);
let previousBoard: Board = board;
let turn: Sign = 1;

// List of possible moves
const points: Vertex[] = new Array(board.width * board.height).fill(null).map((_, i) => [i % board.width, Math.floor(i / board.width)]);

// AI settings
type AISettings = {};
const ais = [{}];

// Handle player moves
function onClick(e: MouseEvent)
{
	// If it's not a human player's turn, ignore it
	if (getAIToMove() !== null || turn === 0)
		return;
	
	// Make the move
	makeMove([Math.floor(e.offsetX / size), Math.floor(e.offsetY / size)]);
	checkAITurn();
}

// Check whether it's an AI's turn
function checkAITurn()
{
	setTimeout(() =>
	{
		const ai = getAIToMove();
		if (ai !== null)
			makeMove(aiMove(ais[ai]));
	},
		1000);
}

// Play a move
function makeMove(v: Vertex)
{
	// Check the move for legality
	const move = board.analyzeMove(turn, v);
	if (move.overwrite || move.pass)
		return;

	// If the move is suicide, put it on the previous board so it appears as a capture
	if (move.suicide)
		previousBoard = previousBoard.set(v, turn);
	else
		previousBoard = board;
	
	// Make the move
	board = board.makeMove(turn, v);
	turn = -turn as Sign;
	render();

	// Check whether the game has ended
	let winner: Sign = 0;
	if (board.getCaptures(1) > 0)
		winner = 1;
	else if (board.getCaptures(-1) > 0)
		winner = -1;

	if (winner !== 0)
	{
		message.textContent = winner === 1 ? "Black wins!" : "White wins!";
		turn = 0;
	}
}

// Check whether it's an AI's turn
function getAIToMove(): number | null
{
	// If it's not the opponent's turn, return null
	if (turn !== parseInt(opponentColourSelect.value))
		return null;
	
	// If the opponent is an AI, return it
	const ai = parseInt(opponentSelect.value);
	if (ai >= 0)
		return ai;

	return null;
}

// Run AI to select a move
function aiMove(settings: AISettings): Vertex
{
	const suicideMoves: Vertex[] = [];
	const legalMoves: Vertex[] = [];

	for (const point of points)
	{
		const move = board.analyzeMove(turn, point);

		// Ignore illegal moves
		if (move.overwrite || move.pass)
			continue;

		// Ignore suicide moves
		if (move.suicide)
		{
			suicideMoves.push(point);
			continue;
		}

		legalMoves.push(point);
	}
	
	// Prefer good moves, then normally legal moves, then suicide
	// Suicide is considered technically legal so that every game ends in a capture
	const bestMoves: Vertex[] = [legalMoves, suicideMoves].find(a => a.length > 0)!;
	return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

// Draw the board
function render()
{
	canvas.width = board.width * size;
	canvas.height = board.height * size;

	// Draw background
	ctx.fillStyle = "#ffdf7f";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Draw lines
	ctx.lineWidth = 1;
	ctx.strokeStyle = "#000000";
	ctx.beginPath();
	for (let x = 0; x < board.width; x++)
	{
		ctx.moveTo((x + 0.5) * size, 0.5 * size - 0.5);
		ctx.lineTo((x + 0.5) * size, (board.height - 0.5) * size + 0.5);
	}
	for (let y = 0; y < board.height; y++)
	{
		ctx.moveTo(0.5 * size - 0.5, (y + 0.5) * size);
		ctx.lineTo((board.width - 0.5) * size + 0.5, (y + 0.5) * size);
	}
	ctx.stroke();

	// Draw star points
	ctx.fillStyle = "#000000";
	for (const [x, y] of starPoints)
	{
		ctx.beginPath();
		ctx.ellipse((x + 0.5) * size, (y + 0.5) * size, 3, 3, 0, 0, 2 * Math.PI);
		ctx.fill();
	}

	// Draw stones
	for (const point of points)
	{
		const [x, y] = point;
		const stone = board.get(point);
		const previousStone = previousBoard.get(point);
		if (stone !== 0)
		{
			// Draw stone
			ctx.fillStyle = stone === 1 ? "#000000" : "#ffffff";
			ctx.beginPath();
			ctx.ellipse((x + 0.5) * size, (y + 0.5) * size, size * 0.5 - 0.5, size * 0.5 - 0.5, 0, 0, 2 * Math.PI);
			ctx.fill();
			ctx.stroke();

			// Draw last move marker
			if (previousStone === 0)
			{
				ctx.fillStyle = stone === 1 ? "#ffffff" : "#000000";
				ctx.beginPath();
				ctx.ellipse((x + 0.5) * size, (y + 0.5) * size, 7.5, 7.5, 0, 0, 2 * Math.PI);
				ctx.fill();
			}
		}
		else if (previousStone !== 0)
		{
			// Draw capture marker
			ctx.save();
			ctx.strokeStyle = "#ff0000";
			ctx.lineWidth = 10;
			ctx.beginPath();
			ctx.moveTo((x + 0.25) * size, (y + 0.25) * size);
			ctx.lineTo((x + 0.75) * size, (y + 0.75) * size);
			ctx.moveTo((x + 0.25) * size, (y + 0.75) * size);
			ctx.lineTo((x + 0.75) * size, (y + 0.25) * size);
			ctx.stroke();
			ctx.restore();
		}
	}
}

render();