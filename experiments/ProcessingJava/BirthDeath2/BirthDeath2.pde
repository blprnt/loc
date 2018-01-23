import java.util.Date;
import java.text.SimpleDateFormat;
import java.util.Collections;

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

float[] bounds;
float[] usa = {-128.54550575, 23.4447188083, -64.355492, 51.7553397961};
float[] world = {-180, -90, 180, 90};
float[] europe = {-26.7206639936, 35.7770192289, 53.7910516936, 69.6235001191};

PFont merriweather;
PFont merriweatherLight;

float mod = 0;
float tmod = 1;

ArrayList<Person> allPeople = new ArrayList();
ArrayList<Place> allPlaces = new ArrayList();
HashMap<String, Place> placeMap = new HashMap();

Date startDate;
Date endDate;
Date currentDate;
long timeMag = 400000000;

void setup() {
  size(1280, 720, P3D);
  smooth();
  
  bounds = world;
  merriweather = createFont("Merriweather-Regular", 48);
  merriweatherLight = createFont("Merriweather-Light", 48);
  loadPlaces();
  loadPeople();

  positionMap();

  initClock();
  
}

void positionMap() {
 for (Place p : allPlaces) {
    p.positionMap();
    p.labeling = false;
  } 
}

void positionRing() {
  //Sort places on longitude
  Collections.sort(allPlaces);

  //Place in ring
  for (int i = 0; i < allPlaces.size(); i++) {
    float theta = map(i, 0, allPlaces.size(), 0, TAU);
    float rad = 250;
    allPlaces.get(i).tpos.set(width/2 + (cos(theta) * rad), height/2 + (sin(theta) * rad));
    allPlaces.get(i).rot = theta;
    allPlaces.get(i).labeling = allPlaces.get(i).t > 100;
  }
}

void draw() {
  tickClock();
  mod = lerp(mod, tmod, 0.1);
  background(50   );
  
  
  fill(unhex(colors[colors.length - 3]));
  textFont(merriweather);
  text("Birthy",25,65);
  
  fill(unhex(colors[1]));
  textFont(merriweather);
  text("Deathy",25 + textWidth("Birthy") + 5,65);

  fill(200);
  textFont(merriweather);
  text(currentDate.getYear() + 1900, 50, 120);

  pushMatrix();
  translate(width/2, height/2);
  rotateX(map(mouseY, 0, height, 0, PI/2));

  translate(-width/2, -height/2);
  popMatrix();

  for (Place p : allPlaces) {
    p.update();
    p.render();
  }

  for (Person p : allPeople) {
    p.update();
    p.render();
  }
}



void loadPlaces() {
  placesArray = loadJSONArray(dataPath + "places.json");
  for (int i = 0; i < placesArray.size(); i++) {
    JSONObject pj = placesArray.getJSONObject(i);
    JSONObject geo = pj.getJSONObject("geoReturn");

    Place p = new Place();
    p.name = geo.getString("formattedAddress");
    p.births = pj.getInt("births");
    p.deaths = pj.getInt("deaths");
    p.t = p.births + p.deaths;
    p.bdFraction =(float) (p.births - p.deaths) / p.t;

    p.lonLat = new PVector(geo.getFloat("longitude"), geo.getFloat("latitude"));

    allPlaces.add(p);
    try { 
      placeMap.put(pj.getString("id"), p);
    } 
    catch(Exception e) {
    }
  }
}

void loadPeople() {
  peopleArray = loadJSONArray(dataPath + "people.json");
  for (int i = 0; i < peopleArray.size(); i++) {
    JSONObject pj = peopleArray.getJSONObject(i);
    Person p = new Person();

    p.name = pj.getString("name");
    p.bdString = pj.getString("birthDate");
    p.ddString = pj.getString("deathDate");
    try {
      p.birthPlace = placeMap.get(pj.getString("birthPlaceID"));
      p.deathPlace = placeMap.get(pj.getString("deathPlaceID"));
      allPeople.add(p);
    } 
    catch (Exception e) {
    }
    p.init();
  }
}

void initClock() {
  startDate = new Date(-300, 0, 0); 
  endDate = new Date(115, 0, 0);
  currentDate = new Date(-300, 0, 0);
}

void tickClock() {
  currentDate = new Date(currentDate.getTime() + (timeMag * 30));
  if (currentDate.getTime() > endDate.getTime()) {
    currentDate = startDate;
  }
}

void keyPressed() {
  if (key == ' ') tmod = (tmod == 1) ? -1:1; 
  if (key == 'r') positionRing();
  if (key == 'm') {
    bounds = world;
    positionMap();
  }
  if (key == 'u') {
    bounds = usa;
    positionMap();
  }
  if (key == 'e') {
    bounds = europe;
    positionMap();
  }
}

Date stringToDate(String s) {
  Date d = null;
  if (s.length() == 8) {
    SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd");
    try {
      d = sdf.parse(s);
    } 
    catch(Exception e) {
      println("DATE ERROR ON:" + s);
    }
  } else  if (s.length() == 4) {
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy");
    try {
      d = sdf.parse(s);
    } 
    catch(Exception e) {
      println("DATE ERROR ON:" + s);
    }
  }
  return(d);
}