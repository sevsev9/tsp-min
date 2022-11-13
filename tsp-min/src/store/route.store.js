import { defineStore } from "pinia";
import { useQuasar } from "quasar";

export const useRouteStore = defineStore("routeStore", {
  state: () => ({
    SERVER: "http://localhost:5000",
    NEAREST: "/nearest/v1/driving/",
    ROUTE: "/route/v1/driving/",
    route_cache: [],
  }),
  getters: {},
  actions: {
    /**
     * This function calculates all routes between all cities from a given set of cities.
     * @param { Array<{ city: string, lat: string, lng: string, ... }> } cities
     * @param $q The quasar instance
     * @param updateProgress A function that is called to update the progress bar
     * @returns { Promise<Array<{ from: string, to: string, data: { distance_direct: number, duration: number, ... } }>> } A promise that resolves to an array of routes
     *
     * @throws { Error } If the route could not be calculated
     * @throws { Error } If the routing server is not reachable
     * @TODO implement cancelation of the loading process
     */
    async calculateRoutes(cities, $q, updateProgress) {
      if (!$q) {
        throw new Error("No Quasar instance provided!");
      }

      if (cities.length < 2) {
        return;
      }

      const routes = [
        /*
          from: string,
          to: string,
          route: Route
        */
      ];

      // calculate the amount of routes (triangular number) for the number of destinations
      const amountOfRoutes = (cities.length * (cities.length - 1)) / 2;

      // check if the route yield is higher than recommended
      if (amountOfRoutes > 30) {
        const proceed = await this.dialogGuard($q, amountOfRoutes);

        if (!proceed) {
          $q.notify({
            message: "Route calculation cancelled",
            color: "negative",
            position: "top",
          });
          return;
        }
      }

      // display the dialog
      updateProgress(0);

      // calculate a route for every pair of cities
      for (let i = 0; i < cities.length; i++) {
        for (let j = 0; j < cities.length; j++) {
          if (i === j) {
            continue;
          }

          const from = cities[i];
          const to = cities[j];

          //@TODO: Let the user decide if the routes should be handled the same way around or not as the route time might differ in either direction.

          // check if the route from <-> to is already in the routes array
          if (routes.some( r => (
            (r.from === to.city && r.to === from.city) ||
            (r.from === from.city  && r.to === to.city)))) {
            continue;
          }

          // check if the route already exists in cache
          const cached = this.route_cache.find(
            (route) =>
              (route.from === cities[i].city && route.to === cities[j].city) ||
              (route.from === cities[j].city && route.to === cities[i].city)
          );

          if (cached) {
            routes.push(cached);
            continue;
          }

          const route = await this.getRoute(from, to);

          routes.push({
            from: from.city,
            to: to.city,
            data: route,
          });

          updateProgress(routes.length / amountOfRoutes);
        }
      }

      // add the route cache to local store.
      this.route_cache.push(...routes);

      return routes;
    },

    /**
     * This is a dialog guard to notify the user that the amount of routes he is about to calculate is very high.
     *
     * @returns {Promise<boolean>} Weather the user wants to continue or not
     */
    dialogGuard($q, amount) {
      return new Promise((resolve) => {
        $q.dialog({
          title: "Warning",
          message: `This selection of destinations would yield ${amount}. Do you want to continue?`,
          icon: "warning",
          persistent: true,
          ok: {
            label: "Continue",
            color: "warning",
          },
          cancel: {
            label: "Cancel",
            color: "negative",
          },
        })
          .onOk(() => resolve(true))
          .onCancel(() => resolve(false));
      });
    },

    /**
     * This function calculates the route between two cities that can be displayed on a map.
     * @param {city, lat, lng, ...} from The origin city
     * @param {city, lat, lng, ...} to The destination city
     *
     * @returns {Promise<{distance: number, duration: number, geometry: import("ol/format/GeoJSON").GeoJSONObject, weight: number, weight_name: string}>} A promise that resolves to a route
     */
    async getRoute(from, to) {
      const res = await fetch(
        `${this.SERVER}${this.ROUTE}${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`
      ).then((res) => res.json());

      if (res.code === "Ok") {
        return res.routes[0];
      } else {
        const $q = useQuasar();
        $q.notify({
          title: "Error",
          message: res.message,
          icon: "error",
        });
      }
    },
  },
});
