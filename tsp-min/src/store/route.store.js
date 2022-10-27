import { defineStore } from "pinia";
import { useQuasar } from "quasar";

export const useRouteStore = defineStore("routeStore", {
  state: () => ({
    SERVER: "http://localhost:5000",
    NEAREST: "/nearest/v1/driving/",
    ROUTE: "/route/v1/driving/",
    route_layer: null,
    route_cache: [],
  }),
  getters: {},
  actions: {
    /**
     * This function calculates all routes between all cities from a given set of cities.
     * @param { Array<{ city: string, lat: string, lng: string, ... }> } cities
     * @param $q The quasar instance
     * @param updateProgress A function that is called to update the progress bar
     * @returns { Promise<Array<{ from: string, to: string, route: { distance_direct: number, duration: number, ... } }>> } A promise that resolves to an array of routes
     *
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

      if (amountOfRoutes > 30) {
        const proceed = await new Promise((resolve) => {
          $q.dialog({
            title: "Warning",
            message: `This selection of destinations would yield ${amountOfRoutes}. Do you want to continue?`,
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

          // check if the route from <-> to is already in the routes array
          const routeExists = routes.some((r) => {
            return r.from === to.city && r.to === from.city;
          });

          if (routeExists) {
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

          const route = await this.calculateRoute(from, to);

          routes.push({
            from: from.city,
            to: to.city,
            route,
          });

          updateProgress(routes.length / amountOfRoutes);
        }
      }

      // add the route cache to local store.
      this.route_cache.push(...routes);

      return routes;
    },

    /**
     * This function calculates the route between two cities that can be displayed on a map.
     * @param {city, lat, lng, ...} from The origin city
     * @param {city, lat, lng, ...} to The destination city
     */
    async calculateRoute(from, to) {
      try {
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
      } catch (e) {
        console.error(e);
        return null;
      }
    },
  },
});
