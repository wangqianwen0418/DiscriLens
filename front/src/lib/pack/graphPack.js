import enclose from "./enclose.js";

/***********************
*** modified packing 
*********************/


function Node(circle) {
  this._ = circle;
  this.next = null;
  this.previous = null;
}

// // brute force sort, may optimize later
// function sortMetric(circle, graph, packedCircles) {
//   var neighbors = graph.neighbors(circle)
//   var neighborsWeight = neighbors
//     .reduce(
//       (acc, cur) => { acc + graph.edge(cur, circle).weight }
//     )

//   var connectWeight = neighbors
//     .filter(id => packedCircles.includes(id))
//     .reduce(
//       (acc, cur) => { acc + graph.edge(cur, circle).weight }
//     )

//   return neighborsWeight + connectWeight
// }

function sortByAllNeighbors(circleID, graph) {
  var neighbors = graph.neighbors(circleID)
  return neighbors
    .reduce(
      (acc, cur) => { acc + graph.edge(cur, circleID).weight }
    )
}

function sortByPackedNeighbors(circleID, graph, packedcircleIDs) {
  var neighbors = graph.neighbors(circleID).filter(id => packedcircleIDs.includes(id))

  return neighbors.length > 0 ?
    neighbors.reduce(
      (acc, cur) => { acc + graph.edge(cur, circleID).weight }
    ) : 0
}

function sortCircle(circles, graph, packedCircles) {
  circles.sort((a, b) => sortByAllNeighbors(a.id, graph) - sortByAllNeighbors(b.id, graph))
  circles.sort((a, b) => sortByPackedNeighbors(a.id, graph, packedCircles) - sortByPackedNeighbors(b.id, graph, packedCircles)) // more important
}

function place(b, a, c) {
  //   put c tangent to a and b
  var dx = b.x - a.x, x, a2,
    dy = b.y - a.y, y, b2,
    d2 = dx * dx + dy * dy;
  if (d2) {
    a2 = a.r + c.r, a2 *= a2;
    b2 = b.r + c.r, b2 *= b2;
    if (a2 > b2) {
      x = (d2 + b2 - a2) / (2 * d2);
      y = Math.sqrt(Math.max(0, b2 / d2 - x * x));
      c.x = b.x - x * dx - y * dy;
      c.y = b.y - x * dy + y * dx;
    } else {
      x = (d2 + a2 - b2) / (2 * d2);
      y = Math.sqrt(Math.max(0, a2 / d2 - x * x));
      c.x = a.x + x * dx - y * dy;
      c.y = a.y + x * dy + y * dx;
    }
  } else {
    c.x = a.x + c.r;
    c.y = a.y;
  }
}

function intersects(a, b) {
  var dr = a.r + b.r - 1e-6, dx = b.x - a.x, dy = b.y - a.y;
  return dr > 0 && dr * dr > dx * dx + dy * dy;
}

export default function(nodes, graph) {
  let circles = [...nodes]
  // modify the front chain packing based on a weighted unconnect graph
  if (!(n = circles.length)) return 0;

  var a, b, c, n, aw, pw, i, j, k, sj, sk;
  var packed = []
  // circles.sort((circleA, circleB) => {
  //   return sortMetric(circleA.id, packed) - sortMetric(circleB.id, packed)
  // })
  sortCircle(circles, graph, packed)

  // Place the first circle.
  a = circles.pop(), a.x = 0, a.y = 0;
  packed.push(a)
  if (!(n > 1)) return a.r;

  // Place the second circle.
  // circles.sort((circleA, circleB) => {
  //   return sortMetric(circleA.id, packed) - sortMetric(circleB.id, packed)
  // })
  sortCircle(circles, graph, packed)
  b = circles.pop(), a.x = -b.r, b.x = a.r, b.y = 0;
  packed.push(b)
  if (!(n > 2)) return a.r + b.r;

  // Place the third circle.
  // circles.sort((circleA, circleB) => {
  //   return sortMetric(circleA.id, packed) - sortMetric(circleB.id, packed)
  // })
  sortCircle(circles, graph, packed)
  c = circles.pop()
  place(b, a, c);
  packed.push(c)

  // Initialize the front-chain using the first three circles a, b and c.
  a = new Node(a), b = new Node(b), c = new Node(c);
  a.next = c.previous = b;
  b.next = a.previous = c;
  c.next = b.previous = a;

  // circles.sort((circleA, circleB) => {
  //   return sortMetric(circleA.id, packed) - sortMetric(circleB.id, packed)
  // })
  sortCircle(circles, graph, packed)
  c = circles.pop()
  c = new Node(c);

  // Attempt to place each remaining circle…
  pack: for (i = 3; i < n; ++i) {

    place(a._, b._, c._),
      // Find the closest intersecting circle (j or k or no intersecting circle) on the front-chain.
      j = b.next, k = a.previous, sj = b._.r, sk = a._.r;
    do {
      if (sj <= sk) {
        if (intersects(j._, c._)) {
          b = j, a.next = b, b.previous = a, --i;
          continue pack;
        }
        sj += j._.r, j = j.next;
      } else {
        if (intersects(k._, c._)) {
          a = k, a.next = b, b.previous = a, --i;
          continue pack;
        }
        sk += k._.r, k = k.previous;
      }
    } while (j !== k.next); // check insection for all the nodes in the front chain
    packed.push(c._)

    // Success! Insert the new circle c between a and b.
    // c.previous = a, c.next = b, a.next = b.previous = b = c;
    c.previous = a, c.next = b, a.next = b.previous = c;

    // // Compute the new closest circle pair to the centroid.
    // aa = score(a);
    // while ((c = c.next) !== b) {
    //   if ((ca = score(c)) < aa) {
    //     a = c, aa = ca;
    //   }
    // }
    // b = a.next;


    if (circles.length > 0) {
      // update a,b,c. 
      // c: the new circle to add, with largest sortMetric value in unpacked circles
      // circles.sort((circleA, circleB) => {
      //   return sortMetric(circleA.id, packed) - sortMetric(circleB.id, packed)
      // })
      sortCircle(circles, graph, packed)
      c = new Node(circles.pop())
      // a: a circle in the packed circles that maxmize edge(a,c).weight
      // go through the front chain to find a
      var pointer = a; // used to loop over the front chain
      var e = graph.edge(c._.id, a._.id);
      aw = e ? e.weight : 0;
      while ((pointer = pointer.next) != b.previous) {
        e = graph.edge(c._.id, pointer._.id)
        pw = e ? e.weight : 0
        if (pw > aw) {
          aw = pw; a = pointer
        }
      }
      b = a.next
    }
  }

  // Compute the enclosing circle of the front chain.
  a = [b._], c = b; while ((c = c.next) !== b) a.push(c._); c = enclose(a);

  // Translate the circles to put the enclosing circle around the origin.
  for (i = 0; i < n; ++i) a = packed[i], a.x -= c.x, a.y -= c.y;
  return c.r
}
