"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/@sabaki/go-board/src/GoBoard.js
  var require_GoBoard = __commonJS({
    "node_modules/@sabaki/go-board/src/GoBoard.js"(exports, module) {
      var alpha = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
      function vertexEquals([x1, y1], [x2, y2]) {
        return x1 === x2 && y1 === y2;
      }
      var GoBoard = class {
        constructor(signMap = []) {
          this.signMap = signMap;
          this.height = signMap.length;
          this.width = this.height === 0 ? 0 : signMap[0].length;
          if (signMap.some((row) => row.length !== this.width)) {
            throw new Error("signMap is not well-formed");
          }
          this._players = [1, -1];
          this._captures = [0, 0];
          this._koInfo = { sign: 0, vertex: [-1, -1] };
        }
        get([x, y]) {
          return this.signMap[y] != null ? this.signMap[y][x] : null;
        }
        set([x, y], sign) {
          if (this.has([x, y])) {
            this.signMap[y][x] = sign;
          }
          return this;
        }
        has([x, y]) {
          return 0 <= x && x < this.width && 0 <= y && y < this.height;
        }
        clear() {
          this.signMap = this.signMap.map((row) => row.map((_) => 0));
          return this;
        }
        makeMove(sign, vertex, {
          preventSuicide = false,
          preventOverwrite = false,
          preventKo = false
        } = {}) {
          let move = this.clone();
          if (sign === 0 || !this.has(vertex))
            return move;
          if (preventOverwrite && !!this.get(vertex)) {
            throw new Error("Overwrite prevented");
          }
          sign = sign > 0 ? 1 : -1;
          if (preventKo && this._koInfo.sign === sign && vertexEquals(this._koInfo.vertex, vertex)) {
            throw new Error("Ko prevented");
          }
          move.set(vertex, sign);
          let neighbors = move.getNeighbors(vertex);
          let deadStones = [];
          let deadNeighbors = neighbors.filter((n) => move.get(n) === -sign && !move.hasLiberties(n));
          for (let n of deadNeighbors) {
            if (move.get(n) === 0)
              continue;
            for (let c of move.getChain(n)) {
              move.set(c, 0).setCaptures(sign, (x) => x + 1);
              deadStones.push(c);
            }
          }
          let liberties = move.getLiberties(vertex);
          let hasKo = deadStones.length === 1 && liberties.length === 1 && vertexEquals(liberties[0], deadStones[0]) && neighbors.every((n) => move.get(n) !== sign);
          move._koInfo = {
            sign: hasKo ? -sign : 0,
            vertex: hasKo ? deadStones[0] : [-1, -1]
          };
          if (deadStones.length === 0 && liberties.length === 0) {
            if (preventSuicide) {
              throw new Error("Suicide prevented");
            }
            for (let c of move.getChain(vertex)) {
              move.set(c, 0).setCaptures(-sign, (x) => x + 1);
            }
          }
          return move;
        }
        analyzeMove(sign, vertex) {
          let pass = sign === 0 || !this.has(vertex);
          let overwrite = !pass && !!this.get(vertex);
          let ko = this._koInfo.sign === sign && vertexEquals(this._koInfo.vertex, vertex);
          let originalSign = this.get(vertex);
          this.set(vertex, sign);
          let capturing = !pass && this.getNeighbors(vertex).some((n) => this.get(n) === -sign && !this.hasLiberties(n));
          let suicide = !pass && !capturing && !this.hasLiberties(vertex);
          this.set(vertex, originalSign);
          return { pass, overwrite, capturing, suicide, ko };
        }
        getCaptures(sign) {
          let index = this._players.indexOf(sign);
          if (index < 0)
            return null;
          return this._captures[index];
        }
        setCaptures(sign, mutator) {
          let index = this._players.indexOf(sign);
          if (index >= 0) {
            this._captures[index] = typeof mutator === "function" ? mutator(this._captures[index]) : mutator;
          }
          return this;
        }
        isSquare() {
          return this.width === this.height;
        }
        isEmpty() {
          return this.signMap.every((row) => row.every((x) => !x));
        }
        isValid() {
          let liberties = {};
          for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
              let vertex = [x, y];
              if (this.get(vertex) === 0 || vertex in liberties)
                continue;
              if (!this.hasLiberties(vertex))
                return false;
              this.getChain(vertex).forEach((v) => liberties[v] = true);
            }
          }
          return true;
        }
        getDistance([x1, y1], [x2, y2]) {
          return Math.abs(x2 - x1) + Math.abs(y2 - y1);
        }
        getNeighbors(vertex) {
          if (!this.has(vertex))
            return [];
          let [x, y] = vertex;
          return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter((v) => this.has(v));
        }
        getConnectedComponent(vertex, predicate, result = null) {
          if (!this.has(vertex))
            return [];
          if (!result)
            result = [vertex];
          for (let v of this.getNeighbors(vertex)) {
            if (!predicate(v))
              continue;
            if (result.some((w) => vertexEquals(w, v)))
              continue;
            result.push(v);
            this.getConnectedComponent(v, predicate, result);
          }
          return result;
        }
        getChain(vertex) {
          let sign = this.get(vertex);
          return this.getConnectedComponent(vertex, (v) => this.get(v) === sign);
        }
        getRelatedChains(vertex) {
          if (!this.has(vertex) || this.get(vertex) === 0)
            return [];
          let signs = [this.get(vertex), 0];
          let area = this.getConnectedComponent(vertex, (v) => signs.includes(this.get(v)));
          return area.filter((v) => this.get(v) === this.get(vertex));
        }
        getLiberties(vertex) {
          if (!this.has(vertex) || this.get(vertex) === 0)
            return [];
          let chain = this.getChain(vertex);
          let liberties = [];
          let added = {};
          for (let c of chain) {
            let freeNeighbors = this.getNeighbors(c).filter((n) => this.get(n) === 0);
            liberties.push(...freeNeighbors.filter((n) => !(n in added)));
            freeNeighbors.forEach((n) => added[n] = true);
          }
          return liberties;
        }
        hasLiberties(vertex, visited = {}) {
          let sign = this.get(vertex);
          if (!this.has(vertex) || sign === 0)
            return false;
          if (vertex in visited)
            return false;
          let neighbors = this.getNeighbors(vertex);
          if (neighbors.some((n) => this.get(n) === 0))
            return true;
          visited[vertex] = true;
          return neighbors.filter((n) => this.get(n) === sign).some((n) => this.hasLiberties(n, visited));
        }
        clone() {
          let result = new GoBoard(this.signMap.map((row) => [...row])).setCaptures(1, this.getCaptures(1)).setCaptures(-1, this.getCaptures(-1));
          result._koInfo = this._koInfo;
          return result;
        }
        diff(board2) {
          if (board2.width !== this.width || board2.height !== this.height) {
            return null;
          }
          let result = [];
          for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
              let sign = board2.get([x, y]);
              if (this.get([x, y]) === sign)
                continue;
              result.push([x, y]);
            }
          }
          return result;
        }
        stringifyVertex(vertex) {
          if (!this.has(vertex))
            return "";
          return alpha[vertex[0]] + (this.height - vertex[1]);
        }
        parseVertex(coord) {
          if (coord.length < 2)
            return [-1, -1];
          let x = alpha.indexOf(coord[0].toUpperCase());
          let y = this.height - +coord.slice(1);
          let v = [x, y];
          return this.has(v) ? v : [-1, -1];
        }
        getHandicapPlacement(count, { tygem = false } = {}) {
          if (Math.min(this.width, this.height) <= 6 || count < 2)
            return [];
          let [nearX, nearY] = [this.width, this.height].map((x) => x >= 13 ? 3 : 2);
          let [farX, farY] = [this.width - nearX - 1, this.height - nearY - 1];
          let [middleX, middleY] = [this.width, this.height].map((x) => (x - 1) / 2);
          let result = !tygem ? [[nearX, farY], [farX, nearY], [farX, farY], [nearX, nearY]] : [[nearX, farY], [farX, nearY], [nearX, nearY], [farX, farY]];
          if (this.width % 2 !== 0 && this.height % 2 !== 0 && this.width !== 7 && this.height !== 7) {
            if (count === 5)
              result.push([middleX, middleY]);
            result.push([nearX, middleY], [farX, middleY]);
            if (count === 7)
              result.push([middleX, middleY]);
            result.push([middleX, nearY], [middleX, farY], [middleX, middleY]);
          } else if (this.width % 2 !== 0 && this.width !== 7) {
            result.push([middleX, nearY], [middleX, farY]);
          } else if (this.height % 2 !== 0 && this.height !== 7) {
            result.push([nearX, middleY], [farX, middleY]);
          }
          return result.slice(0, count);
        }
      };
      GoBoard.fromDimensions = (width, height = null) => {
        if (height == null)
          height = width;
        let signMap = [...Array(height)].map((_) => Array(width).fill(0));
        return new GoBoard(signMap);
      };
      module.exports = GoBoard;
    }
  });

  // node_modules/@sabaki/go-board/src/main.js
  var require_main = __commonJS({
    "node_modules/@sabaki/go-board/src/main.js"(exports, module) {
      var GoBoard = require_GoBoard();
      module.exports = GoBoard;
    }
  });

  // js/index.js
  var import_go_board = __toESM(require_main());
  var opponentSelect = document.getElementById("opponent");
  var opponentColourSelect = document.getElementById("opponent-colour");
  var message = document.getElementById("message");
  var canvas = document.getElementById("canvas");
  opponentSelect.addEventListener("change", checkAITurn);
  opponentColourSelect.addEventListener("change", checkAITurn);
  canvas.addEventListener("click", onClick);
  var ctx = canvas.getContext("2d");
  var size = 63;
  var starPoints = [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]];
  var board = import_go_board.default.fromDimensions(9);
  var previousBoard = board;
  var turn = 1;
  var points = new Array(board.width * board.height).fill(null).map((_, i) => [i % board.width, Math.floor(i / board.width)]);
  var ais = [{}];
  function onClick(e) {
    if (getAIToMove() !== null || turn === 0)
      return;
    makeMove([Math.floor(e.offsetX / size), Math.floor(e.offsetY / size)]);
    checkAITurn();
  }
  function checkAITurn() {
    setTimeout(() => {
      const ai = getAIToMove();
      if (ai !== null)
        makeMove(aiMove(ais[ai]));
    }, 1e3);
  }
  function makeMove(v) {
    const move = board.analyzeMove(turn, v);
    if (move.overwrite || move.pass)
      return;
    if (move.suicide)
      previousBoard = previousBoard.set(v, turn);
    else
      previousBoard = board;
    board = board.makeMove(turn, v);
    turn = -turn;
    render();
    let winner = 0;
    if (board.getCaptures(1) > 0)
      winner = 1;
    else if (board.getCaptures(-1) > 0)
      winner = -1;
    if (winner !== 0) {
      message.textContent = winner === 1 ? "Black wins!" : "White wins!";
      turn = 0;
    }
  }
  function getAIToMove() {
    if (turn !== parseInt(opponentColourSelect.value))
      return null;
    const ai = parseInt(opponentSelect.value);
    if (ai >= 0)
      return ai;
    return null;
  }
  function aiMove(settings) {
    const suicideMoves = [];
    const legalMoves = [];
    for (const point of points) {
      const move = board.analyzeMove(turn, point);
      if (move.overwrite || move.pass)
        continue;
      if (move.suicide) {
        suicideMoves.push(point);
        continue;
      }
      legalMoves.push(point);
    }
    const bestMoves = [legalMoves, suicideMoves].find((a) => a.length > 0);
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }
  function render() {
    canvas.width = board.width * size;
    canvas.height = board.height * size;
    ctx.fillStyle = "#ffdf7f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    for (let x = 0; x < board.width; x++) {
      ctx.moveTo((x + 0.5) * size, 0.5 * size - 0.5);
      ctx.lineTo((x + 0.5) * size, (board.height - 0.5) * size + 0.5);
    }
    for (let y = 0; y < board.height; y++) {
      ctx.moveTo(0.5 * size - 0.5, (y + 0.5) * size);
      ctx.lineTo((board.width - 0.5) * size + 0.5, (y + 0.5) * size);
    }
    ctx.stroke();
    ctx.fillStyle = "#000000";
    for (const [x, y] of starPoints) {
      ctx.beginPath();
      ctx.ellipse((x + 0.5) * size, (y + 0.5) * size, 3, 3, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
    for (const point of points) {
      const [x, y] = point;
      const stone = board.get(point);
      const previousStone = previousBoard.get(point);
      if (stone !== 0) {
        ctx.fillStyle = stone === 1 ? "#000000" : "#ffffff";
        ctx.beginPath();
        ctx.ellipse((x + 0.5) * size, (y + 0.5) * size, size * 0.5 - 0.5, size * 0.5 - 0.5, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        if (previousStone === 0) {
          ctx.fillStyle = stone === 1 ? "#ffffff" : "#000000";
          ctx.beginPath();
          ctx.ellipse((x + 0.5) * size, (y + 0.5) * size, 7.5, 7.5, 0, 0, 2 * Math.PI);
          ctx.fill();
        }
      } else if (previousStone !== 0) {
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
})();
//# sourceMappingURL=index.js.map
