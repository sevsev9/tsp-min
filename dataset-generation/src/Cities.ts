import {IRoute, Route} from "./Routes";

export interface ICity {
    name: string,
    lat: number,
    long: number
}

export const cities: Array<ICity> = [
    {name: "Wien", lat: 48.2083, long: 16.3731},
    {name: "Graz", lat: 47.0749, long: 15.4409},
    {name: "Linz", lat: 48.3000, long: 14.2833},
    {name: "Salzburg", lat: 47.7972, long: 13.0477},
    {name: "Innsbruck", lat: 47.2683, long: 11.3933},
    {name: "Klagenfurt", lat: 46.6167, long: 14.3000},
    {name: "Bregenz", lat: 47.5050, long: 9.7492},
    {name: "Eisenstadt", lat: 47.8456, long: 16.5189},
    {name: "St. Pölten", lat: 48.1982, long: 15.6431}
]

export function findCity(name: string) {
    return cities.find(o => name.includes(o.name));
}

function buildString(e: ICity) {
    return `${e.lat}%2C${e.long}%7C`;
}

function compileDestinations(arr: Array<ICity>) {
    let str = "";
    arr.forEach(e => str+=buildString(e));
    return str.substr(0, str.length-3);
}

export function formRequest(origin: ICity, destinations: Array<ICity>) {
    let arr = destinations;
    let rq: string = "";
    rq+=process.env.API_BASE_URL;
    rq+="?destinations=";
    if (destinations.includes(origin)) {
        arr = destinations.slice()
        arr.splice(arr.indexOf(origin), 1);
    }
    rq+=compileDestinations(arr);
    rq+="&origins="+buildString(origin);
    rq+="&key="+process.env.GOOGLE_API_KEY;
    return rq;
}

export function getAllRequests() {
    let requests: Array<string> = []

    cities.forEach( city => {
        requests.push(formRequest(city, cities))
    });

    return requests;
}

export function createRoutesFromJson(json: Object) {
    const obj = JSON.parse(JSON.stringify(json));
    const rows = obj.rows[0].elements;
    const dest = obj.destination_addresses;
    const origin_city = findCity(obj.origin_addresses[0]);

    const routes: Array<IRoute> = []

    if (origin_city) {
        dest.forEach((addr: string, idx: number) => {
            const dest_city = findCity(addr);

            if (origin_city && dest_city) {
                routes.push(new Route(
                    rows[idx].duration.value,
                    rows[idx].distance.value,
                    origin_city,
                    dest_city,
                    obj.origin_addresses[0],    // Optionally adding the exact origin address to the dataset.
                    addr                        // Optionally adding the exact destination address to the dataset.
                ));
            } else {
                if (!origin_city) {
                    console.log("Couldn't find corresponding city to provided origin address: " + obj.origin_addresses[0]);
                }

                if (!dest_city) {
                    console.log("Couldn't find corresponding city to provided destination address: " + addr);
                }
            }
        });
        return routes;
    } else throw new Error("Couldn't find corresponding city to provided origin address: " + obj.origin_addresses[0])
}