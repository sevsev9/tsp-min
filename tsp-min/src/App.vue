<template>
  <div class="main-container">
    <map-component class="map"></map-component>
    <div class="location_selector">
      <!-- 
        This section contains a menu to select the target cities that are to be included in the tsp problem calculation.
      
        - Every city, once selected, is represented by a red dot on the map.
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
    <div class="toolbar"></div>
  </div>
</template>

<script>
import MapComponent from './components/map.component.vue';
import { useMapStore } from "./store";
import { ref } from "vue";
import { Vector as SourceVector } from "ol/source";
import { Vector as LayerVector } from "ol/layer";
import { Style, Circle, Fill } from "ol/style";
import { Point } from "ol/geom";
import Feature from 'ol/Feature';

export default {
  components: { MapComponent },
  name: 'App',
  data() {
    const store = useMapStore();
    const selected_model = ref([]);
    const city_options = ref(...store.city_options);

    return {
      store,
      selected_model,
      city_options,
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
    updateCities(event) {
      this.store.map.removeLayer(this.store.point_layer);

      const point_layer = new LayerVector({
        target: "point_layer",
        source: new SourceVector(),
        style: new Style({
          image: new Circle({
            radius: 5,
            fill: new Fill({
              color: "red"
            })
          })
        })
      });

      for (let i = 0; i < event.length; i++) {
        const point = new Point([event[i].value.lng, event[i].value.lat]);
        const feature = new Feature(point);
        point_layer.getSource().addFeature(feature);
      }

      this.store.point_layer = point_layer;

      this.store.map.addLayer(this.store.point_layer);

      this.adjust_map_zoom();

      console.log('update', event);
    },
    adjust_map_zoom() {
      this.store.map.getView().fit(this.store.point_layer.getSource().getExtent(), {
        size: this.store.map.getSize(),
        maxZoom: 16
      });
    }
  },
  async mounted() {
    await this.store.fetchCities(this.$q.notify);
    this.city_options = [...this.store.city_options];
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
}
</style>