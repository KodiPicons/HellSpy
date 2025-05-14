const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
const cheerio = require("cheerio");

const manifest = {
    id: "org.hellspy.addon",
    version: "1.0.0",
    name: "Hellspy Addon",
    description: "Prehľadáva videá z hellspy.to",
    resources: ["catalog", "stream"],
    types: ["movie", "series"],
    catalogs: [
        {
            type: "movie",
            id: "hellspy_search",
            name: "Hellspy Search",
            extra: [{ name: "search" }]
        }
    ],
    idPrefixes: ["tt"]
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async ({ type, id }) => {
    const imdbId = id.replace("tt", "");
    const url = `https://www.hellspy.to/search?query=${imdbId}`;

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const files = [];

        $(".data_list_item").each((i, el) => {
            const title = $(el).find(".data_list_item_name").text().trim();
            const link = $(el).find("a").attr("href");
            const size = $(el).find(".filesize").text().trim();

            files.push({
                title,
                url: `https://www.hellspy.to${link}`,
                name: `${title} (${size})`,
                behaviorHints: {
                    notWebReady: true
                }
            });
        });

        return {
            streams: files.map(file => ({
                name: file.name,
                title: file.title,
                url: file.url
            }))
        };
    } catch (e) {
        console.error("Stream error:", e.message);
        return { streams: [] };
    }
});

builder.defineCatalogHandler(async ({ type, id, extra }) => {
    const searchQuery = extra.search;
    const url = `https://www.hellspy.to/search?query=${encodeURIComponent(searchQuery)}`;

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const metas = [];

        $(".data_list_item").each((i, el) => {
            const title = $(el).find(".data_list_item_name").text().trim();
            const link = $(el).find("a").attr("href");

            metas.push({
                id: `hellspy-${Buffer.from(title).toString('base64')}`,
                name: title,
                type: "movie",
                poster: "https://www.hellspy.to/images/logo.png",
                description: `Nájdené na Hellspy: ${title}`,
            });
        });

        return { metas };
    } catch (e) {
        console.error("Catalog error:", e.message);
        return { metas: [] };
    }
});

    
const interface = builder.getInterface();

module.exports = interface;

};
