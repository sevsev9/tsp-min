/**
 * Arduino map function (c lang) redone in javascript.
 * source: https://www.arduino.cc/reference/en/language/functions/math/map/
 * @param x The value to be mapped from one range into another.
 * @param in_min In range minimum.
 * @param in_max Out range minimum.
 * @param out_min In range maximum.
 * @param out_max Out range maximum.
 * @return number Mapped value in new range.
 */
function map(x, in_min, in_max, out_min, out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

/**
 * Returns an array of labels if provided with an array.
 * @param arr The array where the labels should be extracted.
 * @returns {Array<String>} An array of unique labels in the array.
 */
function getLabels(arr) {
  let label = [];
  label.push(...arr.map(e => e.to.name));
  label.push(...arr.map(e => e.from.name));
  label = label.filter((v, idx, self) => {    //filter out duplicates.
    return self.indexOf(v) === idx
  });
  return label;
}

/**
 * Handles the user driven data point selection.
 * @param cost_selection The selected value class by the user.
 * @param formatter A provided formatter function.
 */
function selectDataPointDisplay(cost_selection, formatter) {
  if (cost_selection === '') {
    alert("Calculations not implemented yet.");
  } else {
    const dtbtn = document.getElementById("dtbtn");     //Drive Time      (avg_drive_time)
    const ddbtn = document.getElementById("ddbtn");     //Driven Distance (driven_distance)
    const ldbtn = document.getElementById("ldbtn");     //Linear Distance (linear_distance)

    dtbtn.style.backgroundColor = (cost_selection === "avg_drive_time") ? "green" : "white";
    ddbtn.style.backgroundColor = (cost_selection === "driven_distance") ? "green" : "white";
    ldbtn.style.backgroundColor = (cost_selection === "linear_distance") ? "green" : "white";
    selectedCostKey = cost_selection;
    displayMatrix(matrix, labels, matrixDom, cost_selection, formatter);
  }
}

function fadeOutStartButton() {
  const startBtn = document.querySelector("#startButton");

  for (let i = 0; i < 100; i++) { //fade out green button
    setTimeout(() => {
      startBtn.style.background = `rgba(50,255,0,${(1 - ((i + 1) / 100)).toFixed(3)})`;
    }, 5 * i + 1)
  }
}

/**
 * Generates a path string and displays it into a given <p> tag.
 * @param dom The <p> tag dom handle.
 * @param path The Path array to be displayed.
 */
function fillPathDisplay(dom, path) {
  for (const e of path) {
    dom.innerHTML += `<li>${e} ${
      (
        (path.indexOf(e) !== (path.length - 1)) || //checks if the element is last element in array
        rtsFlag    //negates the previous check if the rts flag is set (return route will be added)
      ) ? "&nbsp;&nbsp;&nbsp;&#10146;" : ""} </li>`;
  }

  if (rtsFlag) {  //Adds the return to start path
    dom.innerHTML += `<li> ${path[0]}</li>`
  }
}

function stopBruteForceWorker() {
  worker.terminate();
  worker = undefined;
  fadeOutStartButton();   //Reset button


  // reset contexts
  calcContext.canvas.width = calcContext.canvas.width;
  worstSolContext.canvas.width = worstSolContext.canvas.width;
  bestSolContext.canvas.width = bestSolContext.canvas.width;
}

function setFancyFlag() {
  fancyFlag = !fancyFlag;
}

function toggleSolutions() {
  if (solutionsDom.style.display === "none" && solutionFlag) {
    solutionsDom.style.display = "block";
    for (let i = 0; i < 100; i++) {
      setTimeout(() => {
        solutionsDom.style.opacity = `${((i / 100)).toFixed(2)}`;
      }, 10 + i);
    }
  } else if (!solutionFlag) {
    alert("Please finish a calculation first.")
  } else {
    for (let i = 0; i < 100; i++) {
      setTimeout(() => {
        solutionsDom.style.opacity = `${(1 - (i / 100)).toFixed(2)}`;
      }, 10 + i);
    }
    setTimeout(() => {
      solutionsDom.style.display = "none";
    }, 110)
  }
}

function clearCanvas() {
  solutionFlag = false;

  calcContext.canvas.width = calcContext.canvas.width;
  worstSolContext.canvas.width = worstSolContext.canvas.width;
  bestSolContext.canvas.width = bestSolContext.canvas.width;
}

function startBruteForceWorker() {
  const startBtn = document.querySelector("#startButton");
  if (typeof worker === "undefined") {
    worker = new Worker("js/bruteForceWorker.js");

    worker.onmessage = function (event) {
      if (event.data.type === "new best path") {
        drawPaths(event.data.path, bestSolContext, "green");
        if (rtsFlag) {
          drawPath(event.data.path[0], event.data.path[event.data.path.length - 1], bestSolContext, "blue");
        }
      } else if (event.data.type === "progress update") {
        startBtn.style.background = `linear-gradient(90deg, rgba(50,255,0,1) ${Math.floor(event.data.progress) + 1}%, rgba(255,0,0,1) ${Math.floor(event.data.progress) + 1}%)`
      } else if (event.data.type === "done") {
        solutionFlag = true;
        toggleSolutions();
        const bOl = document.querySelector("#bestSol > div > ol");
        const wOl = document.querySelector("#worstSol > div > ol");
        bOl.innerHTML = "";
        wOl.innerHTML = "";
        const bP = document.querySelector("#bestSol > p");
        const wP = document.querySelector("#worstSol > p");

        switch (selectedCostKey) {
          case "avg_drive_time":
            bP.innerText = "Best driven time: " + formatTime(event.data.bestPath.cost)
            wP.innerText = "Worst driven time: " + formatTime(event.data.worstPath.cost)
            break;
          case "linear_distance":
            bP.innerText = "Best linear (flying) distance: " + formatKilometers(event.data.bestPath.cost)
            wP.innerText = "Worst linear (flying) distance: " + formatKilometers(event.data.worstPath.cost)
            break;
          case "driven_distance":
            bP.innerText = "Best driving distance: " + formatMeters(event.data.bestPath.cost)
            wP.innerText = "Worst driving distance: " + formatMeters(event.data.worstPath.cost)
            break;
          default:
            break;
        }


        fillPathDisplay(bOl, event.data.bestPath.path);
        fillPathDisplay(wOl, event.data.worstPath.path);

        document.getElementById("timeTaken").innerText = formatMs(event.data.timeTaken) + ` for ${event.data.total.toLocaleString()} paths.`;

        worker.terminate();
        worker = undefined; //Reset and "free" worker variable
        fadeOutStartButton();
      } else if (event.data.type === "new worst path") {
        drawPaths(event.data.path, worstSolContext, "red");
        if (rtsFlag) {
          drawPath(event.data.path[0], event.data.path[event.data.path.length - 1], worstSolContext, "orange");
        }
      } else if (event.data.type === "new path") {
        drawPaths(event.data.path, calcContext, "white");
        if (rtsFlag) {
          drawPath(event.data.path[0], event.data.path[event.data.path.length - 1], worstSolContext, "purple");
        }
      }
    }

    worker.postMessage({
      command: "start",
      data: data,
      labels: labels,
      dataKey: selectedCostKey,    //Pass the cost criteria selection.
      addReturnDistance: rtsFlag,  //If the algorithm should add the return-to-start distance.
      city: chosenCity,            //Optional: If set will only calculate routes from a given origin city.
      fancy: fancyFlag             //Just calculates without any fancy visualization or storing methods.
    })
  }
}

function setupDependencies() {
  table = document.querySelector("#dataview > tbody");
  matrixDom = document.querySelector("#matrix");
  fancyFlag = document.getElementById("fancyFlag").checked;
  showBestSolCheckbox = document.getElementById("showBestSol");
  showWorstSolCheckbox = document.getElementById("showWorstSol");
  showPointsCheckbox = document.getElementById("showPoints");
  showMatrixCheckbox = document.getElementById("showMatrix");
  showTableCheckbox = document.getElementById("showTable");
  showOriginCityCheckbox = document.getElementById("showOriginCity");
  addRTSCheckbox = document.getElementById("addRTS");
  chooseCitySelect = document.getElementById("citySelect");

  document.getElementById("dtbtn").style.backgroundColor = "green";
  document.getElementById("ddbtn").style.backgroundColor = "white";
  document.getElementById("ldbtn").style.backgroundColor = "white";


  solutionsDom = document.querySelector('.solutions');

  showBestSolCheckbox.checked = true;
  showWorstSolCheckbox.checked = true;
  showPointsCheckbox.checked = true;
  showMatrixCheckbox.checked = false;
  matrixDom.style.display = "none";
  showTableCheckbox.checked = false;
  document.getElementById("dataview").style.display = "none"
  showOriginCityCheckbox.checked = false;
  chooseCitySelect.parentElement.style.display = "none";
  addRTSCheckbox.checked = false;

  document.querySelector("#about").style.display = "none";

  showBestSolCheckbox.onchange = (e) => {
    bestSolContext.canvas.style.display = (e.target.checked) ? "block" : "none";
  }

  showWorstSolCheckbox.onchange = (e) => {
    worstSolContext.canvas.style.display = (e.target.checked) ? "block" : "none";
  }

  showPointsCheckbox.onchange = (e) => {
    dpContext.canvas.style.display = (e.target.checked) ? "block" : "none";
  }

  showMatrixCheckbox.onchange = (e) => {
    matrixDom.style.display = (e.target.checked) ? "block" : "none";
  }

  addRTSCheckbox.onchange = (e) => {
    rtsFlag = e.target.checked;
  }

  showOriginCityCheckbox.onchange = (e) => {
    chooseCitySelect.parentElement.style.display = (e.target.checked) ? "inline-block" : "none";
    chosenCity = (e.target.checked) ? chooseCitySelect.value : undefined;
  }

  chooseCitySelect.onchange = (e) => {
    chosenCity = e.target.value;
  }

  showTableCheckbox.onchange = (e) => {
    document.getElementById('dataview').style.display = (e.target.checked) ? "block" : "none";
  }

  //Data point canvas setup:
  let canvas = document.querySelector("#map > canvas");
  dpContext = canvas.getContext("2d");
  dpContext.font = DEFAULT_CONTEXT_FONT;
  //Match canvas pixel density and dimensions with actual:
  canvas.width = canvas.getBoundingClientRect().width;
  canvas.height = canvas.getBoundingClientRect().height;

  canvas = document.querySelector("#calcCanvas");
  canvas.width = canvas.getBoundingClientRect().width;
  canvas.height = canvas.getBoundingClientRect().height;
  calcContext = canvas.getContext("2d");

  canvas = document.querySelector("#bestSolCanvas");
  canvas.width = canvas.getBoundingClientRect().width;
  canvas.height = canvas.getBoundingClientRect().height;
  bestSolContext = canvas.getContext("2d");

  canvas = document.querySelector("#worstSolCanvas");
  canvas.width = canvas.getBoundingClientRect().width;
  canvas.height = canvas.getBoundingClientRect().height;
  worstSolContext = canvas.getContext("2d");


  data.forEach(e => {
    table.innerHTML += `<tr><td>${e.from.name}</td><td>${e.to.name}</td><td>${e.linear_distance.toFixed(2)} km</td><td>${(e.driven_distance / 1000).toFixed(2)} km</td><td>${formatTime(e.avg_drive_time)}</td><td>${e.src_address_line}</td><td>${e.dest_address_line}</td></tr>`
  });

  // Display Matrix
  labels = getLabels(data)
  for (const label of labels) {
    chooseCitySelect.innerHTML += `<option value="${label}">${label}</option>`
  }
  matrix = createMatrix(labels);
  displayMatrix(matrix, labels, matrixDom, undefined, formatTime);

  //Vizualisation
  vizualizeDataPoints();
}

function showAbout() {
  document.getElementById("about").style.display = "block"
}

function hideAbout() {
  document.getElementById("about").style.display = "none"
}
