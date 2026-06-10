import type { OrgUser } from "./types";

export const NODE_W = 188;
export const NODE_H = 72;
const GAP_X = 24;
const GAP_Y = 72;

export interface TreeNode {
  user: OrgUser;
  children: TreeNode[];
}

export interface PositionedNode {
  user: OrgUser;
  x: number; // top-left
  y: number;
  hasChildren: boolean;
  collapsed: boolean;
}

export interface Edge {
  id: string;
  d: string;
}

/** Build a forest from the flat (scope-filtered) user list. */
export function buildForest(users: OrgUser[]): TreeNode[] {
  const byId = new Map(users.map((u) => [u.id, { user: u, children: [] as TreeNode[] }]));
  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    const parent = node.user.managerId ? byId.get(node.user.managerId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  // Stable ordering: bigger teams first, then by name
  const sortRec = (nodes: TreeNode[]) => {
    nodes.sort(
      (a, b) => b.children.length - a.children.length || a.user.name.localeCompare(b.user.name)
    );
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

/**
 * Simple tidy layout: leaves get sequential x slots, parents sit centred
 * over their visible children. Collapsed nodes are treated as leaves.
 */
export function layoutForest(
  roots: TreeNode[],
  collapsedIds: Set<string>
): { nodes: PositionedNode[]; edges: Edge[]; width: number; height: number } {
  const nodes: PositionedNode[] = [];
  const edges: Edge[] = [];
  let nextSlot = 0;
  let maxDepth = 0;

  function place(node: TreeNode, depth: number): number {
    maxDepth = Math.max(maxDepth, depth);
    const collapsed = collapsedIds.has(node.user.id);
    const visibleChildren = collapsed ? [] : node.children;

    let slot: number;
    if (visibleChildren.length === 0) {
      slot = nextSlot;
      nextSlot += 1;
    } else {
      const childSlots = visibleChildren.map((c) => place(c, depth + 1));
      slot = (childSlots[0] + childSlots[childSlots.length - 1]) / 2;
    }

    const x = slot * (NODE_W + GAP_X);
    const y = depth * (NODE_H + GAP_Y);
    nodes.push({
      user: node.user,
      x,
      y,
      hasChildren: node.children.length > 0,
      collapsed,
    });

    for (const child of visibleChildren) {
      const childNode = nodes.find((n) => n.user.id === child.user.id)!;
      const x1 = x + NODE_W / 2;
      const y1 = y + NODE_H;
      const x2 = childNode.x + NODE_W / 2;
      const y2 = childNode.y;
      const midY = (y1 + y2) / 2;
      edges.push({
        id: `${node.user.id}-${child.user.id}`,
        d: `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`,
      });
    }
    return slot;
  }

  roots.forEach((root) => place(root, 0));

  return {
    nodes,
    edges,
    width: Math.max(1, nextSlot) * (NODE_W + GAP_X) - GAP_X,
    height: (maxDepth + 1) * (NODE_H + GAP_Y) - GAP_Y,
  };
}
