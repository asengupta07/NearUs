function calcCentroid(coords) {
    let sumX = 0, sumY = 0;
    coords.forEach(({ x, y }) => {
      sumX += x;
      sumY += y;
    });
    return { x: sumX / coords.length, y: sumY / coords.length };
  }
  
  function dist(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }
  
  function shiftPts(coords, c) {
    return coords.map(({ x, y, flex }) => {
      const vecX = c.x - x;
      const vecY = c.y - y;
      const shift = 1 - flex;
      return { x: x + vecX * shift, y: y + vecY * shift, flex };
    });
  }
  
  function findCentroid(coords) {
    const initC = calcCentroid(coords);
    const shifted = shiftPts(coords, initC);
    const newC = calcCentroid(shifted);
  
    const dists = coords.map(({ x, y }) => {
      const d = dist({ x, y }, newC);
      return { x, y, d };
    });
  
    return { centroid: newC, dists };
  }
  
  function plotASCII(coords, c, size = 20) {
    const grid = Array(size).fill().map(() => Array(size).fill('  '));
    const half = Math.floor(size / 2);
  
    const mapGrid = (x, y) => [
      Math.round(half + y * half / 2.5),
      Math.round(half + x * half / 2.5)
    ];
  
    coords.forEach((coord, idx) => {
      const [row, col] = mapGrid(coord.x, coord.y);
      if (row >= 0 && row < size && col >= 0 && col < size) {
        grid[row][col] = (idx + 1).toString() + ' ';
      }
    });
  
    const [centroidRow, centroidCol] = mapGrid(c.x, c.y);
    if (centroidRow >= 0 && centroidRow < size && centroidCol >= 0 && centroidCol < size) {
      grid[centroidRow][centroidCol] = 'C';
    }
  
    return grid.map(row => row.join(' ')).join('\n');
  }
  
  const coords = [
    { x: 2, y: 0, flex: 1 },
    { x: 1.4, y: 1.4, flex: 1 },
    { x: 0, y: 2, flex: 0.1 },
    { x: -1.4, y: 1.4, flex: 1 },
    { x: -2, y: 0, flex: 1 },
    { x: -1.4, y: -1.4, flex: 1 },
    { x: 0, y: -2, flex: 0.1 },
    { x: 1.4, y: -1.4, flex: 1 },
    { x: 1, y: 1, flex: 1 },
    { x: -1, y: -1, flex: 1 }
  ];
  
  const result = findCentroid(coords);
  console.log("Centroid:", result.centroid);
  console.log("\nASCII Plot:");
  console.log(plotASCII(coords, result.centroid));
  
  console.log("\nPoint Details:");
  result.dists.forEach((p, idx) => {
    console.log(`Point ${idx + 1} (${p.x}, ${p.y}):`);
    console.log(`  Distance: ${p.d.toFixed(4)}`);
  });
  

export {
    findCentroid,
}