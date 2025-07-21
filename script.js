const board = document.getElementById("chessboard");
const piecePositions = {
  a8: 'bR', b8: 'bH', c8: 'bB', d8: 'bQ', e8: 'bK', f8: 'bB', g8: 'bH', h8: 'bR',
  a7: 'bP', b7: 'bP', c7: 'bP', d7: 'bP', e7: 'bP', f7: 'bP', g7: 'bP', h7: 'bP',
  a2: 'wP', b2: 'wP', c2: 'wP', d2: 'wP', e2: 'wP', f2: 'wP', g2: 'wP', h2: 'wP',
  a1: 'wR', b1: 'wH', c1: 'wB', d1: 'wQ', e1: 'wK', f1: 'wB', g1: 'wH', h1: 'wR',
};

// Track state for selection and legal moves
let selectedSquare = null;
let legalMoves = [];

// Track current turn: 'w' (white) or 'b' (black)
let currentTurn = 'w';




// Helper to check if a file/rank is on the board
function inBounds(file, rank) {
  return file >= 'a'.charCodeAt(0) && file <= 'h'.charCodeAt(0)
      && rank >= 1 && rank <= 8;
}

/**
 * Returns an array of destination squares for the piece at `from`.
 * Implements basic chess movement logic for each piece.
 */
function getLegalMoves(from) {
  const piece = piecePositions[from];
  if (!piece) return [];
  const color = piece[0];
  const type = piece[1];
  const file = from.charCodeAt(0);
  const rank = parseInt(from[1], 10);
  const moves = [];

  // Helper to check if a square is empty or capturable
  function canMoveTo(f, r) {
    if (!inBounds(f, r)) return false;
    const pos = String.fromCharCode(f) + r;
    if (!piecePositions[pos]) return true;
    return piecePositions[pos][0] !== color;
  }

  // Helper for sliding pieces (rook, bishop, queen)
  function slide(dfs, drs) {
    for (let d = 0; d < dfs.length; d++) {
      let f = file, r = rank;
      while (true) {
        f += dfs[d];
        r += drs[d];
        if (!inBounds(f, r)) break;
        const pos = String.fromCharCode(f) + r;
        if (!piecePositions[pos]) {
          moves.push(pos);
        } else {
          if (piecePositions[pos][0] !== color) moves.push(pos);
          break;
        }
      }
    }
  }

  switch (type) {
    case 'P': {
      const dir = color === 'w' ? 1 : -1;
      const startRank = color === 'w' ? 2 : 7;
      // Forward
      const oneAhead = String.fromCharCode(file) + (rank + dir);
      if (inBounds(file, rank + dir) && !piecePositions[oneAhead]) {
        moves.push(oneAhead);
        // Two squares from start
        const twoAhead = String.fromCharCode(file) + (rank + 2 * dir);
        if (rank === startRank && !piecePositions[twoAhead]) {
          if (!piecePositions[oneAhead]) moves.push(twoAhead);
        }
      }
      // Captures
      for (const df of [-1, 1]) {
        const f = file + df;
        const r = rank + dir;
        if (inBounds(f, r)) {
          const pos = String.fromCharCode(f) + r;
          if (piecePositions[pos] && piecePositions[pos][0] !== color) {
            moves.push(pos);
          }
        }
      }
      break;
    }
    case 'R': {
      slide([0, 0, 1, -1], [1, -1, 0, 0]);
      break;
    }
    case 'B': {
      slide([1, 1, -1, -1], [1, -1, 1, -1]);
      break;
    }
    case 'Q': {
      slide([0, 0, 1, -1, 1, 1, -1, -1], [1, -1, 0, 0, 1, -1, 1, -1]);
      break;
    }
    case 'K': {
      for (const df of [-1, 0, 1]) {
        for (const dr of [-1, 0, 1]) {
          if (df === 0 && dr === 0) continue;
          const f = file + df, r = rank + dr;
          if (canMoveTo(f, r)) moves.push(String.fromCharCode(f) + r);
        }
      }
      break;
    }
    case 'H': // Knight
    {
      const jumps = [
        [1, 2], [2, 1], [-1, 2], [-2, 1],
        [1, -2], [2, -1], [-1, -2], [-2, -1],
      ];
      for (const [df, dr] of jumps) {
        const f = file + df, r = rank + dr;
        if (canMoveTo(f, r)) moves.push(String.fromCharCode(f) + r);
      }
      break;
    }
  }
  // Only return moves that are on the board and not occupied by own color
  return moves;
}

function renderBoard() {
    board.innerHTML = "";
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let row = 7; row >= 0; row--) {
        for (let col = 0; col < 8; col++) {
            const tile = document.createElement('div');
            tile.classList.add("tile");
            tile.classList.add((row + col) % 2 === 0 ? "light" : "dark");
             
            const position = `${letters[col]}${row + 1}`;
            tile.setAttribute("data-position", position);

            // highlight if this square is selectable or a legal destination
            if (selectedSquare === position) {
              tile.classList.add("selected");
            }
            if (legalMoves.includes(position)) {
              tile.classList.add("highlight");
            }

            const piece = piecePositions[position];
            if (piece) {
                const img = document.createElement("img");
                img.src = `assets/pieces/${piece}.png`;
                img.alt = piece;
                tile.appendChild(img);
            }

            tile.addEventListener("click", handleTileClick);
            board.appendChild(tile);
        }
    }
}
renderBoard();

function handleTileClick(e) {
  const tile = e.currentTarget;
  const position = tile.getAttribute("data-position");
  const piece = piecePositions[position];

  // If a square is already selected and the clicked square is a legal move
  if (selectedSquare && legalMoves.includes(position)) {
    // Move piece
    piecePositions[position] = piecePositions[selectedSquare];
    delete piecePositions[selectedSquare];
    selectedSquare = null;
    legalMoves = [];
    renderBoard();
    // Switch turn
    currentTurn = currentTurn === 'w' ? 'b' : 'w';
    return;
  }

  // Deselect if clicked elsewhere
  if (selectedSquare) {
    selectedSquare = null;
    legalMoves = [];
    renderBoard();
    return;
  }

  // No square selected yet: attempt to select a piece
  if (piece && piece[0] === currentTurn) {
    selectedSquare = position;
    legalMoves = getLegalMoves(position);
    renderBoard();
  }
  function updateTurnDisplay() {
  const turnDisplay = document.getElementById("turn");
  const currentPlayerSpan = document.getElementById("current-player");

  if  (currentTurn === 'w') {
    currentPlayerSpan.textContent = "White's turn";
    turnDisplay.classList.remove('black-turn');
    currentPlayerSpan.textContent = 'White';
  }
    else {
        turnDisplay.classList.add('black-turn');
        currentPlayerSpan.textContent = 'Black';
    }
}

function switchTurn() {
    currentTurn = (currentTurn === 'w') ? 'b' : 'w';
    updateTurnDisplay();
}
updateTurnDisplay();
}