var tileSize = 50;
var xoff = 80;
var yoff = 100;

//human playing vars
var humanPlaying = false;
var left = false;
var right = false;
var up = false;
var down = false;
var p;

//arrays
var tiles = [];
var solids = [];
var dots = [];
var savedDots = [];

var showBest = false;

var winArea;//a solid which is the win zone i.e. the green bits

//gen replay vars
var replayGens = false;
var genPlayer;
var upToGenPos = 0;

//population vars
var numberOfSteps = 10;
var testPopulation;

var winCounter = -1;

var img;
var flip = true;

//population size vars
var  populationSize = 500;
var popPara;
var popPlus;
var popMinus;

//mutation rate vars
var mutationRate = 0.01;
var mrPara;
var mrPlus;
var mrMinus;

//evolution speed vars
var evolutionSpeed =1;
var speedPara;
var speedPlus;
var speedMinus;

//increaseMoves
var movesH3;

var increaseMovesBy =5;
var movesPara;
var movesPlus;
var movesMinus;

var increaseEvery =5;
var everyPara;
var everyPlus;
var everyMinus;

function setup() {
  var canvas = createCanvas(1280,720);
  htmlStuff();
  for (var i = 0; i< 22; i++) {
    tiles[i] = [];
    for (var j = 0; j< 10; j++) {
      tiles[i][j] = new Tile(i, j);
    }
  }

  setLevel1Walls();
  setLevel1Goal();
  setLevel1SafeArea();
  setEdges();
  setSolids();

  p = new Player();
  setDots();
  winArea = new Solid(tiles[17][2], tiles[19][7]);
  testPopulation = new Population(populationSize);
  
  //prevents the window from moving from the arrow keys or the spacebar
    window.addEventListener("keydown", function(e) {
      // space and arrow keys
      if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) { 
          e.preventDefault();
      }
  }, false);
}

function draw(){
  background(180, 181, 254);
  drawTiles();
  wirteAnnotations();

  if (replayGens) {//if replaying the best generations
    if ((genPlayer.dead && genPlayer.fadeCounter <=0) || genPlayer.reachedGoal) { //if the current gen is done
      upToGenPos ++;//next gen
      if (testPopulation.genPlayers.length <= upToGenPos) {//if reached the final gen
        //stop replaying gens
        upToGenPos = 0;
        replayGens = false;
        //return the dots to their saved position

        loadDots();
      } else {//if there are more generations to show
        //set gen player as the best player of that generation
        genPlayer = testPopulation.genPlayers[upToGenPos].giveMeBaby();
        //reset the dots positions
        resetDots();
      }
    } else {//if not done
      //move and show dots
      moveAndShowDots();
      //move and update player
      genPlayer.update();
      genPlayer.show();
    }
  } else//if training normaly
    if (testPopulation.allPlayersDead()) {
      //genetic algorithm
      testPopulation.calculateFitness();
      testPopulation.naturalSelection();
      testPopulation.mutateBabies();
      //reset dots
      resetDots();

      if (testPopulation.gen % increaseEvery ==0) {
        testPopulation.increaseMoves();
      }

    } else {


      for(var j = 0 ; j< evolutionSpeed; j++){
        for (var i = 0; i < dots.length; i ++) {
          dots[i].move();
        }
        testPopulation.update();
      }

      for (var i = 0; i < dots.length; i ++) {
        dots[i].show();
      }
      testPopulation.show();
    }
}
function moveAndShowDots(){
  for (var i = 0; i < dots.length; i ++) {
    dots[i].move();
    dots[i].show();
  }

}
function resetDots(){
  for (var i = 0; i < dots.length; i ++) {
    dots[i].resetDot();
  }

}
function drawTiles(){
  for (var i = 0; i< tiles.length; i++) {
    for (var j = 0; j< tiles[0].length; j++) {
      tiles[i][j].show();
    }
  }
  for (var i = 0; i< tiles.length; i++) {
    for (var j = 0; j< tiles[0].length; j++) {
      tiles[i][j].showEdges();
    }
  }
}

function loadDots(){
  for (var i = 0; i< dots.length; i++) {
    dots[i] = savedDots[i].clone();
  }
}

function saveDots(){
  for (var i = 0; i< dots.length; i++) {
    savedDots[i] = dots[i].clone();
  }
}

function wirteAnnotations(){
  fill(0, 0, 0);
  textSize(20);
  noStroke();
  text("Presiona G para mirar una repetición del mejor jugador en las generaciones actuales",250,620);
  text("Presiona ESPACIO para mostrar al mejor jugador de la generación", 350,680);
  textSize(36);
  if(winCounter > 0){

    if(flip){
      push();

      scale(-1.0,1.0);
      image(img,-300 -img.width + random(5),100+ random(5));
      pop();
    }else{
    image(img,300+ random(5),100 + random(5));
    }
    textSize(100);
    stroke(0);
    winCounter --;
    if(winCounter % 10 ==0){

      flip = !flip;
    }
    textSize(36);
    noStroke();
  }
  if (replayGens) {
    text("Generación: " + genPlayer.gen, 200, 90);
    text("Número de movimientos: " + genPlayer.brain.directions.length, 700, 90);
  }else{
    text("Generación: " + testPopulation.gen, 200, 90);
    if(testPopulation.solutionFound){
      text("Gana en " + testPopulation.minStep + " movimientos",700, 90);
    }else{
      text("Número de movimientos: " + testPopulation.players[0].brain.directions.length, 700, 90);
    }
  }
}
function keyPressed(){
  switch(key) {
    case ' ':
      showBest = !showBest;
      break;
    case 'G'://replay gens
      if (replayGens) {
        upToGenPos = 0;
        replayGens = false;
        loadDots();
      } else
        if (testPopulation.genPlayers.length > 0) {
          replayGens = true;
          genPlayer = testPopulation.genPlayers[0].giveMeBaby();
          saveDots();
          resetDots();
        }
      break;
  }
}

//---------------------------------------------------------------------------------------------------------------------
function htmlStuff(){
  createElement("h2", "Valores de cambio")
  createP("Estos valores toman efecto cuando se acaba la generación actual")
  popPara =  createDiv("Tamaño de la población (se laggea alrededor de 800): " + populationSize);
  popMinus = createButton("-");
  popPlus = createButton('+');

  popPlus.mousePressed(plusPopSize);
  popMinus.mousePressed(minusPopSize);

  mrPara =  createDiv("Razón de mutación: " + mutationRate);
  mrMinus = createButton("1/2");
  mrPlus = createButton('x2');
  mrPlus.mousePressed(plusmr);
  mrMinus.mousePressed(minusmr);

  speedPara =  createDiv("Velocidad del juego: " + evolutionSpeed);
  speedMinus = createButton("-");
  speedPlus = createButton('+');
  speedPlus.mousePressed(plusSpeed);
  speedMinus.mousePressed(minusSpeed);

  movesH3 = createElement("h4", "Incrementar velocidad de mutación de los jugadores por " + increaseMovesBy + " cada " + increaseEvery + " generaciones");
  movesPara = createDiv("Incrementar movimientos por: " + increaseMovesBy);
  movesMinus = createButton("-");
  movesPlus = createButton('+');
  movesPlus.mousePressed(plusMoves);
  movesMinus.mousePressed(minusMoves);
  everyPara = createDiv("Incrementar cada " + increaseEvery + " generaciones");
  everyMinus = createButton("-");
  everyPlus = createButton('+');
  everyPlus.mousePressed(plusEvery);
  everyMinus.mousePressed(minusEvery);
}

function minusPopSize(){
  if(populationSize > 100){
    populationSize -=100;
    popPara.html("Tamaño de la población (se laggea alrededor de 800): " + populationSize);
  }
}
function plusPopSize(){
  if(populationSize < 10000){
    populationSize +=100;
    popPara.html("Tamaño de la población (se laggea alrededor de 800): " + populationSize);

  }
}

function minusmr(){
  if(mutationRate > 0.0001){
    mutationRate /= 2.0;
    mrPara.html("Razón de mutación: " + mutationRate);
  }
}
function plusmr(){
  if(mutationRate <= 0.5){
    mutationRate *= 2.0;
    mrPara.html("Razón de mutación: " + mutationRate);

  }
}

function minusSpeed(){
  if(evolutionSpeed > 1){
    evolutionSpeed -= 1;
    speedPara.html("Velocidad del juego: " + evolutionSpeed);
  }
}
function plusSpeed(){
  if(evolutionSpeed <= 5){
    evolutionSpeed += 1;
    speedPara.html("Velocidad del juego: " + evolutionSpeed);

  }
}


function minusMoves(){
  if(increaseMovesBy >= 1){
    increaseMovesBy -= 1;
    movesPara.html("Incrementar movimientos por: " + increaseMovesBy);
    movesH3.html("Incrementar velocidad de mutación de los jugadores por " + increaseMovesBy + " cada " + increaseEvery + " generaciones");
  }
}
function plusMoves(){
  if(increaseMovesBy <= 500){
    increaseMovesBy += 1;
    movesPara.html("Incrementar movimientos por: " + increaseMovesBy);
    movesH3.html("Incrementar velocidad de mutación de los jugadores por " + increaseMovesBy + " cada " + increaseEvery + " generaciones");
  }
}

function minusEvery(){
  if(increaseEvery > 1){
    increaseEvery -= 1;
    everyPara.html("Incrementar cada " + increaseEvery + " generaciones");
    movesH3.html("Incrementar velocidad de mutación de los jugadores por " + increaseMovesBy + " cada " + increaseEvery + " generaciones");
  }
}
function plusEvery(){
  if(increaseEvery <= 100){
    increaseEvery += 1;
    everyPara.html("Incrementar cada " + increaseEvery + " generaciones");
    movesH3.html("Incrementar velocidad de mutación de los jugadores por " + increaseMovesBy + " cada " + increaseEvery + " generaciones");
  }
}
