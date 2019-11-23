/* unlz77.js 1.3 for LZ77 Dynamic Compressor 1.6 (c) 06.03.2019 by Michael Engelke (http://mengelke.de/.ha) */

function decodeToken(a,b,c,d) {                 // a -> Token, b -> true for Static
 d = a && !b ? -1 : 0;                          // Set start value
 for(c in a)                                    // Walk chars
  d = (b ? d : d + 1) * 96 - 32 + a.charCodeAt(c++); // Calc token value
 return d;                                      // Token value
}

function decrunchData(data,pref,a,b,c,d,e,f) {  // data -> Decrunch Static/Dynamic/Sequence (Plain Header)
 if(!data && typeof pref == "string")   {       // Token unique?
  for(a = 0, b = {34: 1, 39: 1, 92: 1}; a < pref.length; a++) // Illegal tokens
   if((c = pref.charCodeAt(a)) && !b[c])        // Check token
    b[c] = 1;                                   // Set know token
   else
    return false;                               // FAIL: Token not unique
  return true;                                  // Token are unique
 }
 if(!pref) {                                    // Exist Pref-Object
  if((a = /^\t(([\t -])[\t -]{0,94}?)\2([ -])([ -]{0,9})\t([\s\S]+)$/.exec(data)) && decrunchData(0,a[1]) && (b = decodeToken(a[3]))) { // Clean-Header
   data = a[5];                                 // Set packed data
   pref = {                                     // Set prefs
    token: a[1],                                // Set tokens
    deep: b % 9 + 1,                            // Decode Deep-Level
    min: 2 + b / 9 | 0,                         // Decode minBuf
    flag: decodeToken(a[4])};                   // Get Flags (Sequence)
   if(pref.flag & 2)                            // Chain-Mode?
    pref.chain = pref.token.length;             // Chain-Base
  }
  else if((a = /^(([\t -])[\t -]{0,94}?)\2([\s\S]+)$/.exec(data)) && decrunchData(0,a[1])) {  // Simple-Header
   data = a[3];                                 // Set packed data
   for(c = 0; c * (c + 1) + 2 < a[1].length; c++); // Calc deep
   pref = {                                     // Set prefs
    token: a[1],                                // Set tokens
    deep: c || 2,                               // Set Deep-Level
    min: 5,                                     // Set minBuf
    flag: 1};                                   // Set flags (Sequence)
  }
  else
   return false;                                // FAIL: Unknown Data
 }
 else if(typeof pref == "object") {             // Test Pref
  for(a = "token,deep,min,flag".split(","), b = 0; b < a.length; b++) // Duty-Keys
   if(!pref[b])                                 // Check key
    return false;                               // FAIL: Key not found
 }
 else
  return false;                                 // FAIL: Unknown Pref
 a = 0;                                         // Pack-Counter
 b = "";                                        // Decrunched data
 while(a < data.length) {                       // Walk data
  if(pref.token.length - 1) {                   // DYNAMIC-Mode
   c = pref.token.indexOf(data[a++]);           // Get token
   if(pref.flag & 2 && !c) {                    // CHAIN-Mode
    d = data[a++];                              // Get token
    d = decodeToken(d);                         // Get loop & token
    c = d % pref.chain;                         // Decode token
    f = 3 + d / pref.chain | 0;                 // Decode loop
//    console.log({chain:f,tid:c});
    if(!c)                                      // CHAIN again?
     a++;                                       // Adjust Data-Offset for RAW
   }
   if(pref.flag & 2)                            // Adjust token (Chain-Mode)
    c--;
   for(f = f || 1; f; f--)                      // Chain-Loop
    if(c < 0)                                   // RAW-Modus
     b += data[a-1];                            // Put RAW
    else if(c > 0) {                            // LZ-Modus?
     if(!(pref.flag%2) || c > 1 + (pref.flag & 2) / 2) { // Dynamic or Dynamic Sequence
      e = c - pref.flag % 2 - 1;                // Adjust token Offset for Sequence
      d = e % pref.deep + 1;                    // Distance size
      e = e / pref.deep | 0;                    // Length size
//      console.log({tid:c,tok:d+" "+e,raw:data.substr(a,d+e)});
      a += d;                                   // Adjust Pack-Counter
      d = data.substr(a - d, d);                // Distance token
      d = decodeToken(d);                       // Distance value
      a += e;                                   // Adjust Pack-Counter
      e = data.substr(a - e, e);                // Length token
      e = decodeToken(e) + pref.min;            // Length value
//      console.log({pos:b.length,dis:d,len:e});
      if(d + e > b.length)                      // Check distance before start?
       return false;                            // FAIL: Distance to high
      b += b.substr(-d - e, e);                 // Decrunch data
     }
     else {                                     // SEQUENCE
      d = data[a];                              // Loop token
      d = decodeToken(d) + 2;                   // Loop value
      e = data[a + 1];                          // Length Token
      e = decodeToken(e) + 1;                   // Length value
//      console.log({pos:b.length,loop:d,len:e});
      d = new Array(d + 1);                     // Set Loop
      e = b.substr(-e,e);                       // Set Sequence Data
      b += d.join(e);                           // Decrunch data
      a += 2;                                   // Adjust Pack-Counter
     }
    }
    else
     b += data[a++];                            // Escape token
  }
  else {                                        // STATIC-Mode
   if(data[a] != pref.token)                    // RAW data
    b += data[a++];
   else if(data[a + 1] == pref.token) {         // Escape token
    b += pref.token;
    a += 2;                                     // Adjust Pack-Counter
   }
   else {
    d = data.substr(a + 1, pref.deep);          // Distance token
    d = decodeToken(d, true);                   // Distance value
    e = data[a + 1 + pref.deep];                // Length token
    e = decodeToken(e, true) + pref.min;        // Length
//    console.log({pos:b.length, dis:d, len:e});
    if(d + e > b.length)                        // Check distance before start?
     return false;                              // FAIL: Distance to high
    b += b.substr(-d - e, e);                   // Decrunch data
    a += 2 + pref.deep;                         // Adjust Pack-Counter
   }
  }
 }
 return b;                                      // Decrunched data
}
