const express = require("express");
const { X12parser, X12grouper, Schema } = require("x12-parser");
const { createReadStream } = require("fs");
const fs = require("fs");
const app = express();
const PORT = 5000;

const multer = require("multer");

const upload = multer({ dest: "uploads/" });

app.use(express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded());

app.post("/parse", upload.single("EDIfile"), (req, res) => {
  console.log(req.file);
  const schema = {
    start: "ISA", // What segment starts the group
    end: "IEA", // What segment ends the group
    name: "Envelope", // What is the name of the group
    groups: [
      // Nested groups
      {
        start: "BPR",
        terminators: ["N1"],
        name: "headers",
      },
      {
        start: "N1",
        terminators: ["LX"],
        name: "1000",
      },
      {
        start: "LX",
        name: "2000",
        terminators: ["SE"],
        groups: [
          {
            start: "CLP",
            name: "2100",
            groups: [
              {
                start: "SVC",
                name: "2110",
              },
            ],
          },
        ],
      },
    ],
  };

  const myParser = new X12parser();
  const mySchema = new Schema("005010X221A1", schema);
  const myGrouper = new X12grouper(mySchema);

  const testFile = createReadStream("./uploads/" + req.file.filename);

  testFile
    .pipe(myParser)
    .pipe(myGrouper)
    .on("data", (data) => {
      console.log(data);
      res.send(data);
    });
});

app.listen(PORT, () => {
  console.log(`App is live on port ${PORT}.`);
});
