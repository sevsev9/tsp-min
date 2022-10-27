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

      <!-- This button calculates all routes between each city in the model list. -->
      <q-btn :label="`Calculate ${current_routes.length > 0 ? current_routes.length : ''} Route${(current_routes.length === 1) ? '' : 's'}`" icon="route" color="primary" @click="calculateRoutes" style="margin: auto" />

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
  </div>
</template>

<script>
import MapComponent from './components/map.component.vue';
import { useMapStore } from "./store";
import { computed, ref } from "vue";
import { useRouteStore } from "./store/route.store";
import { click } from 'ol/events/condition';
import Select from "ol/interaction/Select";

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
      }
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

        this.loading.show = false;

        // @debug
        console.log(routes);

        // set current routes
        this.current_routes = routes;

        // render the calculated routes
        this.store.drawRoutes(routes.map(e => e.route));
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
    }
  },
  async mounted() {
    await this.store.fetchCities(this.$q.notify);
    this.city_options = [...this.store.city_options];

    if (!this.store.onSelect) {
      this.store.onSelect = new Select({
        condition: click
      });

      this.store.onSelect.on('select', (e) => {
        console.log(e);
      });
    }
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
}

.toolbar {
  grid-area: toolbar;
  padding: 1em;
}
</style>