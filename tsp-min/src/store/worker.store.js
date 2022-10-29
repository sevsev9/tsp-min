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
              drawPath(
                event.data.path[0],
                event.data.path[event.data.path.length - 1],
                "blue"
              );
            }
          } else if (event.data.type === "progress update") {
            event.data.progress;
          } else if (event.data.type === "done") {
            switch (selectedCostKey) {
              case "avg_drive_time":
                bP.innerText =
                  "Best driven time: " + formatTime(event.data.bestPath.cost);
                wP.innerText =
                  "Worst driven time: " + formatTime(event.data.worstPath.cost);
                break;
              case "linear_distance":
                bP.innerText =
                  "Best linear (flying) distance: " +
                  formatKilometers(event.data.bestPath.cost);
                wP.innerText =
                  "Worst linear (flying) distance: " +
                  formatKilometers(event.data.worstPath.cost);
                break;
              case "driven_distance":
                bP.innerText =
                  "Best driving distance: " +
                  formatMeters(event.data.bestPath.cost);
                wP.innerText =
                  "Worst driving distance: " +
                  formatMeters(event.data.worstPath.cost);
                break;
              default:
                break;
            }

            event.data.bestPath;
            event.data.worstPath;

            event.data.timeTaken;

            worker.terminate();
            worker = undefined; //Reset and "free" worker variable
            fadeOutStartButton();
          } else if (event.data.type === "new worst path") {
            drawPaths(event.data.path, worstSolContext, "red");
            if (rtsFlag) {
              drawPath(
                event.data.path[0],
                event.data.path[event.data.path.length - 1],
                worstSolContext,
                "orange"
              );
            }
          } else if (event.data.type === "new path") {
            drawPaths(event.data.path, calcContext, "white");
            if (rtsFlag) {
              drawPath(
                event.data.path[0],
                event.data.path[event.data.path.length - 1],
                worstSolContext,
                "purple"
              );
            }
          }
        };

        worker.postMessage({
          command: "start",
          data: data, /* { from: { name: string }, to: { name: string }, distance: number, duration: number } */
          labels: labels,
          dataKey: selectedCostKey, //Pass the cost criteria selection.
          addReturnDistance: rtsFlag, //If the algorithm should add the return-to-start distance.
          city: chosenCity, //Optional: If set will only calculate routes from a given origin city.
          fancy: fancyFlag, //Just calculates without any fancy visualization or storing methods.
        });
      }
    },
  },
});
