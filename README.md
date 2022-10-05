# Simplistic TSP implementation
A simplistic Travelling Sales Person implementation based on a custom-made Dataset.  
 - made by: [sevsev9](https://www.github.com/sevsev9)

Side Note: This project was written in another private repository of mine. Should you, for any reason, want the commit history please ask me.

## Technologies Used
### NodeJS
Used to interface with the Google Maps API to acquire the following information:
 - Driving distance between cities in meters.
 - Guessed driving duration in seconds.
 - Exact addresses of reference places.

### HTML, CSS, JS
Used to create a view on the data and used for the calculation implementation.

## Dataset

The dataset was compiled by myself for this exercise from the following sources:
- [Google Maps Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix/overview#maps_http_distancematrix_latlng-txt)
- [Austrian Cities Database](https://simplemaps.com/data/at-cities)

## Important notes for future use of this project
### Google API Documentation and rate/usage limits:
- [Distance Matrix API Documentation](https://developers.google.com/maps/documentation/distance-matrix/usage-and-billing#:~:text=While%20you%20are%20no%20longer,elements%20per%20client%2Dside%20request.)

#### Google Distance Matrix API Usage Limits
While you are no longer limited to a maximum number of elements per day (EPD), the following usage limits are still in place for the Distance Matrix API:

- Maximum of 25 origins or 25 destinations per request.
- Maximum 100 elements per server-side request.
- Maximum 100 elements per client-side request.
- 1000 elements per second (EPS), calculated as the sum of client-side and server-side queries.

#### Google Distance Matrix API Costs

- 0–100,000 -> 0.005 USD per each (5.00 USD per 1000)
- 100,001–500,000 -> 0.004 USD per each (4.00 USD per 1000)
- 500,000+ -> Contact Sales for volume pricing


## Running the Frontend
 - Make docker scripts executable: `cd ./simplistic-tsp-implementation && sudo chmod +x ./docker_*`
 - Build docker image: `./docker_build.sh`
 - Run the docker container: `./docker_start_container.sh`

