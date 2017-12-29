String dataPath = "../../../experiments/marc/data/titles/";
int titleInd = 1;

HashMap<String, JSONObject> codeMap = new HashMap();
ArrayList<String> allCodes = new ArrayList();

String alpha = "ABCDEFGHIJKLMNOPQRSTUV";

int[] years = {1900, 2010};
BookRing[] rings;

int perFrame = 10000;

boolean stacked = true;

ArrayList<JSONObject> queue = new ArrayList();

void setup() {
  size(1280, 900, P3D);
  smooth(4);

  buildRings();
  loadCodes();
  loadTitles();
}

void draw() {

  background(255);
  //println(queue.size());

  for (int i = 0; i < perFrame; i++) {
    if (queue.size() > 0) { 
      nextInQ();
    } else {
      loadTitles();
    }
  }


  float orad = 200;
  float rad = orad;
  int gt = 0;

  //Stacked mode
  if (stacked) {
    for (int i = 0; i < rings.length; i++) {
      
      BookRing r = rings[i];
      r.tpos.set(0,0,0);
      r.tpos.z = rings.length - i;
      //println(r.z);
      r.startR = rad;
      gt += r.total;
      r.endR = orad + pow(gt, 0.4) + 1;
      rad = r.endR;

      r.update();
      r.render();
    }

    pushMatrix();
    translate(0, 0, (years[1] - years[0]) + 1);
    fill(255);
    ellipse(0, 0, orad, orad);
    popMatrix();
  } else {


    int cols = 10;
    for (int i = 0; i < rings.length; i++) {

      BookRing r = rings[i];
      r.tpos.x = map(i % cols, 0, cols, 100, width - 100);
      r.tpos.y = 100 + (floor(i / cols) * 70);
      r.tpos.z = 0;
      r.startR = 0;
      gt = r.total;
      r.endR = pow(gt, 0.4);

      r.update();
      r.render();
    }
    //Grid mode
  }
}

void nextInQ() {
  JSONObject j = queue.get(0);
  try {
    int y = j.getInt("year");
    if (y >= years[0]) {
      rings[y - years[0]].fileBook(j);
    }
  } 
  catch(Exception e) {
    //No year
  }
  queue.remove(0);
}

void buildRings() {
  rings = new BookRing[years[1] - years[0]];
  for (int i = 0; i < years[1] - years[0]; i++) {
    BookRing r = new BookRing();
    r.year = years[0] + i;
    rings[i] = r;
    r.pos = new PVector(width/2, height/2);
    r.tpos = new PVector(width/2, height/2);
  }
}

void loadCodes() {
  JSONArray cja = loadJSONArray("codes.json");
  for (int i = 0; i < cja.size(); i++) {
    JSONObject co = cja.getJSONObject(i);
    codeMap.put(co.getString("code"), co);
    allCodes.add(co.getString("code"));
  }
}


void loadTitles() {
  try {
    JSONArray ja = loadJSONArray(dataPath + "titles" + titleInd + ".json");
    for (int i = 0; i < ja.size(); i++) {
      queue.add(ja.getJSONObject(i));
    }
    println("LOADED:" + titleInd);
    titleInd++;
  } 
  catch (Exception e) {
    //Failed load
  }
}


color getColorFromCode(String code) {
  int pos = alpha.indexOf(code.charAt(0));
  float hue = map(pos, 0, alpha.length(), 0, 255);
  colorMode(HSB);
  return(color(hue, 255, 255));
}

void keyPressed() {
  if (key == ' ') stacked = !stacked;
}