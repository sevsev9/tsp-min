import {ICity} from "./Cities";

export interface IRoute {
    /**
     * The origin city.
     */
    from: ICity,
    /**
     * The destination city.
     */
    to: ICity,
    /**
     * Driven kilometer distance between the 2 points.
     */
    driven_distance: number,
    /**
     * Kilometer distance of the 2 points "as the crow flies".
     */
    linear_distance: number,
    /**
     * Average/Guessed drive time as calculated by Google Distance Matrix API.
     */
    avg_drive_time: number,
    /**
     * Optional: The exact address of the point of origin.
     */
    src_address_line?:string,
    /**
     * Optional: The exact address from the destination.
     */
    dest_address_line?:string
}

export class Route implements IRoute{
    avg_drive_time: number;
    driven_distance: number;
    linear_distance: number;
    from: ICity;
    to: ICity;
    src_address_line?:string;
    dest_address_line?:string;

    constructor(avg_drive_time: number, driven_distance: number,  from: ICity, to: ICity, src_address_line?:string, dest_address_line?:string) {
        this.avg_drive_time = avg_drive_time;
        this.driven_distance = driven_distance;
        this.linear_distance = calculateLinearDistance(from.lat, from.long, to.lat, to.long);
        this.from = from;
        this.to = to;
        this.src_address_line = src_address_line;
        this.dest_address_line = dest_address_line;
    }
}

/**
 * Calculates the distance of 2 places in km if provided with lat and long of each place respectively.
 * @param lat1 Latitude from the first place.
 * @param lon1 Longitude from the first place.
 * @param lat2 Latitude from the second place.
 * @param lon2 Longitude from the second place.
 *
 * Source: https://stackoverflow.com/a/18883819
 */
export function calculateLinearDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    let R = 6371; // km
    let dLat = toRad(lat2 - lat1);
    let dLon = toRad(lon2 - lon1);
    lat1 = toRad(lat1);
    lat2 = toRad(lat2);

    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Converts numeric degrees to radians.
 * @param value A number of degrees to be converted to radians.
 */
function toRad(value: number) {
    return value * Math.PI / 180;
}

/**
 * Checks if a route or a permutation of a route already exists in the array and inserts if not.
 * @param routes The routes array to be checked against.
 * @param route The route to be checked.
 * @returns boolean true if the Route was inserted into the array.
 */
export function routeInsertWithCheck(routes: Array<IRoute>, route: IRoute) {
    if (
        !routes.find(o => (o.from.name === route.from.name && o.to.name === route.to.name)) &&
        !routes.find(o => (o.from.name === route.to.name && o.to.name === route.from.name))
    ) {
        routes.push(route);
        return true;
    }
    return false;
}

export function calculateRouteAmount(n: number) {
    const num = n-1;
    return (num*(num+1))/2;
}