import { LitElement, PropertyValueMap, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Api } from "../api.js";
import { BaseElement, renderError } from "../app.js";
import { i18n } from "../utils/i18n.js";
import { router } from "../utils/routing.js";
import { pageContainerStyle, pageContentStyle } from "../utils/styles.js";

@customElement("main-page")
export class MainPage extends BaseElement {
    render() {
        return html`<div class="${pageContainerStyle}">
            <div class="${pageContentStyle} gap-4 p-4 min-h-[100vh]">
                <h1 class="mt-4">The Hobbyist</h1>
                <div>
                    Eine Chrome Extension, die vor Berufsbezeichnungen <span class="text-xs italic">(und manchmal unpassenden Phrasen)</span> in
                    Headlines auf <a href="https://derstandard.at">DerStandard.at</a> das Wort "Hobby-" anfügt.
                </div>
                <video src="hobby.mp4" controls></video>
                <div>Aus <a href="https://twitter.com/badlogicgames/status/1763193831627919551">Gründen</a></div>
                <div class="flex flex-col gap-4">
                    <img src="hobby-5.png" />
                    <img src="hobby-6.png" />
                </div>
                <h2>Installation</h2>
                <ul>
                    <li>1. Google Chrome installieren</li>
                    <li>2. <a href="extension.zip">extension.zip</a> herunterladen und entpacken</li>
                    <li>
                        3. In Google Chrome <a href="chrome://extensions"><code>chrome://extensions</code></a> aufmachen (manuell in die Adressleiste
                        eingeben)
                    </li>
                    <li>4. Oben rechts "Developer mode" aktivieren</li>
                    <li>5. <code>Load unpacked</code> klicken und den entpackten <code>extensions</code> Ordner angeben</li>
                    <li>
                        6. <a href="https://derstandard.at">https://derstandard.at</a> ansurfen, "derStandard.at hobbifizieren" klicken und genießen
                    </li>
                </ul>

                <span class="text-xs text-center italic mt-auto"
                    >Mit Tixo und Spucke gebaut von <a href="https://mariozechner.at">Mario Zechner</a></span
                >
                <span class="text-xs text-center italic -mt-2"
                    >Diese Seite respektiert deine Privatsphäre und sammelt keine Daten, verwendet keine Cookies, und tut auch sonst nix böses</span
                >
                <a href="https://github.com/badlogic/the-hobbyist" class="text-xs text-center italic -mt-2"
                    >Source Code</span
                >
            </div>
        </div>`;
    }
}
