JSONArray cols;

void setup() {
  cols = loadJSONArray("../../marc_colors/data/colorsVisual.Materials_all.json");
  size(1400,800);
  
  
}

void draw() {
  background(0);
  
  for (int i = 0; i < cols.size(); i++) {
   JSONObject co = cols.getJSONObject(i);
   String h = co.getString("hex");
   color c = unhex("FF" + h.replace("#",""));
   float x = i;//map(i, 0, cols.size(), 0, width);
   stroke(c);
   strokeWeight(1);
   line(x,36,x,height);
  }
  
  
  int i = mouseX;//floor(map(mouseX, 0, width, 0, cols.size()));
  fill(255);
  textSize(24);
  text(cols.getJSONObject(i).getJSONArray("Title").getString(0), 50, 30);
  
}