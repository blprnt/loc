String dataPath = "/Users/jerthorp/Downloads/wiki-news-300d-1M.vec";

BufferedReader reader = createReader(dataPath);
JSONObject out = new JSONObject();
JSONArray labels = new JSONArray();
JSONArray data = new JSONArray();
out.setJSONArray("labels", labels);
out.setJSONArray("data", data);

String line;
int c = 0;

while (c < 10000) {

  try {
    line = reader.readLine();
    if (c > 1) {
      String[] cols = line.split(" ");
      labels.append(cols[0]);
      JSONArray vecs = new JSONArray();
      for (int i = 0; i < 300; i++) {
        vecs.append(float(cols[i + 1]));
      }
      data.append(vecs);
    }
    c++;
  } 
  catch (IOException e) {
    e.printStackTrace();
    line = null;
  }
}


saveJSONObject(out, "wordVectors.json");

println("done");