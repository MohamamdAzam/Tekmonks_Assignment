const http = require("http");
const https = require("https");
const PORT = process.env.PORT || 5000;

function getTimeStories(url, resolve, reject) {
    https.get(url, (res) => {

        if (res.statusCode === 301 || res.statusCode === 302) {
            return getTimeStories(res.headers.location, resolve, reject);
        }

        let data_res = [];

        res.on("data", (chunk) => {
            data_res.push(chunk);
        });

        res.on("end", () => {
            try {
                resolve(data_res.toString());
            } catch (err) {
                reject(err);
            }
        });
    });
}

function extractStories(data_res) {
    const stories = data_res.match(
        /<a href="\/.*\/">\s*<h3 class="latest-stories__item-headline">.*<\/h3>/g
    );

    let links = [];
    stories.map((story) => {
        links.push(story.match(/\/\d+\/.+\//g));
    });

    let titles = [];
    stories.map((story) => {
        let match = story.match(/>.+<\/h3>/g)[0];
        titles.push(
            match.slice(1, match.length - 5)
        );
    });

    let data = [];
    for (let i = 0; i < 6; ++i) {
        data.push({
            title: titles[i],
            link: "https://time.com" + links[i][0],
        });
    }

    return data;
}

const server = http.createServer(async (req, res) => {
    if (req.url === "/getTimeStories" && req.method === "GET") {
        new Promise((resolve, reject) =>
            getTimeStories("https://www.time.com", resolve, reject)
        ).then((response) => {
            const data = extractStories(response);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(JSON.stringify(data));
            res.end();
        });
    } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Route not found" }));
    }
});

server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});