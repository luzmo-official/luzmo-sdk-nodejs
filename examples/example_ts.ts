import Luzmo from "./luzmo";

const options: Luzmo.Options = {
  api_key: "< Your API key >",
  api_token: "< Your API token >",
};

const client = new Luzmo(options);
client
  .create("securable", {
    type: "dataset",
    name: {
      nl: "Burrito-statistieken",
      en: "Burrito statistics",
    },
  })

  .then(function (result) {
    const dataset = result;
    return client.update("securable", dataset.id, {
      description: { nl: "Het aantal geconsumeerde burrito's per type" },
    });
  })
  .then(function (dataset) {
    return client.create(
      "column",
      {
        type: "hierarchy",
        format: "",
        informat: "hierarchy",
        order: 0,
        name: { nl: "Type burrito" },
      },
      [{ role: "Securables", id: dataset.id }]
    );
  });
