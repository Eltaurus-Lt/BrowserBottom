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

function moveToCell(cell) {
    if (selected && selected.parentNode !== cell && !cell.classList.contains('top') &&
        !cell.classList.contains('bottom') && !cell.classList.contains('left') && !cell.classList.contains('right')) {
        sendGameData("movecat", [selected.id, cell.id]);
        moveCat(selected.id, cell.id);
    }
}

function animateMovement(cat, cell, afteraction) {
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

        if (afteraction) {
            afteraction(cat, cell);
        }

        cat.removeEventListener('transitionend', reparent);
    };
    cat.addEventListener('transitionend', reparent);
    cat.style.transform = `translate(${targetPos.left - startPos.left}px, ${targetPos.top - startPos.top}px)`;
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

function returnToHand(cat, cell) {
    let i;
    if (cell.classList.contains('left') || cell.classList.contains('right')  ||
    cell.classList.contains('top') || cell.classList.contains('bottom')) {
        if (cat.classList.contains('gray')) {
            i = 0;
            while (i < grayCells.length && !grayCells[i].classList.contains('free')) {i++};
            if (i < grayCells.length) {

                cat.style.transition = "transform 500ms ease-in-out"; 
                animateMovement(cat, grayCells[i]);
            }
        }
        if (cat.classList.contains('red')) {
            i = 0;
            while (i < redCells.length && !redCells[i].classList.contains('free')) {i++};
            if (i < redCells.length) {

                cat.style.transition = "transform 500ms ease-in-out"; 
                animateMovement(cat, redCells[i]);
            }
        }
    }
}

function repel(cat, cell) {
    if (cell.classList.contains('boardCell')) {
        const directions = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
        directions.forEach(dir => {
            const offCell = CellOffset(cell, dir);
            if (offCell) {
                const boopedCat = offCell.firstChild;
                const offCell2 = CellOffset(offCell, dir);
                if (boopedCat && (boopedCat!==cat) && (cat.classList.contains("cat") || boopedCat.classList.contains("kitten")) && offCell2 && (!offCell2.firstChild)) {
                    boopedCat.style.transition = "transform 350ms ease-out"; 
                    animateMovement(boopedCat, offCell2, returnToHand);
                }
            }
        })
    }
}

function moveCat(catID, cellID) {

    if (selected && selected.id === catID) {
        deselectCat();
    }

    const cat = document.getElementById(catID);
    const cell = document.getElementById(cellID);

    if (cell.classList.contains('boardCell')) {
        cat.style.transition = "transform 500ms ease-in";
    } else {
        cat.style.transition = "transform 500ms ease-in-out";
    }
    animateMovement(cat, cell, repel);

}

function initGame() {

    field = document.getElementById("field");
    board = document.getElementById("board");
    grayHand = document.getElementById("GrayHand");
    redHand = document.getElementById("RedHand");

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
        board.appendChild(newBoardCell);
    }

    
    cells = document.querySelectorAll(".catBox, .boardCell");
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => moveToCell(cell));
    });

    counters = document.querySelectorAll(".kitten, .cat");
    counters.forEach((cat, index) => {
        cat.addEventListener('click', () => selectCat(cat));
    });


};

const a = 6; //board size
const b = 8; //hand size
let selected, field, board, cells, counters, grayHand, redHand, grayCells, redCells;
initGame();

catchEvent('receiveGameData', data => {
    if (data.type === 'movecat') {
        moveCat(data.value[0], data.value[1]);
    }        
});