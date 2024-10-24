import App from "./popup.svelte";
import "./tailwind.css";

const app = new App(
    {
        target: document.body,
        //    props: {},
    }
);

/** @type {import('./$types').Actions} */
interface EventDetail {
    action: string;
}

interface Event {
    detail: EventDetail;
}

export default app;