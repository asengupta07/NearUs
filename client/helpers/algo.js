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

function findOverlappingArea(coords) {
  const minX = Math.max(...coords.map(c => c.x - c.maxDistance));
  const maxX = Math.min(...coords.map(c => c.x + c.maxDistance));
  const minY = Math.max(...coords.map(c => c.y - c.maxDistance));
  const maxY = Math.min(...coords.map(c => c.y + c.maxDistance));

  if (minX <= maxX && minY <= maxY) {
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  }
  return null;
}

function findCentroid(coords) {
  const overlappingPoint = findOverlappingArea(coords);
  
  if (!overlappingPoint) {
    throw new Error("No overlapping area found. Users' travel ranges do not intersect.");
  }

  const dists = coords.map(({ x, y, maxDistance }) => {
    const d = dist({ x, y }, overlappingPoint);
    return { x, y, d, maxDistance };
  });

  return { centroid: overlappingPoint, dists };
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
      grid[row][col] = (idx + 1).toString().padStart(2, '0');
    }
  });

  const [centroidRow, centroidCol] = mapGrid(c.x, c.y);
  if (centroidRow >= 0 && centroidRow < size && centroidCol >= 0 && centroidCol < size) {
    grid[centroidRow][centroidCol] = 'C ';
  }

  return grid.map(row => row.join(' ')).join('\n');
}

const coords = [
  { x: 2, y: 0, maxDistance: 4 },
  { x: 1.4, y: 1.4, maxDistance: 4 },
  { x: 0, y: 2, maxDistance: 5 },
  { x: -1.4, y: 1.4, maxDistance: 1 },
  { x: -2, y: 0, maxDistance: 5 },
  { x: -1.4, y: -1.4, maxDistance: 5 },
  { x: 0, y: -2, maxDistance: 5 },
  { x: 1.4, y: -1.4, maxDistance: 3 },
  { x: 1, y: 1, maxDistance: 5 },
  { x: -1, y: -1, maxDistance: 5 }
];

try {
  const result = findCentroid(coords);
  console.log("Centroid:", result.centroid);
  console.log("\nASCII Plot:");
  console.log(plotASCII(coords, result.centroid));

  console.log("\nPoint Details:");
  result.dists.forEach((p, idx) => {
    console.log(`User ${idx + 1} (${p.x}, ${p.y}):`);
    console.log(`  Distance to centroid: ${p.d.toFixed(2)} km`);
    console.log(`  Max travel distance: ${p.maxDistance} km`);
  });
} catch (error) {
  console.error("Error:", error.message);
}

// export {
//   findCentroid,
// };