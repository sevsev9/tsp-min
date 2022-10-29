import { defineStore } from "pinia";

export const useWorkerStore = defineStore("workerstore", {
  state: () => ({
    worker: null,
    rtsFlag: false, // add return-to-start cost to total route
    selectedDataKey: "distance", // distance | duration
    originCity: null, // if set: will only calculate routes where the start city equals the set origin city
    fancy: false, // the fancy calculation option with drawing and data storing (very slow)
  }),
  actions: {
    startBruteForceWorker() {
      if (typeof this.worker === "undefined") {
        worker = new Worker("workers/bruteForceWorker.js");

        worker.onmessage = function (event) {
          if (event.data.type === "new best path") {
            // new path from worker
            drawPaths(event.data.path, bestSolContext, "green");

            // if the rts flag is set to true, draw the return-to-start path aswell
            if (rtsFlag) {
              // drawPath(
              //   event.data.path[0],
              //   event.data.path[event.data.path.length - 1],
              // );
            }
          } else if (event.data.type === "progress update") {
            event.data.progress;
          } else if (event.data.type === "done") {
            event.data.bestPath;
            event.data.worstPath;

            event.data.bestPath.cost; // contains the calculated cost of the best path (total distance or duration, depends on selection)
            event.data.bestPath.cost; // contains the calculated cost of the worst path (total distance or duration, depends on selection)

            event.data.timeTaken; // contains the time taken for the calculation in milliseconds

            worker.terminate();
            worker = undefined; //Reset and "free" worker variable
          } else if (event.data.type === "new worst path") {
            event.data.path; // contains a path array [city1_name, city2_name, city3_name, ...]

            // if the rts flag is set to true, draw the return-to-start path aswell
            if (rtsFlag) {
              // drawPath(
              //   event.data.path[0],
              //   event.data.path[event.data.path.length - 1],
              // );
            }
          } else if (event.data.type === "new path") {
            // new best path
            event.data.path; // contains a path array [city1_name, city2_name, city3_name, ...]

            // if the rts flag is set to true, draw the return-to-start path aswell
            if (rtsFlag) {
              // drawPath(
              //   event.data.path[0],
              //   event.data.path[event.data.path.length - 1],
              //
            }
          }
        };

        worker.postMessage({
          command: "start",
          data: data /* { from: { name: string }, to: { name: string }, distance: number, duration: number } */,
          labels: labels,   // @TODO: whats that again?
          dataKey: selectedCostKey, // Pass the cost criteria selection. ("distance" | "duration")
          addReturnDistance: rtsFlag, // If the algorithm should add the return-to-start distance.
          city: chosenCity, // Optional: If set will only calculate routes from a given origin city.
          fancy: fancyFlag, // Just calculates without any fancy visualization or storing methods.
        });
      }
    },
  },
});
