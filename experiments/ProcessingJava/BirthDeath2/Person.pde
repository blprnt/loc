class Person {

  String name;
  PVector pos;
  PVector tpos;

  Place birthPlace;
  Place deathPlace;

  String bdString;
  String ddString;

  Date bDate;
  Date dDate;

  void init() {
    //Convert date strings
    bDate = stringToDate(bdString);
    dDate = stringToDate(ddString);
  }

  void update() {
  }

  void render() {
    stroke(255, 2);
    if (birthPlace != null && deathPlace != null) {
      if (bDate != null && dDate != null) {
        if (bDate.getTime() < currentDate.getTime()) {
          //line(birthPlace.pos.x, birthPlace.pos.y, deathPlace.pos.x, deathPlace.pos.y);
        }
        if (bDate.getTime() < currentDate.getTime() && dDate.getTime() > currentDate.getTime()) {
          
          
          float leaveTime = map(0.25,0,1,bDate.getTime(), dDate.getTime());
          float settleTime = map(0.75,0,1,bDate.getTime(), dDate.getTime());
          float f = constrain(map(currentDate.getTime(), leaveTime, settleTime, 0, 1), 0, 1);
          PVector b = new PVector(birthPlace.pos.x, birthPlace.pos.y, birthPlace.pos.z);
          b.lerp(deathPlace.pos, f);
          
          float cf = map(currentDate.getTime(), bDate.getTime(), dDate.getTime(), 0, 1);
          color c = unhex(colors[colors.length - floor(cf * 11) - 1]);
          fill(c);
          noStroke();
          ellipse(b.x, b.y, 3,3);
        }
      }
    }
  }
}