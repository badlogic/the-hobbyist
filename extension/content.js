console.log("I'm in.");

if (location.host.includes("derstandard")) {
    const titles = [];
    for (const el of Array.from(document.querySelectorAll(".teaser-title"))) {
        titles.push(el);
    }

    for (const el of Array.from(document.querySelectorAll(".article-title"))) {
        titles.push(el);
    }

    const div = document.createElement("div");
    div.innerHTML = `<div style="cursor: pointer; background: black; padding: 16px; border-radius: 8px; color: white; display: flex; gap: 16px;">
    <img src="https://i.gifer.com/17xo.gif" style="height: 24px; display: none"/>
    <span id="info">derStandard.at hobbifizieren</span>
</div>`;
    div.style.cssText = "position:fixed; top:0; right:0; z-index:1000;";
    document.body.prepend(div);
    const info = div.querySelector("#info");

    let hobbified = false;
    div.addEventListener("click", () => {
        if (hobbified) return;
        hobbified = true;
        div.querySelector("img").style.display = "";
        info.textContent = "derStandard.at wird hobbifiziert, bitte warten";

        setTimeout(
            () =>
                (async () => {
                    const strings = [];
                    for (const title of titles) {
                        strings.push(title.textContent);
                    }

                    // const baseUrl = "http://localhost:3333/api/replace";
                    const baseUrl = "https://hobbyist.marioslab.io/api/replace";
                    const response = await fetch(baseUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(strings),
                    });

                    if (!response.ok) {
                        console.error("Could not get title replacements");
                        console.error(await response.text());
                        info.textContent = "Hobbifizierung fehlgeschlagen :(";
                        return;
                    }
                    const results = await response.json();
                    info.textContent = "Hobbifizierung 100%!";

                    for (let i = 0; i < titles.length; i++) {
                        titles[i].innerHTML = results[i].replace(/(Hobby-[^\s]+)/g, "<span style='color: red'>$1</span>");
                    }
                })(),
            1000
        );
    });
}
