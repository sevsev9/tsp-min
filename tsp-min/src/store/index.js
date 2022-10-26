import { defineStore } from "pinia";

export const useMapStore = defineStore("mapstore", {
  state: () => ({
    _selected_city: {
      city: "Vienna",
      lat: "48.2083",
      lng: "16.3731",
      country: "Austria",
      iso2: "AT",
      admin_name: "Wien",
      capital: "primary",
      population: "1911191",
      population_proper: "1911191",
    },

    _cities: [
      /**
       * Array of same format as selected_city
       */
    ],
    distance_pairs: [
      /**
       * @TODO: Calculate and create driving distance pairs for every city.
       *   -> from city, to city, distance_direct (km), distance_driven (km), avg_duration (h m s)
       */
    ],
    map: null,
    point_layer: null,
  }),
  getters: {
    selected_city: (state) => state._selected_city,
    cities: (state) => state._cities,
    city_options: (state) => {
      return state._cities.map((city) => {
        return {
          value: city,
          label: city.city,
        };
      });
    },
  },
  actions: {
    /**
     *
     * @param {import("quasar").QNotifyAction} notify optional notify object to display errors in the ui
     */
    async fetchCities(notify) {
      // load citys only if they are not already loaded
      if (this.cities.length === 0) {
        try {
          // load cities from public resources
          const cities = await fetch("/cities.json").then((res) => res.json());

          this._selected_city = cities[0];
          this._cities = cities;

          if (notify) {
            notify({
              type: "positive",
              message: "Cities loaded",
              icon: "check",
            });
          }

          return true;
        } catch (e) {
          if (notify) {
            notify({
              type: "negative",
              message: "Error fetching cities",
              caption: e.message,
              icon: "error",
            });
          }
          return false;
        }
      }
    },

    /**
     * Calculates the direct distance from one coordinate (lat, lng) to another.
     *
     * @param {number} lat1
     * @param {number} lng1
     * @param {number} lat2
     * @param {number} lng2
     * @returns {number} distance in meters
     *
     * Source: https://stackoverflow.com/a/18883819
     */
    getDistanceFromLatLonInKm(lat1, lng1, lat2, lng2) {
      const R = 6371; // Radius of the earth in km
      const dLat = this.deg2rad(lat2 - lat1); // deg2rad below
      const dLon = this.deg2rad(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) *
          Math.cos(this.deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c; // Distance in km
      return d;
    },
  },
});
