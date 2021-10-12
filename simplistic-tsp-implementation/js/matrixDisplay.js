/**
 * Displays a quadratic matrix of data points onto the matrix dom.
 * @param matrix A quadratic matrix containing data points.
 * @param labels Point labels to be added into the matrix. Must be the same length as the length and height of the matrix.
 * @param matrixDom The matrix dom handle to be populated with data.
 * @param cost_selection The the label in a single entry data point to be written into the matrix. If not defined it will take the first key of the first data point.
 * @param formatter The formatter function, which will return a string to be displayed in the table.
 */
function displayMatrix(matrix, labels, matrixDom, cost_selection, formatter) {
    const thead = matrixDom.querySelector("table > thead > tr");
    const tbody = matrixDom.querySelector("table > tbody");
    //Reset table:
    thead.innerHTML = "";
    tbody.innerHTML = "";

    //If cost selection is empty:
    if (!cost_selection) {
        cost_selection = Object.keys(matrix[0][0])[0];
    }

    selectedCostKey = cost_selection;

    if (!formatter) {
        formatter = (x) => {
            return x.toFixed(2);
        }
    }

    //Fill table head:
    thead.innerHTML += `<th>${cost_selection}</th>`;   //First cell has to be empty because the left headers start on the second line
    for (let i = 0; i < labels.length; i++) {   //Add city labels to thead
        thead.innerHTML += `<th>${labels[i]}</th>`
    }

    //Fill table body:
    for (let i = 0; i < matrix.length; i++) {
        //Due to efficiency first add it to a string,
        // otherwise the browser will always check the html code and
        // autocomplete open tr tags which will ruin the formatting.
        let row = "";
        row += `<tr><td>${labels[i]}</td>` //Begin new table row and add the label to the far left column
        for (let j = 0; j < matrix[i].length; j++) {    //Write data content to the table row
            row += `<td>${formatter(matrix[i][j][cost_selection])}</td>`
        }
        row += `</tr>`    //End table row
        tbody.innerHTML+=row;
    }
}

//Assumption: Both directions "cost" the same
/**
 * Creates a square matrix containing the data points.
 * @param labels The data point labels which correspond to the matrix.
 * @returns {Array<Array<Object>>} The square matrix.
 */
function createMatrix(labels) {
    const matrix = [];

    for (let i = 0; i < labels.length; i++) {
        matrix.push([]);
        for (let j = 0; j < labels.length; j++) {
            if (i === j) {
                matrix[i][j] = {
                    avg_drive_time: 0,
                    driven_distance: 0,
                    linear_distance: 0
                }
            } else {
                const route = data.find(o => (o.from.name === labels[i] && o.to.name === labels[j]) || (o.to.name === labels[i] && o.from.name === labels[j]));
                matrix[i][j] = {
                    avg_drive_time: route.avg_drive_time,
                    driven_distance: route.driven_distance,
                    linear_distance: route.linear_distance
                };
            }
        }
    }
    return matrix;
}