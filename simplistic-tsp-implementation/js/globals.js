let table;  //global table dom handle
const data = getData(); //global imported data
let matrix; //global matrix data
let labels; //global data labels
let fancyFlag = false; //global for fancy calculations

// Canvas Context globals
let worstSolContext; //global canvas dom handle.
let bestSolContext; //global drawing context for the current best solution.
let dpContext;      // Data Point Context.
let calcContext;      // Data Point Context.

// Values for accurate map calculations.
let minLat;     // Global min Lat for point draw calculations.
let minLong;    // Global min Long for point draw calculations.
let maxLat;     // Global max Lat for point draw calculations.
let maxLong;    // Global max Long for point draw calculations.

const dataPoints = []; //Data point collection with center x and y coordinates

let selectedCostKey = ""  //the user selected cost-key of the data point objects
let worker;

let solutionFlag = false;   //true if the solutions div is populated (a solution has already been calculated)

let rtsFlag = false;        //tells the worker to add the return to start distance
let addRTSCheckbox;

//City select dom and flags
let chosenCity; //the chosen city (undefined if no prioritized city)
let showOriginCityCheckbox; //checkbox dom handle to enable city priority
let chooseCitySelect;   //dom handle for city select;


//show handles
let showBestSolCheckbox;
let showWorstSolCheckbox;
let showPointsCheckbox;
let showMatrixCheckbox;
let showTableCheckbox;
let solutionsDom;
let matrixDom;