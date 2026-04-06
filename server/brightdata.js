const brightDataUrl = "https://api.brightdata.com/datasets/v3/trigger";
const webhookUrl = "http://example.com/webhook";

export const trigerBrightData = async (url) => {
  const data = JSON.stringify([
    {
      url: url,
      country: "",
      transcription_language: "",
    },
  ]);

  const response = await fetch(
    `${brightDataUrl}?dataset_id=gd_lk56epmy2i5g7lzu0k&endpoint=${encodeURIComponent(webhookUrl)}&format=json&uncompressed_webhook=true&include_errors=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.BRIGHTDATA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: data,
    },
  );
  const result = await response.json();

  console.log(result);
};
trigerBrightData("https://www.youtube.com/watch?v=fuhE6PYnRMc");
