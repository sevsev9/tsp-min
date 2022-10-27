<template>
    <div ref="map-root" style="width: 100%; height: 100%;">
        <!-- OpenLayers Map Container -->
    </div>
</template>

<script>
import { ref } from 'vue'
import View from 'ol/View'
import Map from 'ol/Map'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'

// importing the OpenLayers stylesheet is required for having
// good looking buttons!
import 'ol/ol.css'
import { useGeographic } from 'ol/proj'
import { useMapStore } from '@/store'
import { ATTRIBUTION } from 'ol/source/OSM';

useGeographic();

export default {
    name: 'MapComponent',
    setup: () => {
        const store = useMapStore();

        return {
            store,
            selected_city: ref(store.selected_city),
        }
    },
    async mounted() {
        await this.store.fetchCities(this.$q.notify);

        // this is where we create the OpenLayers map
        this.store.map = new Map({
            // the map will be created using the 'map-root' ref
            target: this.$refs['map-root'],
            layers: [
                // adding a background tiled layer
                new TileLayer({
                    // source: new OSM() // tiles are served by OpenStreetMap
                    source: new OSM({
                        attributions: [
                            ATTRIBUTION,
                        ],
                        url: "http://localhost:5001/tile/{z}/{x}/{y}.png",
                    })
                }),
            ],

            // the map view will initially show the whole world
            view: new View({
                zoom: 17,
                center: [this.selected_city.lng, this.selected_city.lat],
                constrainResolution: true
            }),
        });
    },
    methods: {

    }
}
</script>

<style scoped>

</style>