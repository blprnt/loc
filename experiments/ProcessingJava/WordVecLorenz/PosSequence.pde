class PosSequence {
  
  String[][] sentences;
  
  int sc = 0;
  int wc = 0;
  
  void loadFromFile(String url) {
    String[] ins = loadStrings(url);
    sentences = new String[ins.length][];
    for (int i = 0; i < ins.length; i++) {
      sentences[i] = ins[i].split(" ");
    }
  }
 
  String getNext() {
   String pos = sentences[sc][wc];
   wc ++;
   if (wc == sentences[sc].length) {
    wc = 0;
    sc ++;
    pos = pos + "\n";
   }
   return(pos);
  }
  
}