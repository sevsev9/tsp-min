import axios from "axios";
import dotenv from "dotenv";
import fs from "fs/promises";
import {cities, createRoutesFromJson, findCity, getAllRequests} from "./Cities";
import {calculateRouteAmount, IRoute, Route, routeInsertWithCheck} from "./Routes";

dotenv.config();

/**
 * Checks if the cache folder is filled with files and reloads cache if no files are present.
 * Produces dataset if cache is populated.
 */
fs.readdir("./cache").then(files => {
    if (files.length === cities.length+1) {   //will be the length of the city array +1
        console.log("Cache is still filled!");
        fs.readFile('./cache/routes_all.json').then(data => {
            console.log("Total unique routes in cache: ", JSON.parse(data.toString()).length);
        })
    } else buildDataset();
}).catch(() => fs.mkdir('./cache').then(() => {
    buildDataset();
}).catch(console.error));

/**
 * Builds the dataset and saves it into the cache folder.
 */
function buildDataset() {
    const allRoutes: Array<IRoute> = [];    // fun fact: length = triangle number sequence --> n(n-1)/2 where n = number of points - 1

    //generate links
    const links: Array<string> = getAllRequests();
    //send requests and process results

    let promises: Array<Promise<void>> = []
    links.forEach(l => {
        promises.push(createPromisedRequest(l, allRoutes));
    });

    Promise.all(promises).then(() => {
        fs.writeFile('./cache/routes_all.json', JSON.stringify(allRoutes)).then(() => {
            console.log("Successfully refreshed cache.");
        })
    })
}

/**
 * Creates a promise, which resolves after all routes have been written to a file and added to the given array.
 * @param link Link to be requested.
 * @param allRoutes Array, to which the routes will be added.
 */
function createPromisedRequest(link: string, allRoutes: Array<IRoute>) {
    return new Promise<void>((resolve, reject) => {
        axios.get(link).then(res => {
            const rt = createRoutesFromJson(res.data);
            writeRoutes(rt).then(() => {
                rt.forEach(e => {
                    routeInsertWithCheck(allRoutes, e);
                })
                resolve();
            }).catch(reject);
        });
    })
}

function writeRoutes(data: Array<IRoute>) {
    return fs.writeFile(`./cache/routes_${data[0].from.name}.json`, JSON.stringify(data))
}






/*
fs.writeFile('./test.csv', data).then(r => {
    console.log(r)
}).catch(err => {
    console.log(err);
});

*/