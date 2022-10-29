/**
 * Calculates all possible route options for a set of data points.
 * @param matrix The dataset to be calculated from.
 * @param drawLines Boolean. Set true for visual calculation.
 */

let bestPath;  //contains a paths array id
let worstPath; //contains a paths array id
let total;      //total calculations to be done
let started = false;    //if the web worker has been started
let data;       //the data to be worked on
let fancy;      //the fancy calculation option with drawing and data storing
let selectedDataKey;   //The data key to work with as cost.
let addReturnCost = false;     //Add return-to-start cost to total route
let originCity;        //If set: will only calculate routes where the start city equals the set origin city
let startTime;         //Contains the time measurement for the start time;



/**
 * Recursively calculates the factorial of a given number.
 * @param value The number to be calculated the factorial of.
 * @return number The factorial of the given value
 */
function fact(value) {
    return (value !== 0) ? value * fact(value - 1) : 1;
}

/**
 * Returns the cost of a route.
 * @param nameFrom Name of the origin city.
 * @param nameTo Name of the destination city.
 * @param type The data key. (defaults to global variable "selectedCostType")
 */
function getCost(nameFrom, nameTo, type) {
    const idx = data.findIndex(e => {
        return (
            e.from.name === nameFrom && e.to.name === nameTo
        ) || (
            e.from.name === nameTo && e.to.name === nameFrom
        );
    });

    if (!data[idx]) {
        console.log(nameFrom, nameTo);
    }

    return data[idx][type];
}


/**
 * Shuffles a given array.
 * @param array The array to be shuffled
 * @returns Array<Object> The shuffled array.
 */
function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

onmessage = function (e) {
    if (e.data.command === "start") {
        if (!started) {
            originCity = e.data.city;
            addReturnCost = e.data.addReturnDistance;
            data = e.data.data;
            fancy = e.data.fancy;
            labels = e.data.labels;
            selectedDataKey = e.data.dataKey;

            startTime = performance.now();

            // Generate all unique permutations
            let paths = Array.from(uniquePermutations(  ));   // Type: Array of path arrays ([[CityA, CityB, ...], [CityA, CityC, ...]]

            if (originCity) { // If set: only calculates routes which start at the selected city
                paths = paths.filter(v => v[0] === originCity);
            }

            paths = shuffle(paths);

            // Find fastest path
            for (let i = 0; i < paths.length; i++) {
                if (i % 1000 === 0) {
                    postMessage({
                        type: "progress update",
                        progress: (i / paths.length * 100).toFixed(2)
                    })
                }

                let cost = 0;

                for (let j = 0; j < paths[i].length-1; j++) {
                    cost+=getCost(paths[i][j], paths[i][j+1], selectedDataKey);
                }

                if (addReturnCost) {    // Takes into calculation the return-to-start cost
                    cost+=getCost(paths[i][0], paths[i][paths[i].length-1], selectedDataKey);
                }

                paths[i] = {
                    path: paths[i].slice(),
                    cost: cost
                };

                if (fancy) {
                    postMessage({
                        type: "new path",
                        path: paths[i].path,
                        cost: cost
                    });
                }

                if (!worstPath) {
                    worstPath = i;
                    postMessage({
                        type: "new worst path",
                        path: paths[i].path,
                        cost: paths[i].cost
                    });
                } else if (cost > paths[worstPath].cost) {
                    worstPath = i;
                    postMessage({
                        type: "new worst path",
                        path: paths[i].path,
                        cost: paths[i].cost
                    });
                }


                if (!bestPath) {
                    bestPath = i
                } else if (cost < paths[bestPath].cost) {
                    bestPath = i;
                    postMessage({
                        type: "new best path",
                        path: paths[i].path,
                        cost: paths[i].cost
                    })
                }
            }
            console.log(    // Workaround for postMessage asynchronity.
                "done calculation",
                postMessage({
                    type: "done",
                    bestPath: paths[bestPath],
                    worstPath: paths[worstPath],
                    timeTaken: (performance.now() - startTime),
                    total: paths.length
                })
            );


        } else {
            postMessage({
                type: "error",
                message: "already started"
            })
        }
    }
}

function swap(a, i, j) {
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
}

function reverseSuffix(a, start) {
    if (start === 0) {
        a.reverse();
    }
    else {
        let left = start;
        let right = a.length - 1;

        while (left < right)
            swap(a, left++, right--);
    }
}

function nextPermutation(a) {
    // Description of this algorithm:
    //   https://www.nayuki.io/page/next-lexicographical-permutation-algorithm
    const reversedIndices = [...Array(a.length).keys()].reverse();
    const i = reversedIndices.slice(1).find(i => a[i] < a[i + 1]);

    if (i === undefined) {
        a.reverse();
        return false;
    }

    const j = reversedIndices.find(j => a[i] < a[j]);
    swap(a, i, j);
    reverseSuffix(a, i + 1);
    return true;
}

function* uniquePermutations(a) {
    const b = a.slice().sort();

    do {
        yield b.slice();    // Pauses the generator function
    } while (nextPermutation(b));
}
