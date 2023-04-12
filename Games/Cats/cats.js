const JUMP_DURATION = 0.5;
const BOUNCE_DURATION = 0.35;
const RETURN_DELAY = 0.5;
const RETURN_DURATION = 0.5;
const GROW_DELAY = 0.15;
const GROW_DURATION = 0.5;

function selectCat(cat) {
    if (!selected || selected !== cat) {
        deselectCat();
        field.classList.add("catSelected");
        selected = cat;
        selected.classList.add("selected");
    } else {
        deselectCat();
    } 

}

function deselectCat() {
    if (selected) {
        field.classList.remove("catSelected");
        selected.classList.remove("selected");
        selected = undefined;
    }
}

function edgeCell (cell) {
    return (cell.classList.contains('top') || cell.classList.contains('bottom') || cell.classList.contains('left') || cell.classList.contains('right'));
}

function moveToCell(cell) {
    if (selected && selected.parentNode !== cell && !edgeCell(cell)) {
        sendGameData("movecat", [selected.id, cell.id]);
        moveCat(selected.id, cell.id);
    }
}

function animateMovement(cat, cell, aftereffect) {
    const startCell = cat.parentElement;
    if (startCell.classList.contains('catBox')) {startCell.classList.add('free')};
    cell.classList.remove('free');

    const startPos = cat.getBoundingClientRect();
    const targetPos = cell.getBoundingClientRect();

    const reparent = () => {
        cell.appendChild(cat);
        cat.style.left = "0";
        cat.style.right = "0";
        cat.style.transform = "";

        if (aftereffect) {
            aftereffect(cat, cell);
        }

        cat.removeEventListener('transitionend', reparent);
    };
    cat.addEventListener('transitionend', reparent);
    cat.style.transform = `translate(${targetPos.left - startPos.left}px, ${targetPos.top - startPos.top}px)`;
}

function animateGrow(cat, cell, aftereffect) {
    cat.classList.add('cat');
    cat.classList.remove('kitten');

    setTimeout(() => {
        if (aftereffect) {
            aftereffect(cat, cell);
        }
    }, 700);
}


function CellOffset (cell, offset) {
    if ((offset[0] == -1 && cell.classList.contains('left')) ||
        (offset[0] ==  1 && cell.classList.contains('right'))  ||
        (offset[1] == -1 && cell.classList.contains('top')) ||
        (offset[1] ==  1 && cell.classList.contains('bottom'))) {
            return undefined;
        } else {
            const IDnum = parseInt(cell.id.match(/\d+/)[0], 10);
            return document.getElementById("BoardCell" + (IDnum + offset[0] + (a + 2) * offset[1]));
        }
}

function moveToHand(cat, cell) {

    if (cat.classList.contains('gray')) {
        i = 0;
        while (i < grayCells.length && !grayCells[i].classList.contains('free')) {i++};
        if (i < grayCells.length) {
            cat.style.transition = `transform ${RETURN_DURATION}s ease-in-out`; 
            animateMovement(cat, grayCells[i]);
        }
    }

    if (cat.classList.contains('red')) {
        i = 0;
        while (i < redCells.length && !redCells[i].classList.contains('free')) {i++};
        if (i < redCells.length) {
            cat.style.transition = `transform ${RETURN_DURATION}s ease-in-out`; 
            animateMovement(cat, redCells[i]);
        }
    }
}

function returnAllToHands(cat, cell) {
    let i;
    if (edgeCell(cell)) {
        moveToHand(cat, cell);
    }
}

function repel(cat, cell) {
    if (cell.classList.contains('boardCell')) {
        directions.flat().forEach(dir => {
            const offCell = CellOffset(cell, dir);
            if (offCell) {
                const boopedCat = offCell.firstChild;
                const offCell2 = CellOffset(offCell, dir);
                if (boopedCat && (boopedCat!==cat) && (cat.classList.contains("cat") || boopedCat.classList.contains("kitten")) && offCell2 && (!offCell2.firstChild)) {
                    boopedCat.style.transition = `transform ${BOUNCE_DURATION}s ease-out`; 
                    animateMovement(boopedCat, offCell2, returnAllToHands);
                }
            }
        })
    }
}


function moveCat(catID, cellID) {

    if (undoBtn) {
        stateLog.push(gameState());
        undoBtn.classList.remove('inactive');
    }


    if (selected && selected.id === catID) {
        deselectCat();
    }

    const cat = document.getElementById(catID);
    const cell = document.getElementById(cellID);
    const startCell = cat.parentElement;

    if (cell.classList.contains('catBox')) {
        cat.style.transition = `transform ${RETURN_DURATION}s ease-in-out`;
        animateMovement(cat, cell, (startCell.classList.contains('boardCell')) ? animateGrow : undefined);

        if (startCell.classList.contains('boardCell') && !edgeCell(startCell)) {
            if (cat.classList.contains('gray')) {
                switchToRed();
            } else if (cat.classList.contains('red')) {
                switchToGray();
            }
        }
    } else {
        cat.style.transition = `transform ${JUMP_DURATION}s ease-in`;
        animateMovement(cat, cell, repel);
    
        setTimeout(() => {
            let win = false;
            let countred = 0, countgray = 0;

            
            innerCells.forEach(cell => {
                const catmid = cell.firstChild;
                if (catmid && catmid.classList.contains("cat")) {
                    //count cats on the board
                    if (catmid.classList.contains("red")) {countred++};
                    if (catmid.classList.contains("gray")) {countgray++};

                    //check triplets
                    directions.forEach(dir => {
                        const catone = CellOffset(cell, dir[0]).firstChild;
                        const cattwo = CellOffset(cell, dir[1]).firstChild;
                        if (catone && cattwo && catone.classList.contains("cat") && cattwo.classList.contains("cat")) {
                            if (catmid.classList.contains("red") && catone.classList.contains("red") && cattwo.classList.contains("red")) {
                                field.classList.add("redwin");
                                win = true;                        
                            }
                            if (catmid.classList.contains("gray") && catone.classList.contains("gray") && cattwo.classList.contains("gray")) {
                                field.classList.add("graywin");
                                win = true;                        
                            }
                        }
                    })
                }
            })

            if (countred == b) {
                field.classList.add("redwin");
                win = true;    
            }
            if (countgray == b) {
                field.classList.add("graywin");
                win = true;    
            }

            if (win) {
                winsound.play();
            } else {
                innerCells.forEach(cell => {
                    const catmid = cell.firstChild;
                    if (catmid) {
                        directions.forEach(dir => {
                            const catone = CellOffset(cell, dir[0]).firstChild;
                            const cattwo = CellOffset(cell, dir[1]).firstChild;
                            if (catone && cattwo &&
                                ((catmid.classList.contains("red") && catone.classList.contains("red") && cattwo.classList.contains("red")) ||
                                    (catmid.classList.contains("gray") && catone.classList.contains("gray") && cattwo.classList.contains("gray")))) {

                                [catone, catmid, cattwo].forEach(cat => animateGrow(cat, cat.parentElement, moveToHand));
                            }
                        })
                    }
                })
            }

        if (cat.classList.contains('gray')) {
            switchToRed();
        } else if (cat.classList.contains('red')) {
            switchToGray();
        }
        
        }, (JUMP_DURATION + BOUNCE_DURATION + GROW_DELAY) * 1000);
    }
}

function initGame() {

    grayCells = [];
    redCells = [];

    for (let i = 0; i < b; i++) {
        const newRedCell = document.createElement("div");
        newRedCell.id = ("red" + i);
        newRedCell.classList.add("catBox");
        redHand.appendChild(newRedCell);
        redCells.push(newRedCell);

        const newRedCat = document.createElement("div");
        newRedCat.id = ("CatRed" + i);
        newRedCat.classList.add("kitten", "red");
        newRedCell.appendChild(newRedCat);

        const newGrayCell = document.createElement("div");
        newGrayCell.id = ("gray" + i);
        newGrayCell.classList.add("catBox");
        grayHand.appendChild(newGrayCell);
        grayCells.push(newGrayCell);

        const newGrayCat = document.createElement("div");
        newGrayCat.id = ("CatGray" + i);
        newGrayCat.classList.add("kitten", "gray");
        newGrayCell.appendChild(newGrayCat);
    }


    for (let i = 0; i < (a + 2) ** 2; i++) {
        const newBoardCell = document.createElement("div");
        newBoardCell.id = ("BoardCell" + i);
        newBoardCell.classList.add("boardCell");
            if (i < a + 2)              {newBoardCell.classList.add("top")};
            if (i >= (a + 2) * (a + 1)) {newBoardCell.classList.add("bottom")};
            if (i % (a + 2) == 0)       {newBoardCell.classList.add("left")};
            if (i % (a + 2) == (a + 1)) {newBoardCell.classList.add("right")};
            if (i > (a + 2) && i < (a + 1) * (a + 2) && i % (a + 2) >= 1 && i % (a + 2) <= a) {newBoardCell.classList.add("innerCell")};
        board.appendChild(newBoardCell);
    }

    
    cells = document.querySelectorAll(".catBox, .boardCell");
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => moveToCell(cell));
    });
    innerCells = document.querySelectorAll(".innerCell");


    cats = document.querySelectorAll(".kitten, .cat");
    cats.forEach((cat, index) => {
        cat.addEventListener('click', () => selectCat(cat));
    });


};

function deleteAllChildren (obj) {
    while (obj.firstChild) {
        obj.removeChild(obj.firstChild);
    }
}

function resetGame() {
    field.classList.remove("redwin", "graywin", "catSelected");
    selected = undefined;
    deleteAllChildren(grayHand);
    deleteAllChildren(redHand);
    deleteAllChildren(board);
    initGame();
}

function switchToGray() {
    turnInd.classList.remove('redturn');
    turnInd.classList.add('grayturn');
}

function switchToRed() {
    turnInd.classList.remove('grayturn');
    turnInd.classList.add('redturn');
}

function endGrayTurn() {
    sendGameData("endgray", "");
    switchToRed();
}

function endRedTurn() {
    sendGameData("endred", "");
    switchToGray();
}

function gameState() {
    let gamestate = [];
    gamestate.push(Array.from(field.classList));
    gamestate.push(Array.from(turnInd.classList));
    cats.forEach((cat) => {gamestate.push([cat.id, cat.parentElement.id, Array.from(cat.classList)])});
    return gamestate;
}

function loadGameState(gamestate, keepSelection) {
    //console.log(gamestate);

    field.classList.add(...gamestate[0]);
    turnInd.classList.add(...gamestate[1]);

    cats.forEach(cat => {cat.remove()});
    gamestate.slice(2).forEach((catstate) => {
        
        const newCat = document.createElement("div");
        newCat.id = (catstate[0]);

        const catCell = document.getElementById(catstate[1]);
        catCell.appendChild(newCat);        

        newCat.classList.add(...catstate[2]);
        
    });

    cats = document.querySelectorAll(".kitten, .cat");
    cats.forEach((cat, index) => {
        cat.addEventListener('click', () => selectCat(cat));
    });

    document.querySelectorAll(".catBox").forEach(cell => {
        if (cell.firstChild) {
            cell.classList.remove('free');
        } else {
            cell.classList.add('free');
        }
    });

    if (keepSelection) {
        selected = document.querySelector(".kitten.selected, .cat.selected");
    } else {
        cats.forEach(cat => {cat.classList.remove('selected')});
    }

}

const a = 6; //board size
const b = 8; //hand size
const directions = [[[-1,-1],[1,1]], [[-1,0],[1,0]], [[-1,1],[1,-1]], [[0,-1],[0,1]]];
const field = document.getElementById("field");
const board = document.getElementById("board");
const grayHand = document.getElementById("GrayHand");
const redHand = document.getElementById("RedHand");
let selected, cells, innerCells, cats, grayCells, redCells;
var winsound = new Audio('sounds/Party Horn.mp3');
var stateLog = [];
initGame();

catchEvent('receiveGameState', gamestate => {
    if (gamestate!==gameState()) {
        if (undoBtn) {
            const prevstate = stateLog.pop();
    // do not compare .selected class        
            if (prevstate != gamestate) {stateLog = []};
            undoBtn.classList.add('inactive');
        }

        loadGameState(gamestate);
    }
});

catchEvent('receiveGameData', data => {
    if (data.type === 'movecat') {
        moveCat(data.value[0], data.value[1]);
    } else if (data.type === 'gamereset') {
        resetGame();
    } else if (data.type === 'endgray') {
        switchToRed();
    } else if (data.type === 'endred') {
        switchToGray();
    }
    
});

//buttons
document.getElementById('restartBtn').onclick = ()=>{
    resetGame();
    sendGameData("gamereset", "");
};

const undoBtn = document.getElementById('undoBtn');
if (undoBtn) {
    undoBtn.onclick = function () {
        if (!undoBtn.classList.contains('inactive') && stateLog.length > 0) {
            const prevstate = stateLog.pop();
            loadGameState(prevstate, true);
            sendGameState(prevstate);
            if (stateLog.length < 1) {
                undoBtn.classList.add('inactive');
            }
        }
    };
}


const invBtn = document.getElementById('inviteBtn');
invBtn.onclick = function () {
    const invURL = window.location.href + "&app=" + APP_ID;

    navigator.clipboard.writeText(invURL).then(() => {
        invBtn.innerHTML = "✓ link copied";
  })
}

const syncBtn = document.getElementById('syncBtn');
syncBtn.onclick = function () {
    //console.log(gameState());
    sendGameState(gameState());
}

const turnInd = document.getElementById('turnindicator');
turnInd.onclick = function () {
    if (turnInd.classList.contains('redturn')) {
        endRedTurn();
    } else if (turnInd.classList.contains('grayturn')){
        endGrayTurn();
    } else if (Math.random() < 0.5) {
        endRedTurn();
    } else {
        endGrayTurn();
    }
};