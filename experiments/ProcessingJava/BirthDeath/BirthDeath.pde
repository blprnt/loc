/*

 
 {
 "births": 127,
 "deaths": 34,
 "geoReturn": {
 "formattedAddress": "Brooklyn, NY, USA",
 "latitude": 40.6781784,
 "longitude": -73.9441579,
 "extra": {
 "googlePlaceId": "ChIJCSF8lBZEwokRhngABHRcdoI",
 "confidence": 0.5,
 "premise": null,
 "subpremise": null,
 "neighborhood": "Brooklyn",
 "establishment": null
 },
 "administrativeLevels": {
 "level2long": "Kings County",
 "level2short": "Kings County",
 "level1long": "New York",
 "level1short": "NY"
 },
 "country": "United States",
 "countryCode": "US",
 "provider": "google"
 },
 "id": "ChIJCSF8lBZEwokRhngABHRcdoI"
 }
 
 {
 "name": "Todd, Sean,",
 "birthPlace": "ChIJM_Xt5AZre0cRUCvd1IQkamY",
 "deathPlace": "ChIJu46S-ZZhLxMROG5lkwZ3D7k",
 "birthDate": "19380507",
 "deathDate": "20030314"
 }
 
 */
 
String[] colors = {"FF543005", "FF8c510a", "FFbf812d", "FFdfc27d", "FFf6e8c3", "FFf5f5f5", "FFc7eae5", "FF80cdc1", "FF35978f", "FF01665e", "FF003c30"};


String dataPath = "../../marc_locations/data/";

JSONArray peopleArray;
JSONArray placesArray;

float[] bounds = {-128.54550575, 23.4447188083, -64.355492, 51.7553397961};
float[] world = {-180, -90, 180, 90};
float[] europe = {-26.7206639936,35.7770192289,53.7910516936,69.6235001191};

PFont merriweather;
PFont merriweatherLight;

float mod = 0;
float tmod = 1;

void setup() {
  size(1280, 720, P3D);
  smooth();

  merriweather = createFont("Merriweather-Regular", 48);
  merriweatherLight = createFont("Merriweather-Light", 48);
  loadPlaces();
  loadPeople();
  bounds = europe;
}

void draw() {
  mod = lerp(mod, tmod, 0.1);
  background(200);
  
  pushMatrix();
  translate(width/2, height/2);
  rotateX(map(mouseY, 0, height, 0, PI/2));
  scale(0.75);
  translate(-width/2, -height/2);
  
  
  drawMap();
  translate(0,0,1);
  fill(200);
  rect(-width * 10,-height * 10,width * 20, height * 20);
  //drawList();
  popMatrix();
  fill(unhex(colors[colors.length - 1]));
  textFont(merriweather);
  text("Birthy",25,65);
  
  fill(unhex(colors[0]));
  textFont(merriweather);
  text("Deathy",25 + textWidth("Birthy") + 5,65);
}

void drawList() {
  //Deathy
  fill(0);
  textAlign(RIGHT);
  textFont(merriweatherLight);
  textSize(24);

  text("Birthiest places", width/2 - 50, 50);
  textSize(14);
  textAlign(RIGHT);
  fill(#999999);
  text("(These are the places people seemed to want to leave.)", width/2 - 50, 70);


  for (int i = 0; i < 20; i++) {
    JSONObject jo = placesArray.getJSONObject(i);
    String n = "";

    n = jo.getJSONObject("geoReturn").getString("formattedAddress").split(",")[0];

    fill(0);
    textFont(merriweather);
    textSize(24);
    textAlign(RIGHT);
    text(n, width/2 - 50, 110 + (i * 30));
  }

  //Birthy
  //Deathy
  fill(0);
  textAlign(LEFT);
  textFont(merriweatherLight);
  textSize(24);

  text("Deathiest places", width/2 + 50, 50);
  textSize(14);
  textAlign(LEFT);
  fill(#999999);
  text("(These are the places people seemed to want to end up.)", width/2 + 50, 70);

  for (int i = 0; i < 20; i++) {
    JSONObject jo = placesArray.getJSONObject(placesArray.size() - i - 1);
    String n = "";
    n = jo.getJSONObject("geoReturn").getString("formattedAddress").split(",")[0];

    fill(0);
    textAlign(LEFT);
    textSize(24);
    text(n, width/2 + 50, 110 + (i * 30));
  }
}
void drawMap() {
  for (int i = 0; i < placesArray.size(); i++) {
    JSONObject pj = placesArray.getJSONObject(i);
    float lat = pj.getJSONObject("geoReturn").getFloat("latitude");
    float lon = pj.getJSONObject("geoReturn").getFloat("longitude");

    float x = map(lon, bounds[0], bounds[2], 0, width);
    float y = map(lat, bounds[3], bounds[1], 0, height);

    float b = pj.getInt("births");
    float d = pj.getInt("deaths");
    float t = b + d;

    float f = (float) (b - d) / t;

    int ind = floor(map(f, -1, 1, 0, 10));
    color c = unhex(colors[ind]);

    noStroke();
    fill(c);

    float r = 4;
    float h = 5 + (pow(t, 0.5) * 8) * mod;
    pushMatrix();

    translate(x, y);
    rotateX((f < 0) ? 0:(PI));
    translate(0, 0, h/2);
    box(r, r, h);
    popMatrix();
  }
}

void loadPlaces() {
  placesArray = loadJSONArray(dataPath + "places.json");
  println(placesArray.size());
  for (int i = 0; i < placesArray.size(); i++) {
    JSONObject pj = placesArray.getJSONObject(i);
    float b = pj.getInt("births");
    float d = pj.getInt("deaths");
    float t = b + d;
    float f = (float) (b - d) / t;
    if (t > 20 && f > -0.05 && f < 0.05) println(pj.getJSONObject("geoReturn").getString("formattedAddress").split(",")[0]);
  }
}

void loadPeople() {
  peopleArray = loadJSONArray(dataPath + "people.json");
  println(peopleArray.size());
}

void keyPressed() {
 if (key == ' ') tmod = (tmod == 1) ? -1:1; 
}