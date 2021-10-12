/**
 * Formats a given value to increase readability.
 * @param value The time in seconds.
 * @returns String A better readable time.
 */
function formatTime(value) {
    if (value > 86399) {
        let d = ~~(value / (3600*24));
        let h = ~~(value % (3600*24) / 3600);
        let m = ~~(value % 3600 / 60);
        let s = ~~(value % 60);

        let dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
        let hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
        let mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
        let sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
        return dDisplay + hDisplay + mDisplay + sDisplay;
    }
    return new Date(value * 1000).toISOString().substr(11, 8);
}

/**
 * Formats a millisecond value into a custom MM:SS.ms format.
 * @param value A millisecond value.
 * @return String A formatted string.
 */
function formatMs(value) {
    return new Date(value).toISOString().substr(14, 9);
}

/**
 * Formats a given value to increase readability.
 * @param value A number of kilometers
 * @returns String A kilometer value fixed to 2 decimal points with unit display.
 */
function formatKilometers(value) {
    return `${ value.toFixed(2) } km`
}

/**
 * Formats a given value to increase readability.
 * @param value A number of meters.
 * @returns String A kilometer value fixed to 2 decimals.
 */
function formatMeters(value) {
    return formatKilometers((value / 1000));
}