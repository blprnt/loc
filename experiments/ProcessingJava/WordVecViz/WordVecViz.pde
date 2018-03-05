String dataPath = "/Users/jerthorp/code/loc/experiments/words_tsne/wordMap.json";
JSONArray words;

PVector rot = new PVector();
PVector trot = new PVector();

PFont displayFont;


void setup() {
  size(1280, 720, P3D);
  smooth();
  words = loadJSONArray(dataPath);
  displayFont = createFont("Helvetica", 72);
}

void draw() {
  rot.lerp(trot, 0.1);

  if (mousePressed) {
    trot.x += (mouseY - pmouseY) * 0.01;
    trot.y += (mouseX - pmouseX) * 0.01;
  }

  background(0);
  translate(width/2, height/2);

  rotateX(rot.x);
  rotateY(rot.y);
  rotateZ(rot.z);

  textFont(displayFont);
  textSize(12);

  float scale = 600;
  for (int i = 0; i < words.size(); i++) {
    JSONObject jo = words.getJSONObject(i);
    JSONArray pos = jo.getJSONArray("pos");
    float x = pos.getFloat(0);
    float y = pos.getFloat(1);
    float z = pos.getFloat(2);
    pushMatrix();
    translate(x * scale, y * scale, z * scale);
    rotateZ(-rot.z);
    rotateY(-rot.y);
    rotateX(-rot.x);
    text(jo.getString("label"), 0, 0);
    popMatrix();
  }
}