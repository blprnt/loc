
import toxi.geom.*;


String dataPath = "/Users/jerthorp/code/loc/experiments/words_tsne/wordMap_final.json";
ArrayList<WordPoint> words = new ArrayList();

HashMap<String, ArrayList<WordPoint>> wordMap = new HashMap();

Vec3D rot = new Vec3D();
Vec3D trot = new Vec3D();

PFont displayFont;

Lorenz attractor;

float scale = 900;

String lastWord = "";
String display = "";

WordPoint closest;

PrintWriter writer;

HashMap<String, String> posMap = new HashMap();

PosSequence sequence;

void setup() {
  size(1280, 720, P3D);
  smooth();
  frameRate(30);

  displayFont = createFont("Helvetica", 72);
  
  writer = createWriter("out" + hour() + "_" + minute() + "_" + ".txt");

  attractor = new Lorenz();
  attractor.init();
  attractor.sf = scale / 100;

  init();
}

void init() {

  //Load POS sequence
  sequence = new PosSequence();
  sequence.loadFromFile("whitman.txt");

  //Load POS map
  String[] rows = loadStrings("pos.csv");
  for (int i = 0; i < rows.length; i++) {
    String[] cols = rows[i].split(",");
    posMap.put(cols[0], cols[1]);
  }

  //Load word vectors
  JSONArray wordJSON = loadJSONArray(dataPath);

  for (int i = 0; i < wordJSON.size(); i++) {
    JSONObject jo = wordJSON.getJSONObject(i);
    JSONArray pos = jo.getJSONArray("pos");
    float x = pos.getFloat(0);
    float y = pos.getFloat(1);
    float z = pos.getFloat(2);
    WordPoint w = new WordPoint();
    String l = jo.getString("label");
    w.word = l;
    String part = posMap.get(l);
    //File into appropriate array
    if (!wordMap.containsKey(part)) {
      wordMap.put(part, new ArrayList());
      wordMap.get(part).add(w);
    } else {
      wordMap.get(part).add(w);
    }


    words.add(w);
    w.set(x * scale, y * scale, z * scale);
  }
}


void draw() {
  rot.interpolateToSelf(trot, 0.1);

  if (mousePressed) {
    trot.x += (mouseY - pmouseY) * 0.01;
    trot.y += (mouseX - pmouseX) * 0.01;
  }

  background(0);

  fill(255);

  textFont(displayFont);
  textSize(18);
  fill(255);
  try {
    text(display, 50, 75, 200, height - 100);
  } 
  catch(Exception e) {
    println(e);
  }


  //Find closest word
  //closest = getClosestWord(words, attractor.points.get(attractor.points.size() - 1));
  String pos = sequence.getNext(); 
  text(pos, 350, 75, 200, height - 100);
  String n;
  try {
    closest = getClosestWord(wordMap.get(pos), attractor.points.get(attractor.points.size() - 1));
    n = closest.word;
  } 
  catch(Exception e) {
    n = pos;
  }
  if (!n.equals(lastWord)) {
    lastWord = n;
    writer.print(n + " ");
    display = lastWord + "\n" + display;
  }

  translate(width/2, height/2);

  rotateX(rot.x);
  rotateY(rot.y);
  rotateZ(rot.z);

  //Attractor
  attractor.update();
  attractor.render();




  for (int i = 0; i < words.size(); i++) {
    pushMatrix();
    WordPoint w = words.get(i);
    translate(w.x, w.y, w.z);
    rotateZ(-rot.z);
    rotateY(-rot.y);
    rotateX(-rot.x);
    if (closest == w) {
      fill(255);
      text(w.word, 0, 0);
      ellipse(0, 0, 2, 2);
    } else {
      stroke(255);
    }
    point(0, 0);
    popMatrix();
  }
}

WordPoint getClosestWord(ArrayList<WordPoint> wordList, Vec3D v) {
  float best = 1000000000;
  WordPoint bestPoint = null;
  int c = 0;
  for (WordPoint wp : wordList) {
    float d = pow(v.x - wp.x, 2) + pow(v.y - wp.y, 2) + pow(v.z - wp.z, 2);

    if (abs(d) < best) {
      bestPoint = wp;
      best = abs(d);
    }
    c++;
  }
  return(bestPoint);
}

void keyPressed() {
  if (key == 's') {
   writer.flush();
   writer.close();
   exit();
  }
}