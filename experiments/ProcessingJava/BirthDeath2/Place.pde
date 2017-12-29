class Place implements Comparable {
 
  String name;
  PVector pos = new PVector();
  PVector tpos = new PVector();
  
  int births;
  int deaths;
  int t;
  float bdFraction;
  
  PVector lonLat = new PVector();
  
  float rot;
  boolean labeling = false;
 
  
  void update() {
    pos.lerp(tpos, 0.1);
  }
  
  void render() {
    pushMatrix();
      translate(pos.x, pos.y, pos.z);
      noStroke();
      fill(255,50);
      rect(0,0,2,2);
      
      if (labeling) {
       rotateZ(rot);
       textSize(14);
       fill(190);
       text(name, 10, 0);
      }
    popMatrix();
  }
  
  void positionMap() {
      tpos.x = map(lonLat.x, bounds[0], bounds[2], 0, width);
      tpos.y = map(lonLat.y, bounds[1], bounds[3], height, 0);
  }
  
  int compareTo(Object b) {
   return(int((lonLat.x * 1000)  - (((Place) b).lonLat.x) * 1000)); 
  }
  
}