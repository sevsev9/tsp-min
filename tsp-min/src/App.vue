<template>
  <div class="main-container">
    <map-component class="map"></map-component>
    <div class="location_selector">
      <!-- 
        This section contains a menu to select the target cities that are to be included in the tsp problem calculation.
      
        - Every city, once selected, is represented by a red dot on the map.

        - On rendered route selection:
          -> Highlight the route on OSM
          -> Show route details under the select
          -> Show a list of available cities from this route
      -->

      <q-select :options="city_options" multiple use-chips filled placeholder="Select cities"
        @update:model-value="updateCities" @filter="filterFn" v-model="selected_model" use-input>
        <template v-slot:option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section avatar>
              <q-avatar>
                <q-icon name="place" />
                <q-item-label caption>{{ scope.opt.value.iso2 }}</q-item-label>
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ scope.opt.label + ` (${scope.opt.value.admin_name})` }}</q-item-label>
              <q-item-label caption>{{ scope.opt.value.lat + " | " + scope.opt.value.lng }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>

      <q-card v-if="selected_city">

        <q-card-section>
          <q-item-label>{{ selected_city.name }}</q-item-label>
          <q-item-label caption>{{ selected_city.admin_name }}</q-item-label>
          <q-item-label caption>{{ selected_city.lat + " | " + selected_city.lng }}</q-item-label>
        </q-card-section>
        <!-- This table displays all outgoing routes -->

        <q-card-section>
          <q-table dense virtual-scroll :rows-per-page-options="[0]" :rows="highlighted_routes" :columns="cols"
            row-key="from">
            <template v-slot:body-cell-distance="props">
              <q-td :props="props">
                <q-item>
                  <q-item-label>{{ (props.row.data.distance / 1000).toFixed(2) + " km" }}</q-item-label>
                </q-item>
              </q-td>
            </template>
            <template v-slot:body-cell-to="props">
              <q-td :props="props">
                <q-item>
                  <q-item-label>{{ props.row.to }}</q-item-label>
                </q-item>
              </q-td>
            </template>
            <template v-slot:body-cell-from="props">
              <q-td :props="props">
                <q-item>
                  <q-item-label>{{ props.row.from }}</q-item-label>
                </q-item>
              </q-td>
            </template>
            <template v-slot:body-cell-duration="props">
              <q-td :props="props">
                <q-item>
                  <q-item-label>{{ new Date(props.row.data.duration * 1000).toISOString().substring(11, 19) }}
                  </q-item-label>
                </q-item>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>

      <q-card v-else>
        <q-item>
          <q-item-section>
            <q-item-label>
              <q-icon name="info" />
              Select a city to see its details
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-card>

    </div>
    <div class="toolbar">
      <!-- This section contains all the functionality for route calculation.
        This includes:
          - Search Algorithm Selection
          - Route Calculation and length display
          - Calculation State Display if the calculation is still running
          - Reset Button
          - Fastest Route Display
          - Live Calculation Display
      -->

      <div>
        <!-- This button calculates all routes between each city in the model list. -->
        <q-btn
          :label="`Calculate ${current_routes.length > 0 ? current_routes.length : ''} Route${(current_routes.length === 1) ? '' : 's'}`"
          icon="route" color="primary" @click="calculateRoutes" style="margin: auto" />
      </div>

      <div>
        <!-- This select handles the algorithm selection and solution calculation -->
        <q-select filled bottom-slots v-model="selected_algorithm" label="Algorithm" dense options-dense
          :options="algorithm_options">
          <template v-slot:before>
            <q-avatar>
              <q-icon name="query_stats" />
            </q-avatar>
          </template>

          <template v-slot:hint>
            Select the algorithm to calculate the solution with.
          </template>

          <template v-slot:after>
            <q-btn round dense flat @click="start_calculation" icon="not_started" />
          </template>
        </q-select>
      </div>


    </div>

    <!-- Loading Dialog for route fetching from server -->
    <q-dialog v-model="loading.show" persistent style="width: 50vh; margin: auto; height: 20vh">
      <q-card>
        <q-bar>
          <!-- 
              Show elapsed time, and total processed, time estimaed and total to process.
              
              <q-icon name="network_wifi" />
              <q-icon name="network_cell" />
              <q-icon name="battery_full" />
              <div>9:34</div>

             -->

          <q-space />

          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section>
          <q-linear-progress size="50px" :value="loading.progress" color="accent" animation-speed="100">
            <div class="absolute-full flex flex-center">
              <q-badge color="white" text-color="accent" :label="loading.progress_label" />
            </div>
          </q-linear-progress>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <!-- display total progress and time estimation here -->
          <div class="text-h6">Fetching Routes</div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import MapComponent from './components/map.component.vue';
import { useMapStore } from "./store";
import { computed, ref } from "vue";
import { useRouteStore } from "./store/route.store";

export default {
  components: { MapComponent },
  name: 'App',
  data() {
    const store = useMapStore();
    const routeStore = useRouteStore();
    const selected_model = ref([]);
    const city_options = ref([...store.city_options]);

    return {
      store,
      routeStore,
      selected_model,
      city_options,
      loading: {
        progress: ref(0),
        show: ref(false),
        progress_label: computed(() => `${(this.loading.progress * 100).toFixed(2)}%`),
      },
      current_routes: [],
      filterFn(val, update) {
        if (val === '') {
          update(() => {
            city_options.value = [...store.city_options];
          });

          return;
        }

        update(() => {
          const needle = val.toLowerCase()
          city_options.value = [...store.city_options].filter(v => {
            return v.label.toLowerCase().indexOf(needle) > -1 || v.value.admin_name.toLowerCase().indexOf(needle) > -1
          })
        })
      },

      // @TODO: Left off here, finish table cols
      cols: [

        {
          name: 'from',
          label: 'Origin City',
          align: 'left',
          field: 'from',
          sortable: true
        },
        {
          name: 'to',
          label: 'Destination City',
          align: 'left',
          field: 'to',
          sortable: true
        },
        { name: 'distance', label: 'Distance', align: 'right', field: 'data.distance', sortable: true },
        { name: 'duration', label: 'Duration', align: 'right', field: 'data.duration', sortable: true }
      ],

      // the current selected city
      selected_city: ref(null),

      // all the routes that are currently highlited (will be used in combination with the selected_city)
      highlighted_routes: ref([]),

      algorithm_options: [
        'Brute Force', 'Dijkstra', 'A*', 'BFS', 'DFS'
      ],
      selected_algorithm: ref('Brute Force'),
    }
  },
  methods: {
    updateCities(cities) {
      // send update with the cities to the store

      this.store.drawPoints(cities);
    },
    async calculateRoutes() {
      try {
        const routes = await this.routeStore.calculateRoutes(
          this.selected_model.map(e => e.value),
          this.$q,
          (progress) => {
            if (!this.loading.show)
              this.loading.show = true;

            // why tf does this work and not the other way around?
            this.loading.progress = progress;
          }
        );

        // show the loading dialog
        this.loading.show = false;

        // set current routes
        this.current_routes = routes;

        // render the calculated routes
        this.store.drawRoutes(routes);
      } catch (e) {
        this.loading.show = false;
        this.$q.notify({
          title: 'Error',
          message: (e.message && e.message.length > 0) ? e.message : 'An error occured while calculating the routes.',
          icon: "error",
          position: "top"
        });
      }
    },
    hideLoadingDialog() {
      this.loading.show = false;
      this.loading.progress = 0;
    },
    start_calculation() {
      // check if the selected algorithm is valid
      if (this.algorithm_options.indexOf(this.selected_algorithm) === -1) {
        this.$q.notify({
          title: 'Error',
          message: 'Please select a valid algorithm.',
          icon: "error",
          position: "top"
        });

        return;
      }

      const algo = this.selected_algorithm.toLowerCase();

      if (algo === 'brute force') {
        console.log('brute forcing solution')

      } else {
        this.$q.notify({
          title: 'Error',
          message: 'The selected algorithm is not yet implemented.',
          icon: "error",
          position: "top"
        });
      }

    }
  },
  async mounted() {
    await this.store.fetchCities(this.$q.notify);
    this.city_options = [...this.store.city_options];

    if (!this.store.onClickHandler) {
      this.store.onClickHandler = (e) => {

        // get an array of features that are at the clicked pixel.
        const feature = this.store.map.getFeaturesAtPixel(e.pixel);

        /*
         * @TODO solve multiple problems here:
         *  - What to do when to click multiple routes?
         *  - Iterate through routes on multiple click? Show menu? ...
         *  - For now: always use the first element in the array...
         *  - If city is clicked, highlight all routes connected to this city?
         */
        if (feature.length > 0) {
          const f = feature[0];

          // check if the feature is a route
          if (f.get('route')) {
            if (!f.get("selected")) {
              f.set("selected", true);
              f.setStyle(this.store.selectedStyle);
            } else {
              f.setStyle(this.store.routeStyle);
              f.set("selected", false);
            }
          } else {
            if (!f.get("selected")) {
              f.set("selected", true);

              this.selected_city = f.get('city');

              // highlight all routes that are connected to this city
              this.highlighted_routes = this.current_routes.filter(e => e.from === this.selected_city.city || e.to === this.selected_city.city);

              // set all routes to selected
              this.store.map.getLayers().forEach(layer => {
                if (layer.get('name') === 'route_layer') {
                  layer.getSource().forEachFeature(f => {
                    if (f.get('route') && (f.get('route').from === this.selected_city.city || f.get('route').to === this.selected_city.city)) {
                      f.setStyle(this.store.selectedStyle);
                    }
                  });
                }
              });


            } else {

              // set all routes to unselected
              this.store.map.getLayers().forEach(layer => {
                if (layer.get('name') === 'route_layer') {
                  layer.getSource().forEachFeature(f => {
                    if (f.get('route') && (f.get('route').from === this.selected_city.city || f.get('route').to === this.selected_city.city)) {
                      f.setStyle(this.store.routeStyle);
                    }
                  });
                }
              });

              // clear highlited routes
              this.highlighted_routes = [];

              f.set("selected", false);
            }
          }
        }
      }
    } else {
      this.store.map.un("click", this.store.onClickHandler);
    }

    this.store.map.on("click", this.store.onClickHandler);
  }
}
</script>

<style lang="scss" scoped>
.main-container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-rows: 1fr 1fr;
  grid-template-columns: 8fr 2fr;
  grid-template-areas:
    "map location_selector"
    "map toolbar";
}

.map {
  grid-area: map;
}

.location_selector {
  grid-area: location_selector;
  padding: 1em;
  border-bottom: 2px solid grey;
  display: grid;
  grid-template-rows: 1fr 9fr;
  gap: 1em;
}

.toolbar {
  grid-area: toolbar;
  padding: 1em;
  display: grid;
  grid-template-rows: repeat(3, 1fr);
}
</style>