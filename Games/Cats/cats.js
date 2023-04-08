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
        moveCat(selected.id, cell);
    }
}

function moveCat(catID, cell) {

    if (selected.id === catID) {
        deselectCat();
    }

    const cat = document.getElementById(catID);
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
    
    cells = document.querySelectorAll(".catBox, .boardCell");
    cells.forEach(cell => {
        cell.addEventListener('click', () => moveToCell(cell));

        //delete handmade cat divs
        while (cell.firstChild) {
            cell.removeChild(cell.firstChild);
        }

        if (cell.parentElement.id === "GrayHand" && cell.children.length === 0) {
            const newCat = document.createElement("div");
            newCat.classList.add("kitten", "gray");
            cell.appendChild(newCat);
        }

        if (cell.parentElement.id === "RedHand" && cell.children.length === 0) {
            const newCat = document.createElement("div");
            newCat.classList.add("kitten", "red");
            cell.appendChild(newCat);
        }
      });


    counters = document.querySelectorAll(".kitten, .cat");
    counters.forEach((item, index) => {
        item.id = ("cat" + index);
        item.addEventListener('click', () => selectCat(item));
    });


};

let selected, field, cells, counters, grayCells, redCells;
initGame();