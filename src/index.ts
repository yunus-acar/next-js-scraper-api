import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import puppeteer from "puppeteer";

const PORT = process.env.PORT || 4001;

dotenv.config();
const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cors());
//next-js-scraper-api

app.post("/", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    res.status(400).send("Url not found!");
  }

  (async () => {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForSelector("#__NEXT_DATA__");
    const data = await page.evaluate(() => {
      const json = document.querySelector("#__NEXT_DATA__")?.innerHTML;
      if (!json) {
        return {};
      }
      return JSON.parse(json);
    });
    await browser.close();
    if (!data) {
      res.status(500).send("Data not found!");
    } else if (data.props.pageProps) {
      res.json(data.props.pageProps);
    } else {
      res.json(data);
    }
  })();
});

app.post("/jsonToSql", async (req, res) => {
  const { json, key, removeObject } = req.body;

  if (!json) {
    res.status(400).send("Json not found!");
  }
  if (!key) {
    res.status(400).send("Key not found!");
  }
  if (!json[key]) {
    res.status(400).send("Key not found in json!");
  }

  const keys = Object.keys(json[key]);
  let values = Object.values(json[key]);

  values.forEach((value, index) => {
    switch (typeof value) {
      case "string":
        values[index] = `'${value}'`;
        break;
      case "object":
        if (removeObject) {
          keys.splice(index, 2);
        } else {
          values[index] = `'${JSON.stringify(value)}'`;
        }
        break;
      default:
        break;
    }
  });
  values = values.filter((value) =>
    removeObject ? typeof value !== "object" : true,
  );

  const sql = `INSERT INTO ${key} (${keys.join(", ")}) VALUES (${values.join(
    ", ",
  )})`;
  res.json({ sql });
});

app.post("/jsonToCsv", async (req, res) => {
  const { json, key, removeObject } = req.body;

  if (!json) {
    res.status(400).send("Json not found!");
  }
  if (!key) {
    res.status(400).send("Key not found!");
  }
  if (!json[key]) {
    res.status(400).send("Key not found in json!");
  }

  const keys = Object.keys(json[key]);
  let values = Object.values(json[key]);

  values.forEach((value, index) => {
    switch (typeof value) {
      case "string":
        values[index] = `"${value}"`;
        break;
      case "object":
        if (removeObject) {
          keys.splice(index, 2);
        } else {
          values[index] = `"${JSON.stringify(value)}"`;
        }
        break;
      default:
        break;
    }
  });
  values = values.filter((value) =>
    removeObject ? typeof value !== "object" : true,
  );

  const csv = `${keys.join(", ")}\n${values.join(", ")}`;
  res.json({ csv });
});

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});
