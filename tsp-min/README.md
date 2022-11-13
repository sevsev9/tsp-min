# tsp-min

## Project setup
This project heavily relies on OpenStreetMaps, OpenLayers and for routing and length calculation OSRM.

To run this app, please configure a correct OSRM server for the frontend to interface with.

Or if you run this locally you can run a local instance of it as seen [here](https://hub.docker.com/r/osrm/osrm-backend/).

```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### Roadmap
 - [ ] Implement custom backend that caches routes and acts on top of the OSRM server.
 - [ ] Implement other Algorithms than simple brute-force (A*, DFS, BFS, ...)
 - [ ] Add support for custom points on map click. (Add new point/address to list but don't save it?)
 - [ ] Implement route selection information display and color change
