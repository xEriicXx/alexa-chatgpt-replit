const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");

const app = express();
app.use(bodyParser.json());

const OPENAI_API_KEY = "SUA_CHAVE_DA_OPENAI_AQUI";

app.post("/alexa", async (req, res) => {
    try {
        const alexaRequest = req.body;
        let userMessage = "Olá";

        if (alexaRequest.request.type === "IntentRequest") {
            userMessage = alexaRequest.request.intent.slots.query.value;
        }

        const reply = await askChatGPT(userMessage);
        res.json(buildAlexaResponse(reply));
    } catch (err) {
        console.error(err);
        res.json(buildAlexaResponse("Desculpe, ocorreu um erro ao tentar responder."));
    }
});

function askChatGPT(message) {
    const data = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
    });

    const options = {
        hostname: "api.openai.com",
        path: "/v1/chat/completions",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = "";
            res.on("data", (chunk) => { body += chunk; });
            res.on("end", () => {
                try {
                    const json = JSON.parse(body);
                    const reply = json.choices[0].message.content;
                    resolve(reply);
                } catch (e) {
                    resolve("Não consegui entender a resposta do ChatGPT.");
                }
            });
        });

        req.on("error", reject);
        req.write(data);
        req.end();
    });
}

function buildAlexaResponse(text) {
    return {
        version: "1.0",
        response: {
            outputSpeech: {
                type: "PlainText",
                text: text,
            },
            shouldEndSession: true,
        }
    };
}

app.get("/", (req, res) => {
    res.send("Servidor Alexa-ChatGPT está rodando!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Servidor rodando na porta", PORT);
});
