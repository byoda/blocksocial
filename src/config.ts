import App from "./config.svelte";
import "./tailwind.css";
import { mount } from "svelte";

const app = mount(App, {
        target: document.body,
        //    props: {},
    });

/** @type {import('./$types').Actions} */
interface EventDetail {
    action: string;
}

interface Event {
    detail: EventDetail;
}

export default app;
