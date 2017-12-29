class BookRing {
 
  int year = 0;
  int total = 0;
  IntDict dict = new IntDict();
  
  float startR = 0;
  float endR = 0;
  
  float z = 0;
  
  color c;
  
  PVector pos = new PVector();
  PVector tpos = new PVector();
  
  
  BookRing() {
    c = color(random(255), random(255), random(255));
  }
  
  void init() {
    
  }
  
  void update() {
    pos.lerp(tpos, 0.1);
  }
  
  void render() {
    
    pushMatrix();
    translate(pos.x,pos.y,pos.z);
    stroke(255);
    //noStroke();
    fill(c);
    
    dict.sortKeys();
    String[] keys = dict.keyArray();
    float stack = 0;
    for (int i = 0; i < keys.length; i++) {
      int kt = dict.get(keys[i]);
      float th = ((float) kt / total) * TAU;
      fill(getColorFromCode(keys[i]));
      arc(0,0,endR, endR, stack, stack + th);
      stack += th;
      
    }
    
    popMatrix();
    
  }
  
  void fileBook(JSONObject j) {
   //Get call code
   String call = j.getString("call");
   String code = "";
   int ci = 0;
   while (Character.isLetter(call.charAt(ci))) {
    code = code + call.charAt(ci);
    ci++; 
   }
   if (code.length() > 0) dict.increment(code);
   total ++;
  }
  
}