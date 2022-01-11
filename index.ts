export type Point = [number, number];

export const angleInRadians = (angle: number) => (angle * Math.PI) / 180;

export interface Polygon {
  center: Point;
  vertices: number[];
  vsVertices: number[];
}

/**
 * This rounds numbers up to a specified precision
 * @param number
 * @param precision
 * @returns
 */
export const round = (number: number, precision: number) =>
  Math.round((number + Number.EPSILON) * precision) / precision;

const quadrantFuncs: Array<
  (point: Point, hypCoords: Point, angle: number) => Point
> = [
  (point: Point, hypCoords: Point, angle: number) => [
    point[0] + Math.sin(angleInRadians(angle)) * hypCoords[0],
    point[1] + Math.cos(angleInRadians(angle)) * hypCoords[1],
  ],

  (point: Point, hypCoords: Point, angle: number) => [
    point[0] + Math.cos(angleInRadians(angle - 90)) * hypCoords[0],
    point[1] - Math.sin(angleInRadians(angle - 90)) * hypCoords[1],
  ],

  (point: Point, hypCoords: Point, angle: number) => [
    point[0] - Math.sin(angleInRadians(angle - 180)) * hypCoords[0],
    point[1] - Math.cos(angleInRadians(angle - 180)) * hypCoords[1],
  ],

  (point: Point, hypCoords: Point, angle: number) => [
    point[0] - Math.cos(angleInRadians(angle - 270)) * hypCoords[0],
    point[1] + Math.sin(angleInRadians(angle - 270)) * hypCoords[1],
  ],
];

export const getPolygonCoords = (
  point: Point,
  hypCoords: Point,
  angle: number
) => {
  const cornerCoords: number[] = [];
  const numberOfSides = 360 / angle;

  let quadrantIndex = 0;
  let cumulativeAngle = 0;
  let quadrantMax = 90;

  for (let i = 0; i < numberOfSides; i++) {
    if (cumulativeAngle >= quadrantMax) {
      quadrantIndex++;
      quadrantMax += 90;
    }
    const coords = quadrantFuncs[quadrantIndex](
      point,
      hypCoords,
      cumulativeAngle
    );
    cornerCoords.push(round(coords[0], 100));
    cornerCoords.push(round(coords[1], 100));
    cumulativeAngle += angle;
  }

  return cornerCoords;
};

/**
 *
 * @param pointIndex Like an array index
 * @param vertices
 */
export const getPoint = (pointIndex: number, vertices: number[]): Point => {
  const index = pointIndex * 2;
  return [vertices[index], vertices[index + 1]];
};

export const getShaderPolyVertexCoords = (center: Point, coords: number[]) => {
  const vertices: number[] = [];
  for (let i = 1; i < coords.length / 2; i++) {
    const poin1 = getPoint(i - 1, coords);
    const poin2 = getPoint(i, coords);
    vertices.push(poin1[0]);
    vertices.push(poin1[1]);
    vertices.push(center[0]);
    vertices.push(center[1]);
    vertices.push(poin2[0]);
    vertices.push(poin2[1]);
  }
  vertices.push(coords[coords.length - 2]);
  vertices.push(coords[coords.length - 1]);
  vertices.push(center[0]);
  vertices.push(center[1]);
  vertices.push(coords[0]);
  vertices.push(coords[1]);

  return vertices;
};

export const getPolyVertices = (
  point: Point,
  hypCoords: Point,
  angle: number
) => {
  return getShaderPolyVertexCoords(
    point,
    getPolygonCoords(point, hypCoords, angle)
  );
};

export const convertPolyVerticesToTriangles = (
  point1: Point,
  point2: Point,
  center: Point
) => {
  return [...point1, ...center, ...point2];
};

export const convertPolyCoordsToVSCoords = (
  center: Point,
  coords: number[]
) => {
  let result = [];
  for (let i = 0; i < coords.length - 2; i += 2) {
    result.push(coords[i]);
    result.push(coords[i + 1]);
    result.push(center[0]);
    result.push(center[1]);
    result.push(coords[i + 2]);
    result.push(coords[i + 3]);
  }
  return result;
};

export const getValueClosestTo = (value: number, total: number): number => {
  const count = total / (value * 2);
  return total / Math.round(count) / 2;
};

const calculateXJumps = (xVal: number, hypX: number, gap: number) => {
  return xVal + 2 * hypX - gap * 2;
};

export const splitRectangeIntoHexagons = (
  width: number,
  height: number,
  hyp: Point,
  angle: number
): Array<Polygon> => {
  const hexagons: Array<Polygon> = [];

  let hypX = hyp[0];
  let hypY = hyp[1];

  const newHypX = hypX / Math.cos(angleInRadians(90 - angle));
  const nY = Math.sin(angleInRadians(90 - angle)) * hypY;
  const yCount = Math.round(height / (hyp[1] + nY)) * 2 + 0.5;

  let xGap = newHypX - hypX;

  const generatwRow = (center: Point, normal = false) => {
    let i = 0;
    const y = center[1];
    let count = Math.ceil(width / hypX / 2);
    if (!normal) count += 1;
    let xIndent = hypX;
    if (!normal) {
      xIndent = 0;
    }
    while (i < count) {
      let vertices = getPolygonCoords([xIndent, y], [newHypX, hypY], angle);
      hexagons.push({
        center: [xIndent, y],
        vertices: vertices,
        vsVertices: getShaderPolyVertexCoords([xIndent, y], vertices),
      });

      xIndent = calculateXJumps(xIndent, newHypX, xGap);
      i++;
    }
  };

  for (let l = 0; l < yCount / 2; l++) {
    const newY = l * (hypY + nY);
    generatwRow([0, newY], !!(l % 2));
  }

  return hexagons;
};

export const shuffleArray = (array: any[]): any[] => {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

export const getValInRangeToOne = (start: number, end: number, value: number) =>
  (value - start) / (end - start);
