import Cumulio from "../src/cumulio";

const options: Cumulio.Options = {
  api_key: "7e08974a-93dd-44ae-b297-73fabf1c378f",
  api_token:
    "MWdMytqZY5voaa8ewRC1OwoOHFYBN9xc21hOMUjhkCiIFDL7d9S9RUz4cZYhb0WMafmhCqUkJiqCXI9OlLsFWjESIZVNzf7Q0ia1gVS4dhJaQynZWUPwWAUolCSzfm2bEoUckhgb7aP2Hsd3Gc6P3D",
};
const client = new Cumulio(options);
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
      [{ role: "securable", id: dataset.id }]
    );
  });
