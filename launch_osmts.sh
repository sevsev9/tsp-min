# Setup Guide: https://github.com/Overv/openstreetmap-tile-server#setting-up-the-server
docker run \
    -p 5001:80 \
    -e REPLICATION_URL=https://planet.openstreetmap.org/replication/minute/ \
    -e MAX_INTERVAL_SECONDS=60 \
    --name osmts-server \
    -e UPDATES=enabled \
    -v ~/tools/osm/osmts_data:/data/database/ \
    -v ~/tools/osm/osmts_rendered_tiles:/data/tiles/ \
    -d overv/openstreetmap-tile-server \
    run
