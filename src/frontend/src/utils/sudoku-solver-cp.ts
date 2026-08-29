export type Domains = Map<string, Set<number>>;

type SolveStep = {
  row: number;
  col: number;
  value: number;
  action: "set" | "eliminate";
};

function key(row: number, col: number): string {
  return `${row},${col}`;
}

export function initDomains(puzzle: number[][]): Domains {
  const domains: Domains = new Map();

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const val = puzzle[row][col];
      if (val !== 0) {
        domains.set(key(row, col), new Set([val]));
      } else {
        domains.set(key(row, col), new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
      }
    }
  }

  return domains;
}

function getPeers(row: number, col: number): [number, number][] {
  const peers: [number, number][] = [];
  const seen = new Set<string>();

  const add = (r: number, c: number) => {
    if (r === row && c === col) return;
    const k = key(r, c);
    if (!seen.has(k)) {
      seen.add(k);
      peers.push([r, c]);
    }
  };

  // Row peers
  for (let c = 0; c < 9; c++) add(row, c);
  // Column peers
  for (let r = 0; r < 9; r++) add(r, col);
  // Box peers
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      add(boxRow + r, boxCol + c);
    }
  }

  return peers;
}

export function propagate(
  domains: Domains,
  row: number,
  col: number,
  value: number,
): Domains | null {
  const newDomains = new Map<string, Set<number>>();
  for (const [k, v] of domains) {
    newDomains.set(k, new Set(v));
  }

  // Set this cell
  newDomains.set(key(row, col), new Set([value]));

  // Queue for arc-consistency propagation
  const queue: [number, number][] = [[row, col]];

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const domain = newDomains.get(key(r, c))!;

    if (domain.size !== 1) continue;
    const [assignedVal] = domain;

    for (const [pr, pc] of getPeers(r, c)) {
      const peerDomain = newDomains.get(key(pr, pc))!;
      if (peerDomain.has(assignedVal)) {
        peerDomain.delete(assignedVal);
        if (peerDomain.size === 0) return null; // Contradiction
        if (peerDomain.size === 1) {
          queue.push([pr, pc]);
        }
      }
    }
  }

  return newDomains;
}

function domainsToGrid(domains: Domains): number[][] {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const d = domains.get(key(r, c))!;
      if (d.size === 1) {
        const [v] = d;
        grid[r][c] = v;
      }
    }
  }
  return grid;
}

function isSolved(domains: Domains): boolean {
  for (const d of domains.values()) {
    if (d.size !== 1) return false;
  }
  return true;
}

function pickUnassigned(domains: Domains): [number, number] | null {
  // MRV heuristic: pick cell with fewest candidates > 1
  let minSize = 10;
  let best: [number, number] | null = null;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const size = domains.get(key(r, c))!.size;
      if (size > 1 && size < minSize) {
        minSize = size;
        best = [r, c];
      }
    }
  }

  return best;
}

export function solveWithCP(puzzle: number[][]): {
  solution: number[][] | null;
  steps: SolveStep[];
} {
  const steps: SolveStep[] = [];
  let domains = initDomains(puzzle);

  // Initial propagation for all given cells
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle[r][c] !== 0) {
        const result = propagate(domains, r, c, puzzle[r][c]);
        if (!result) return { solution: null, steps };
        // Record eliminations
        for (let pr = 0; pr < 9; pr++) {
          for (let pc = 0; pc < 9; pc++) {
            const oldSize = domains.get(key(pr, pc))!.size;
            const newSize = result.get(key(pr, pc))!.size;
            if (newSize < oldSize && (pr !== r || pc !== c)) {
              const oldDomain = domains.get(key(pr, pc))!;
              const newDomain = result.get(key(pr, pc))!;
              for (const v of oldDomain) {
                if (!newDomain.has(v)) {
                  steps.push({
                    row: pr,
                    col: pc,
                    value: v,
                    action: "eliminate",
                  });
                }
              }
            }
          }
        }
        steps.push({ row: r, col: c, value: puzzle[r][c], action: "set" });
        domains = result;
      }
    }
  }

  function backtrack(currentDomains: Domains): Domains | null {
    if (isSolved(currentDomains)) return currentDomains;

    const cell = pickUnassigned(currentDomains);
    if (!cell) return null;

    const [r, c] = cell;
    const candidates = [...currentDomains.get(key(r, c))!];

    for (const val of candidates) {
      const result = propagate(currentDomains, r, c, val);
      if (result) {
        steps.push({ row: r, col: c, value: val, action: "set" });
        const final = backtrack(result);
        if (final) return final;
      }
    }

    return null;
  }

  const finalDomains = backtrack(domains);
  if (!finalDomains) return { solution: null, steps };

  return { solution: domainsToGrid(finalDomains), steps };
}
