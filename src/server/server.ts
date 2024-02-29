import bodyParser from "body-parser";
import * as chokidar from "chokidar";
import compression from "compression";
import cors from "cors";
import express from "express";
import * as http from "http";
import multer from "multer";
import OpenAI from "openai";
import WebSocket, { WebSocketServer } from "ws";
import * as fs from "fs";

const port = process.env.PORT ?? 3333;
const openaiKey = process.env.OPENAI_KEY;

if (!openaiKey) {
    console.error("No OPENAI_KEY given in env");
    process.exit(-1);
}

const client = new OpenAI({ apiKey: openaiKey });

const complete = async (prompt: string) => {
    const response = await client.chat.completions.create({
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
        model: "gpt-3.5-turbo",
        max_tokens: 2000,
        temperature: 0.2,
    });
    return response.choices[0].message.content;
};

let cache: Record<string, string> = {};
if (fs.existsSync("/data/cache.json")) {
    try {
        cache = JSON.parse(fs.readFileSync("/data/cache.json", "utf-8"));
    } catch (e) {
        console.error("Couldn't read cache file", e);
    }
}

const replace = async (titles: string[]) => {
    const toProcess = titles.filter((title) => !cache[title]);
    const total = toProcess.length;
    while (toProcess.length > 0) {
        const batch = toProcess.splice(0, 25);
        const prompt = `
        Given a string, you prefix all job titles or descriptions of the activity a person does, like

        "Polizist", "Kurz-Richter", "Journalist", "Tierschützer", or "Programmierer"

        with "Hobby-", e.g.

        "Hobby-Polizist", "Hobby-Kurz-Richter", "Hobby-Journalist", "Hobby-Tierschützer", "Hobby-Programmierer"

        Note how job titles can occur anywhere in the string. A job title may also have a prefix in the original string, e.g. "Ex-Polizist" or "Kurz-Richter". Insert the "Hobby-" prefix where appropriate in this case.

        Your input is a list of strings in JSON format. Example input:

        >>>
        [
        "Programmierer überholen Regierung mit Lebensmittel-Vergleichsportalen",
        "Personalexpertin: \"Wo es kein Homeoffice gibt, wollen die Leute nicht hin\"",
        "Zwischen Mötz, Diandl und Mädl: Alltagssprache im Land Salzburg",
        "\"FAZ\"-Herausgeber: \"Wir sollten uns nicht eine gespaltene Gesellschaft einreden lassen\",
        "EU-Kommission genehmigt Freigabe von Milliardengeldern für Polen",
        "Bislang unbekannte Disziplinarstrafe gegen Kurz-Richter sorgt für Rumoren",
        "Amtsmissbrauchsprozess gegen wettaffinen Ex-Polizisten mit mildem Urteil",
        "\"Völlig inakzeptabel\": Google-CEO spricht klare Worte zu Problemen mit Gemini-KI",
        "Nehammer, der Staatsmann, in der \"ZiB 2\": Die ÖVP spielt \"Good Cop, Bad Cop\"",
        "EU-Parlament will Amazon-Lobbyisten vor die Tür setzen",
        "Österreichs Schweine im Fadenkreuz von Politik und Hobby-Tierschützern",
        ]
        >>>

        Your output is a list of strings in JSON format, with one string per input string, where you have prefixed job titles and activity descriptions as per the rules above. Example output:

        >>>
        [
        "Hobby-Programmierer überholen Regierung mit Lebensmittel-Vergleichsportalen",
        "Hobby-Personalexpertin: \"Wo es kein Homeoffice gibt, wollen die Leute nicht hin\"",
        "Zwischen Mötz, Diandl und Mädl: Alltagssprache im Land Salzburg",
        "Hobby-Herausgeber: \"Wir sollten uns nicht eine gespaltene Gesellschaft einreden lassen\",
        "Hobby-Kommission genehmigt Freigabe von Milliardengeldern für Polen",
        "Bislang unbekannte Disziplinarstrafe gegen Hobby-Kurz-Richter sorgt für Rumoren"
        "Amtsmissbrauchsprozess gegen wettaffinen Ex-Hobby-Polizisten mit mildem Urteil",
        "\"Völlig inakzeptabel\": Hobby-CEO spricht klare Worte zu Problemen mit Gemini-KI",
        "Nehammer, der Hobby-Staatsmann, in der \"ZiB 2\": Die ÖVP spielt \"Good Cop, Bad Cop\""
        "Hobby-Parlament will Hobby-Lobbyisten vor die Tür setzen",
        "Österreichs Schweine im Fadenkreuz von Politik und Hobby-Tierschützern",
        ]
        >>>

        Input:
        >>>
    ${JSON.stringify(batch, null, 2)}
        >>>

        Output:
    `;
        console.log("Hobbifying " + batch.length + ", left: " + toProcess.length + ", total: " + total);
        const response = await complete(prompt);
        if (!response) throw new Error("Got no completion");
        try {
            const results = JSON.parse(response.replaceAll(">>>", "")) as string[];
            if (results.length != batch.length) {
                console.error("Results length != batch length");
            } else {
                for (let i = 0; i < results.length; i++) {
                    cache[batch[i]] = results[i];
                }
            }
        } catch (e) {
            console.log("Invalid json response: \n", e);
        }
    }
    fs.writeFileSync("/data/cache.json", JSON.stringify(cache, null, 2), "utf-8");
    return titles.map((title) => {
        if (title.toLowerCase().includes("vergewalt")) return title;
        return cache[title] ?? title;
    });
};

(async () => {
    const app = express();
    app.set("json spaces", 2);
    app.use(cors());
    app.use(express.json());
    app.use(compression());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.post("/api/replace", async (req, res) => {
        let title = req.body as any;
        if (!Array.isArray(title) && title) {
            title = [title];
        }
        if (!title) {
            res.status(400).json({ error: "No titles given" });
            return;
        }
        try {
            res.json(await replace(title));
        } catch (e) {
            res.status(400).json({ error: "Could not replace titles" });
        }
    });

    const server = http.createServer(app);
    server.listen(port, async () => {
        console.log(`App listening on port ${port}`);
    });

    setupLiveReload(server);
})();

function setupLiveReload(server: http.Server) {
    const wss = new WebSocketServer({ server });
    const clients: Set<WebSocket> = new Set();
    wss.on("connection", (ws: WebSocket) => {
        clients.add(ws);
        ws.on("close", () => {
            clients.delete(ws);
        });
    });

    chokidar.watch("html/", { ignored: /(^|[\/\\])\../, ignoreInitial: true }).on("all", (event, path) => {
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(`File changed: ${path}`);
            }
        });
    });
    console.log("Initialized live-reload");
}
