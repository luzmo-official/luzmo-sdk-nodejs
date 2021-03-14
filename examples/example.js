var Cumulio = require("../src/cumulio");

// Connect
var client = new Cumulio({
  api_key: "7e08974a-93dd-44ae-b297-73fabf1c378f",
  api_token:
    "MWdMytqZY5voaa8ewRC1OwoOHFYBN9xc21hOMUjhkCiIFDL7d9S9RUz4cZYhb0WMafmhCqUkJiqCXI9OlLsFWjESIZVNzf7Q0ia1gVS4dhJaQynZWUPwWAUolCSzfm2bEoUckhgb7aP2Hsd3Gc6P3D",
});

// Example 1: create a new dataset
var dataset;

client
  .create("securable", {
    type: "dataset",
    name: {
      nl: "Burrito-statistieken",
      en: "Burrito statistics",
    },
  })

  // Example 2: update a dataset
  .then(function (result) {
    dataset = result;
    return client.update("securable", dataset.id, {
      description: { nl: "Het aantal geconsumeerde burrito's per type" },
    });
  })

  // Example 3: create columns
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
      [
        {
          role: "Securable",
          id: dataset.id,
        },
      ]
    );
  })
  .then(function () {
    return client.create(
      "column",
      {
        type: "numeric",
        format: ",.0f",
        informat: "numeric",
        order: 1,
        name: { nl: "Burrito-gewicht" },
      },
      [
        {
          role: "Securable",
          id: dataset.id,
        },
      ]
    );
  })

  // Example 4: push 2 data points to a dataset
  .then(function () {
    return client.create("data", {
      securable_id: dataset.id,
      data: [
        ["sweet", 126],
        ["sour", 352],
      ],
    });
  })

  // Error handling & closing connection
  .catch(function (error) {
    console.error("API error:", error);
  })
  .finally(function () {
    client.close();
  });
