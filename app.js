let decBtn = document.getElementById("decreaseBtn");
let incBtn = document.getElementById("increaseBtn");
let colorCount = document.getElementById("colorCount");
let generateBtn = document.getElementById("generateBtn");


let count =5;
colorCount.innerText = count;
// decreasing button
decBtn.addEventListener("click",()=>{
    
    if(count>1){
        count--;
    }
    colorCount.innerText = count;
})
//increasing button
incBtn.addEventListener("click",()=>{
    if(count<8){
        count++;
    }
    colorCount.innerText = count;
})


// function that creates the random hex color code
function randomHexColor(){
    let hexCode = "0123456789ABCDEF";
    let color = "#";
    for(let i=0; i<6; i++){
        let character = hexCode[Math.floor(Math.random()*16)];
        color = color + character ;
       }
       return color;
}


// function that generates the palates according to the count
function generatePalette(){
    let colors= [];
    for(let i=0; i<count; i++){
        colors.push(randomHexColor());
    }
    return colors;
}




//function that render the palette
function renderPalette(colors){
    let strip = document.getElementById("paletteStrip");
    strip.innerHTML = "";  //clear the existing palette

    for(let i=0; i<colors.length; i++){
        let color = colors[i];
        let card = `<div class="color-card" style="background:${color};">
    <div class="color-info">
        <span class="color-hex">${color}</span>
        <button class="copy-btn">copy</button>
    </div>
    <div class="copy-toast">Copied!</div>
</div>`;

strip.innerHTML += card;
    }
}


//generate button
generateBtn.addEventListener("click", ()=>{
    let colors = generatePalette();
    renderPalette(colors);

})


// to copy the color code to clipboard
 let strip = document.getElementById("paletteStrip");

strip.addEventListener("click", (event)=>{
   
    if(event.target.closest(".copy-btn")){
        let card = event.target.closest(".color-card");
        let hexValue = card.querySelector(".color-hex").innerText;
        navigator.clipboard.writeText(hexValue);

        //show the toast
        let toast = card.querySelector(".copy-toast");
        toast.classList.add("show");
        setTimeout(()=>{
            toast.classList.remove("show");
        }, 1500);

    }
})


// saved button
let savedBtn = document.getElementById("saveBtn");
savedBtn.addEventListener("click", ()=>{
    let hexColors = document.querySelectorAll(".color-hex");
    let savedColors = [];
    for(let i=0; i<hexColors.length; i++){
        savedColors.push(hexColors[i].innerText);
    }

    //saved the hex colors into the grid
    let grid = document.getElementById("savedGrid");
    let emptyState = document.getElementById("emptyState");
    emptyState.style.display= "none"; //hide no pallete saved yet

let spans = "";
for(let i = 0; i < savedColors.length; i++){
    spans += `<span style="background: ${savedColors[i]}"></span>`;
}

let card = `<div class="saved-card">
    <div class="saved-card-strip">
        ${spans}
    </div>
    <div class="saved-card-meta">
        <span class="saved-card-label">${savedColors.length} colors</span>
        <button class="saved-card-del">🗑</button>
    </div>
</div>`;

grid.innerHTML += card;

})


let grid = document.getElementById("savedGrid");
// when clicks the del 
grid.addEventListener("click", (event) => {
    
    // check if DELETE was clicked
    if(event.target.closest(".saved-card-del")) {
        let card = event.target.closest(".saved-card");
        card.remove();
    }
    
    // check if CARD itself was clicked (not delete)
    else if(event.target.closest(".saved-card")) {
        // load that palette into main strip
        let savedCard = event.target.closest(".saved-card");
        let spans = savedCard.querySelectorAll(".saved-card-strip span");
        let colors = [];
        for(let i=0; i<spans.length; i++){
            colors.push(spans[i].style.background );
        }
        //load into main strip
        renderPalette(colors);

    }

})

//when click on space
document.addEventListener("keydown", (event) => {
    if(event.key === " ") {
        // same thing as clicking generate button
         let colors = generatePalette();
    renderPalette(colors);

    }
})


//export button
let exportBtn = document.getElementById("exportBtn");
exportBtn.addEventListener("click",()=>{
    let hexColors = document.querySelectorAll(".color-hex");
    let savedColors = [];
    for(let i=0; i<hexColors.length; i++){
        savedColors.push(hexColors[i].innerText);
    }
    let colorString= savedColors.join(", ");
    navigator.clipboard.writeText(colorString);

})





