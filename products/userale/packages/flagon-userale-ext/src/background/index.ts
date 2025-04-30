import * as userale from "flagon-userale";

console.log("Service worker loaded!");

userale.setup();

export function add_log(log) {
    userale.log(log);
}
