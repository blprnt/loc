class Lorenz {

float x, y, z, dx, dy, dz;
float t, dt;
float sigma, beta, rho;

ArrayList<Vec3D> points = new ArrayList<Vec3D>();

float sf;

void init() {

  dt = 0.01;

  x = 1;
  y = 1;
  z = 1;

  rho = 28;
  sigma = 10;
  beta = 8/3;
  
  
}

void update() {
  dx = sigma*(y-x)*dt;
  dy = (x*(rho-z)-y)*dt;
  dz = (x*y-beta*z)*dt;

  x = x + dx;
  y = y + dy;
  z = z + dz;
}

void render() {

  Vec3D pv = new Vec3D(x,y,z);
  pv.rotateX(0);
  pv.scaleSelf(sf);
  //pv  = rotateVector(pv, new Vec3D(0,0,0), 0).mult(sf * 10);
  points.add(pv);

  float hu = 2;
  beginShape();
  noFill();
  for (Vec3D v : points) {
    stroke(255,0,0); //crazy colouring
    vertex(v.x, v.y, v.z);
  }
  endShape();
}

}