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
    if (selected && selected.parentNode !== cell) {
        sendGameData("movecat", [selected.id, cell.id]);
        moveCat(selected.id, cell.id);
    }
}

function moveCat(catID, cellID) {

    if (selected && selected.id === catID) {
        deselectCat();
    }

    const cat = document.getElementById(catID);
    const cell = document.getElementById(cellID);
    const startPos = cat.getBoundingClientRect();
    const targetPos = cell.getBoundingClientRect();

    cat.style.transition = "transform 500ms ease-in-out";
    cat.style.transform = `translate(${targetPos.left - startPos.left}px, ${targetPos.top - startPos.top}px)`;

    setTimeout(() => {
        cell.appendChild(cat);
        cat.style.left = "0";
        cat.style.right = "0";
        cat.style.transform = "";

    }, 500);
}

function initGame() {

    field = document.getElementById("field");
    board = document.getElementById("board");
    grayHand = document.getElementById("GrayHand");
    redHand = document.getElementById("RedHand");

    for (let i = 0; i < 8; i++) {
        const newRedCell = document.createElement("div");
        newRedCell.id = ("red" + i);
        newRedCell.classList.add("catBox");
        redHand.appendChild(newRedCell);

        const newRedCat = document.createElement("div");
        newRedCat.id = ("CatRed" + i);
        newRedCat.classList.add("kitten", "red");
        newRedCell.appendChild(newRedCat);

        const newGrayCell = document.createElement("div");
        newGrayCell.id = ("gray" + i);
        newGrayCell.classList.add("catBox");
        grayHand.appendChild(newGrayCell);

        const newGrayCat = document.createElement("div");
        newGrayCat.id = ("CatGray" + i);
        newGrayCat.classList.add("kitten", "gray");
        newGrayCell.appendChild(newGrayCat);
    }

    const a = 6;
    for (let i = 0; i < (a + 2) ** 2; i++) {
        const newBoardCell = document.createElement("div");
        newBoardCell.id = ("BoardCell" + i);
        newBoardCell.classList.add("boardCell");
        if (i < a + 2) {newBoardCell.classList.add("top")};
        if (i >= (a + 2) * (a + 1)) {newBoardCell.classList.add("bottom")};
        if (i % (a + 2) == 0) {newBoardCell.classList.add("left")};
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

let selected, field, board, cells, counters, grayHand, redHand, grayCells, redCells;
initGame();

catchEvent('receiveGameData', data => {
    if (data.type === 'movecat') {
        moveCat(data.value[0], data.value[1]);
    }        
});