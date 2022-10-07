import { Canvas, Image } from "canvas";
import { GitHub, Instagram } from "./Typings";
import axios, { AxiosResponse } from "axios";
import e, { Express } from "express";
import bodyParser from "body-parser";
import fs from "fs";
import { graphql } from "@octokit/graphql";
import http from "http";
import https from "https";

void (async (): Promise<void> => {
    // Create config.
    const jsonImport = (await import("./config.json")).default;
    let config = jsonImport as Readonly<typeof jsonImport> & { update(obj: Partial<typeof config>): void; };
    config.update = (obj: Partial<typeof config>): void => {
        config = Object.assign(config, obj);
        fs.writeFileSync("./config.json", JSON.stringify(config, null, "\t"));
    };

    // Runs every minute to check if any jobs need doing.
    setInterval(async (): Promise<void> => {
        try {
            // Refreshing Instagram access token.
            if (Date.now() > config.instagram.accessTokenRefreshAt) {
                const response: AxiosResponse<Instagram.IAuthResponse> = await axios.get(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${config.instagram.accessToken}`);
                // eslint-disable-next-line @typescript-eslint/naming-convention
                const { access_token, expires_in } = response.data;
                config.update({
                    instagram: {
                        ...config.instagram,
                        accessToken: access_token,
                        accessTokenRefreshAt: Math.floor(Date.now() + 9 * expires_in / 10)
                    }
                });
            }
        } catch (err) {
            console.error(err);
        }
    }, 60_000);

    // Create express app.
    const app: Express = e();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Redirect http to https.
    app.use((req, res, next) => {
        if (req.protocol === "http" && req.get("host") !== "localhost")
            res.redirect(`https://${req.headers.host}${req.url}`);
        else next();
    });

    // Serve static content.
    app.use(e.static(`${__dirname}/client/build`));

    // Handle API calls.
    app.get("/api/github", async (_req, res) => {
        try {
            const graphqlWithAuth = graphql.defaults(config.github);
            const { user: { repositories: { repos } } } = await graphqlWithAuth<{ user: { repositories: { repos: GitHub.IRepo[]; }; }; }>(`{
                user(login: "oathompsonjones") {
                    repositories(first: 100) {
                        repos: nodes {
                            description
                            homepageUrl
                            isFork
                            isPrivate
                            languages(first: 100) {
                                nodes {
                                    name
                                }
                            }
                            name
                            nameWithOwner
                            openGraphImageUrl
                            primaryLanguage {
                                name
                            }
                            url
                        }
                    }
                }
            }`);
            const formattedRepos: GitHub.IRepo[] = [];
            for (const repo of repos.filter((r: GitHub.IRepo) => !r.isFork)) {
                // Create the image.
                const image: Image = new Image();
                image.src = Buffer.from((await axios.get(repo.openGraphImageUrl, { responseType: "arraybuffer" })).data, "binary");
                // Create a canvas in order to resize the image.
                const canvas = new Canvas(1280, 640);
                const context = canvas.getContext("2d");
                // Draw the image with the correct dimensions.
                let [dw, dh, dy] = [image.width, image.height, 0];
                if (image.height >= image.width) {
                    dw = canvas.width;
                    dh = image.height / image.width * canvas.width;
                    dy = (canvas.height - dh) / 2;
                } else if (image.width > image.height) {
                    dw = canvas.width;
                    dh = image.height / image.width * canvas.width;
                }
                context.drawImage(image, 0, dy, dw, dh);
                // Add the image to the repo object.
                formattedRepos.push({ ...repo, image: `data:image/png;base64,${canvas.toBuffer().toString("base64")}` });
            }
            res.send(formattedRepos);
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    });
    app.get("/api/instagram", async (_req, res) => {
        try {
            const response: AxiosResponse<Instagram.IMediaResponse> = await axios.get(`https://graph.instagram.com/me/media?fields=caption,id,media_type,media_url,permalink,thumbnail_url,timestamp,username,children{media_type,media_url}&access_token=${config.instagram.accessToken}`);
            res.send(response.data.data);
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    });
    app.post("/api/contact", async (req, res) => {
        const { content, email, name, subject } = req.body;
        void [content, email, name, subject];
        res.sendStatus(200);
    });

    // Handle redirects.
    app.get("/email", (_req, res) => void res.redirect("mailto:oathompsonjones@gmail.com"));
    app.get("/discord", (_req, res) => void res.redirect("https://discord.com/users/310145094684639235"));
    app.get("/facebook", (_req, res) => void res.redirect("https://facebook.com/oathompsonjones"));
    app.get("/github", (_req, res) => void res.redirect("https://github.com/oathompsonjones"));
    app.get("/instagram", (_req, res) => void res.redirect("https://instagram.com/oathompsonjones"));
    app.get("/linkedin", (_req, res) => void res.redirect("https://linkedin.com/in/oathompsonjones"));
    app.get("/twitter", (_req, res) => void res.redirect("https://twitter.com/oathompsonjones"));

    // Forward all other routes to the index.html file.
    app.get("*", (_req, res) => void res.sendFile(`${__dirname}/client/build/index.html`));

    // Start server.
    try {
        // Read HTTPS certificate and key.
        const cert = fs.readFileSync("/etc/letsencrypt/live/oathompsonjones.co.uk/fullchain.pem");
        const key = fs.readFileSync("/etc/letsencrypt/live/oathompsonjones.co.uk/privkey.pem");
        // Create HTTPS server using certificate and key.
        const httpsServer = https.createServer({ cert, key }, app);
        // Create HTTP server to allow HTTP requests to be redirected to HTTPS requests.
        const httpServer = http.createServer(app);
        // Listen to port 443 for HTTPS and port 80 for HTTP.
        httpsServer.listen(443, "oathompsonjones.co.uk");
        httpServer.listen(80, "oathompsonjones.co.uk");
        console.log("Listening on ports 443 and 80.");
    } catch (err) {
        // Should only happen when testing on local machines.
        console.log(`HTTPS failed.\n${err}`);
        app.listen(80);
        console.log("Listening on port 80.");
    }
})();