import { defineStore } from "pinia";

import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
// eslint-disable-next-line
import { Style, Circle, Fill, Icon, Stroke } from "ol/style";
import { Point } from "ol/geom";
import Feature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";

const icon_url =
  "https://cdn.rawgit.com/openlayers/ol3/master/examples/data/icon.png";

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
    route_layer: null,

    // Selected Style
    selectedStyle: new Style({
      stroke: new Stroke({
        width: 3,
        color: "blue",
      }),
      fill: new Fill(),
    }),

    // default route style
    routeStyle: new Style({
      stroke: new Stroke({
        width: 3,
        color: "blue",
        // lineDash: [0.5, 4],
        // lineCap: 'round',
        // lineJoin: 'round',
      }),
      // fill: new ol.style.Fill()
    }),

    onSelect: null,
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

    /**
     * Draws a point for each given city on the map.
     * @param cities An array of city options. ( {value: {city, lat, lng, ...}, label: city} )
     */
    drawPoints(cities) {
      if (this.point_layer) {
        this.map.removeLayer(this.point_layer);
      }

      this.point_layer = new VectorLayer({
        target: "point_layer",
        source: new VectorSource(),
        style: new Style({
          /* image: new Circle({
            radius: 5,
            fill: new Fill({
              color: "red"
            })
          }) */
          image: new Icon({
            anchor: [0.5, 1],
            src: icon_url,
          }),
        }),
      });

      for (let i = 0; i < cities.length; i++) {
        const point = new Point([cities[i].value.lng, cities[i].value.lat]);
        const feature = new Feature(point);
        feature.set('city', cities[i].value);
        this.point_layer.getSource().addFeature(feature);
      }

      this.map.addLayer(this.point_layer);

      this.adjust_map_zoom();
    },

    /**
     * Adjusts the map zoom to include all points in displayed in the points_array.
     */

    adjust_map_zoom() {
      this.map.getView().fit(this.point_layer.getSource().getExtent(), {
        size: this.map.getSize(),
        maxZoom: 16,
      });
    },

    /**
     * Creates a route feature.
     * @param route
     */
    createRouteFeature(geometry) {
      const rf = new GeoJSON().readFeature(geometry);
      rf.setStyle(this.routeStyle);

      return rf;
    },

    /**
     * Adds a route to the map.
     */
    addRoute(route) {
      const route_feature = this.createRouteFeature(route.geometry);

      // remove old route layer
      if (!this.route_layer) {
        this.route_layer = new VectorLayer({
          source: new VectorSource(),
        });
      } else {
        this.map.removeLayer(this.route_layer);
      }

      route_feature.set('route', route);

      this.route_layer.getSource().addFeature(route_feature);

      this.map.addLayer(this.route_layer);
    },

    /**
     * Draws all routes between all cities.
     */
    drawRoutes(routes) {
      // remove old route layer
      if (this.route_layer) {
        this.map.removeLayer(this.route_layer);
      }

      this.route_layer = new VectorLayer({
        source: new VectorSource(),
      });

      for (const route of routes) {
        this.addRoute(route);
      }

      return routes;
    },
  },
});
